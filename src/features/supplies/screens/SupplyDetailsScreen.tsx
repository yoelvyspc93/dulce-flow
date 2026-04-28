import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
  const [supply, setSupply] = useState<Supply | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const category = SUPPLY_CATEGORIES[categoryIndex];

  useEffect(() => {
    let isActive = true;

    async function loadSupplyAsync() {
      const loadedSupply = params.id ? await getSupplyAsync(params.id) : null;

      if (isActive && loadedSupply) {
        setSupply(loadedSupply);
        setName(loadedSupply.name);
        setUnit(loadedSupply.unit);
        setCategoryIndex(Math.max(0, SUPPLY_CATEGORIES.findIndex((item) => item === loadedSupply.category)));
      }
    }

    void loadSupplyAsync();

    return () => {
      isActive = false;
    };
  }, [params.id]);

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
        onPress={() => setCategoryIndex((current) => (current + 1) % SUPPLY_CATEGORIES.length)}
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
});
