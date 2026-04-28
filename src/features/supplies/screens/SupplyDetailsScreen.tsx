import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  getSupplyAsync,
  setSupplyActiveAsync,
  updateSupplyAsync,
} from "@/features/supplies/services/supply.service";
import { SUPPLY_CATEGORIES } from "@/features/supplies/validations/supply.schema";
import { Badge, Button, EmptyState, ListItem, Screen, SelectField, TextField } from "@/shared/ui";
import type { Supply } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function SupplyDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const supplyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [supply, setSupply] = useState<Supply | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const category = SUPPLY_CATEGORIES[categoryIndex];

  useEffect(() => {
    let isActive = true;

    async function loadSupplyAsync() {
      setIsLoading(true);
      setLoadErrorMessage("");

      try {
        const loadedSupply = supplyId ? await getSupplyAsync(supplyId) : null;

        if (isActive) {
          setSupply(loadedSupply);

          if (loadedSupply) {
            setName(loadedSupply.name);
            setUnit(loadedSupply.unit);
            setCategoryIndex(Math.max(0, SUPPLY_CATEGORIES.findIndex((item) => item === loadedSupply.category)));
          }
        }
      } catch {
        if (isActive) {
          setLoadErrorMessage("No se pudo cargar el insumo.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSupplyAsync();

    return () => {
      isActive = false;
    };
  }, [supplyId]);

  async function handleSaveAsync() {
    if (!supply) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedSupply = await updateSupplyAsync(supply, {
        name,
        unit,
        category,
      });
      setSupply(updatedSupply);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else {
        setErrorMessage("No se pudo actualizar el insumo.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActiveAsync() {
    if (!supply) {
      return;
    }

    const updatedSupply = await setSupplyActiveAsync(supply, !supply.isActive);
    setSupply(updatedSupply);
  }

  if (isLoading) {
    return (
      <Screen title="Detalle de insumo" subtitle="Cargando informacion del catalogo.">
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Buscando insumo...</Text>
        </View>
      </Screen>
    );
  }

  if (loadErrorMessage) {
    return (
      <Screen title="Detalle de insumo" subtitle="Hubo un problema al abrir esta pantalla.">
        <EmptyState eyebrow="Insumo" title="No se pudo cargar" description={loadErrorMessage} />
        <Button label="Volver al catalogo" onPress={() => router.replace("/supplies")} />
      </Screen>
    );
  }

  if (!supply) {
    return (
      <Screen title="Detalle de insumo" subtitle="Quedara conectado al CRUD de insumos.">
        <EmptyState eyebrow="Insumo" title="Insumo no encontrado" description="Vuelve al catalogo y selecciona otro insumo." />
        <Button label="Volver al catalogo" onPress={() => router.replace("/supplies")} />
      </Screen>
    );
  }

  return (
    <Screen title="Detalle de insumo" subtitle="Edita datos sin eliminar el historial del catalogo.">
      <ListItem
        title="Estado"
        subtitle="Los insumos usados no se eliminan fisicamente"
        trailing={<Badge label={supply.isActive ? "Activo" : "Inactivo"} tone={supply.isActive ? "success" : "neutral"} />}
      />
      <TextField label="Nombre" onChangeText={setName} placeholder="Harina" value={name} />
      <TextField label="Unidad" onChangeText={setUnit} placeholder="kg, unidad, caja..." value={unit} />
      <SelectField
        label="Categoria sugerida"
        onValueChange={(selectedCategory) => {
          setCategoryIndex(Math.max(0, SUPPLY_CATEGORIES.findIndex((item) => item === selectedCategory)));
        }}
        options={SUPPLY_CATEGORIES.map((item) => ({ label: item, value: item }))}
        value={category}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={{ gap: 12 }}>
        <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
        <Button
          label={supply.isActive ? "Desactivar insumo" : "Activar insumo"}
          onPress={handleToggleActiveAsync}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: spacing.xs,
  },
  loadingState: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    color: colors.textMuted,
    ...typography.body,
  },
});
