import { router, useLocalSearchParams } from "expo-router";
import { AlertTriangle, SearchX } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  deleteSupplyPermanentlyAsync,
  getSupplyAsync,
  getSupplyUsageCountAsync,
  setSupplyActiveAsync,
  updateSupplyAsync,
} from "@/features/supplies/services/supply.service";
import { SUPPLY_UNITS } from "@/features/supplies/validations/supply.schema";
import { Badge, Button, ConfirmDialog, EmptyState, ListItem, Screen, SelectField, TextField } from "@/shared/ui";
import type { Supply } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function SupplyDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const supplyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [supply, setSupply] = useState<Supply | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<(typeof SUPPLY_UNITS)[number]>("unidad");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSupplyAsync() {
      setIsLoading(true);
      setLoadErrorMessage("");

      try {
        const [loadedSupply, loadedUsageCount] = await Promise.all([
          supplyId ? getSupplyAsync(supplyId) : Promise.resolve(null),
          supplyId ? getSupplyUsageCountAsync(supplyId) : Promise.resolve(0),
        ]);

        if (isActive) {
          setSupply(loadedSupply);
          setUsageCount(loadedUsageCount);

          if (loadedSupply) {
            setName(loadedSupply.name);
            setUnit(SUPPLY_UNITS.includes(loadedSupply.unit as (typeof SUPPLY_UNITS)[number]) ? (loadedSupply.unit as (typeof SUPPLY_UNITS)[number]) : "unidad");
            setDefaultPrice(loadedSupply.defaultPrice ? String(loadedSupply.defaultPrice) : "");
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
        defaultPrice: Number(defaultPrice),
      });
      setSupply(updatedSupply);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else if (error instanceof Error && error.message === "SUPPLY_NAME_DUPLICATED") {
        setErrorMessage("Ya existe un insumo con ese nombre.");
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

  async function handleDeleteAsync() {
    if (!supply) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteSupplyPermanentlyAsync(supply);
      setIsDeleteDialogVisible(false);
      router.replace("/supplies");
    } catch (error) {
      if (error instanceof Error && error.message === "SUPPLY_HAS_HISTORY") {
        setErrorMessage("Este insumo tiene gastos o recetas asociadas. Puedes desactivarlo para ocultarlo de nuevos registros.");
      } else {
        setErrorMessage("No se pudo eliminar el insumo.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <Screen title="Detalle de insumo" backHref="/supplies">
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Buscando insumo...</Text>
        </View>
      </Screen>
    );
  }

  if (loadErrorMessage) {
    return (
      <Screen title="Detalle de insumo" backHref="/supplies">
        <EmptyState
          action={{ label: "Volver al catalogo", onPress: () => router.replace("/supplies") }}
          icon={AlertTriangle}
          title="No se pudo cargar"
          description={loadErrorMessage}
        />
      </Screen>
    );
  }

  if (!supply) {
    return (
      <Screen title="Detalle de insumo" backHref="/supplies">
        <EmptyState
          action={{ label: "Volver al catalogo", onPress: () => router.replace("/supplies") }}
          icon={SearchX}
          title="Insumo no encontrado"
          description="Vuelve al catalogo y selecciona otro insumo."
        />
      </Screen>
    );
  }

  return (
    <Screen title="Detalle de insumo" backHref="/supplies">
      <ListItem
        title="Estado"
        subtitle="Los insumos usados no se eliminan fisicamente"
        trailing={<Badge label={supply.isActive ? "Activo" : "Inactivo"} tone={supply.isActive ? "success" : "neutral"} />}
      />
      <TextField label="Nombre" onChangeText={setName} placeholder="Harina" value={name} />
      <SelectField
        label="Unidad"
        onValueChange={(selectedUnit) => setUnit(selectedUnit as (typeof SUPPLY_UNITS)[number])}
        options={SUPPLY_UNITS.map((item) => ({ label: item, value: item }))}
        value={unit}
      />
      <TextField
        keyboardType="decimal-pad"
        label="Precio establecido"
        onChangeText={setDefaultPrice}
        placeholder="$0.00"
        value={defaultPrice}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={{ gap: 12 }}>
        <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
        <Button
          label={supply.isActive ? "Desactivar insumo" : "Activar insumo"}
          onPress={handleToggleActiveAsync}
          variant="outlineLight"
        />
        {usageCount === 0 ? (
          <Button label="Eliminar permanentemente" onPress={() => setIsDeleteDialogVisible(true)} variant="outlineLight" />
        ) : (
          <Text style={styles.helperText}>Este insumo tiene historial. Para conservar gastos y recetas, solo se puede desactivar.</Text>
        )}
      </View>
      <ConfirmDialog
        confirmLabel="Eliminar"
        description="El insumo se eliminara permanentemente y no se podra recuperar."
        isLoading={isDeleting}
        onCancel={() => setIsDeleteDialogVisible(false)}
        onConfirm={handleDeleteAsync}
        title="Eliminar insumo"
        visible={isDeleteDialogVisible}
      />
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
  helperText: {
    color: colors.textMuted,
    ...typography.caption,
  },
});
