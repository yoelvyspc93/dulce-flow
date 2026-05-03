import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  deleteExpenseAsync,
  getExpenseAsync,
  updateExpenseAsync,
} from "@/features/expenses/services/expense.service";
import { SUPPLY_UNITS } from "@/features/supplies/validations/supply.schema";
import { Badge, Button, ConfirmDialog, EmptyState, ListItem, Screen, SelectField, SurfaceCard, TextField } from "@/shared/ui";
import type { Expense } from "@/shared/types";
import { formatMoney } from "@/shared/utils/money";
import { colors, spacing, typography } from "@/theme";

export function ExpenseDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const expenseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [supplyName, setSupplyName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<(typeof SUPPLY_UNITS)[number]>("unidad");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const calculatedTotal = Number(quantity || 0) * Number(unitPrice || 0);
  const total = Number.isFinite(calculatedTotal) ? Number(calculatedTotal.toFixed(2)) : 0;

  useEffect(() => {
    let isMounted = true;

    async function loadExpenseAsync() {
      setIsLoading(true);
      setLoadErrorMessage("");

      try {
        const loadedExpense = expenseId ? await getExpenseAsync(expenseId) : null;

        if (isMounted) {
          setExpense(loadedExpense);

          if (loadedExpense) {
            setSupplyName(loadedExpense.supplyName);
            setQuantity(String(loadedExpense.quantity));
            setUnit(SUPPLY_UNITS.includes(loadedExpense.unit as (typeof SUPPLY_UNITS)[number]) ? (loadedExpense.unit as (typeof SUPPLY_UNITS)[number]) : "unidad");
            setUnitPrice(String(loadedExpense.unitPrice));
            setNote(loadedExpense.note ?? "");
          }
        }
      } catch {
        if (isMounted) {
          setLoadErrorMessage("No se pudo cargar el gasto.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadExpenseAsync();

    return () => {
      isMounted = false;
    };
  }, [expenseId]);

  async function handleSaveAsync() {
    if (!expense) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedExpense = await updateExpenseAsync(expense, {
        supplyId: expense.supplyId,
        supplyName,
        quantity: Number(quantity),
        unit,
        unitPrice: Number(unitPrice),
        note,
      });
      setExpense(updatedExpense);
      router.replace("/expenses");
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else {
        setErrorMessage("No se pudo actualizar el gasto.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAsync() {
    if (!expense) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteExpenseAsync(expense);
      setIsDeleteDialogVisible(false);
      router.replace("/expenses");
    } catch {
      setErrorMessage("No se pudo anular el gasto.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <Screen title="Detalle de gasto" backHref="/expenses">
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Buscando gasto...</Text>
        </View>
      </Screen>
    );
  }

  if (loadErrorMessage) {
    return (
      <Screen title="Detalle de gasto" backHref="/expenses">
        <EmptyState eyebrow="Gasto" title="No se pudo cargar" description={loadErrorMessage} />
        <Button label="Volver a gastos" onPress={() => router.replace("/expenses")} />
      </Screen>
    );
  }

  if (!expense) {
    return (
      <Screen title="Detalle de gasto" backHref="/expenses">
        <EmptyState eyebrow="Gasto" title="Gasto no encontrado" description="Vuelve al listado y selecciona otro gasto." />
        <Button label="Volver a gastos" onPress={() => router.replace("/expenses")} />
      </Screen>
    );
  }

  return (
    <Screen title="Detalle de gasto" backHref="/expenses">
      <ListItem
        title="Estado"
        subtitle="Los gastos eliminados salen del listado y no crean ingresos"
        trailing={<Badge label={expense.status === "active" ? "Activo" : "Anulado"} tone={expense.status === "active" ? "success" : "danger"} />}
      />
      <ListItem title="Impacto" subtitle="Cada gasto activo descuenta dinero del resumen financiero" />
      <TextField
        editable={false}
        label="Nombre"
        onChangeText={setSupplyName}
        placeholder="Insumo"
        value={supplyName}
      />
      <TextField
        editable={expense.status === "active"}
        keyboardType="decimal-pad"
        label="Cantidad"
        onChangeText={setQuantity}
        placeholder="1"
        value={quantity}
        helperText="Cantidad comprada del insumo."
      />
      <SelectField
        disabled={expense.status !== "active"}
        label="Unidad"
        onValueChange={(selectedUnit) => setUnit(selectedUnit as (typeof SUPPLY_UNITS)[number])}
        options={SUPPLY_UNITS.map((item) => ({ label: item, value: item }))}
        value={unit}
      />
      <TextField
        editable={expense.status === "active"}
        keyboardType="decimal-pad"
        label="Precio unitario"
        onChangeText={setUnitPrice}
        placeholder="$0.00"
        value={unitPrice}
      />
      <TextField
        editable={expense.status === "active"}
        label="Nota"
        onChangeText={setNote}
        placeholder="Detalle opcional"
        value={note}
        multiline
      />
      <SurfaceCard tone="accent">
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatMoney(total)}</Text>
        </View>
      </SurfaceCard>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {expense.status === "active" ? (
        <View style={{ gap: 12 }}>
          <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
          <Button label="Anular gasto" onPress={() => setIsDeleteDialogVisible(true)} variant="outlineLight" />
        </View>
      ) : null}
      <ConfirmDialog
        confirmLabel="Anular gasto"
        description="El gasto saldra del listado activo y dejara de descontarse del resumen financiero."
        isLoading={isDeleting}
        onCancel={() => setIsDeleteDialogVisible(false)}
        onConfirm={handleDeleteAsync}
        title="Anular gasto"
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
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  totalLabel: {
    color: colors.textMuted,
    textTransform: "uppercase",
    ...typography.caption,
  },
  totalValue: {
    color: colors.text,
    ...typography.section,
  },
});
