import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  deleteExpenseAsync,
  getExpenseAsync,
  updateExpenseAsync,
} from "@/features/expenses/services/expense.service";
import { EXPENSE_CATEGORIES } from "@/features/expenses/validations/expense.schema";
import { Badge, Button, EmptyState, ListItem, Screen, SelectField, TextField } from "@/shared/ui";
import type { Expense } from "@/shared/types";
import { formatExpenseCategory } from "@/shared/utils/labels";
import { colors, spacing, typography } from "@/theme";

export function ExpenseDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const expenseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [supplyName, setSupplyName] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const category = EXPENSE_CATEGORIES[categoryIndex];
  const calculatedTotal =
    quantity && unitPrice ? Number(quantity || 0) * Number(unitPrice || 0) : Number(total || 0);
  const canAutoCalculateTotal = Boolean(quantity && unitPrice);

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
            setCategoryIndex(Math.max(0, EXPENSE_CATEGORIES.findIndex((item) => item === loadedExpense.category)));
            setQuantity(loadedExpense.quantity ? String(loadedExpense.quantity) : "");
            setUnit(loadedExpense.unit ?? "");
            setUnitPrice(loadedExpense.unitPrice ? String(loadedExpense.unitPrice) : "");
            setTotal(String(loadedExpense.total));
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

  useEffect(() => {
    if (expense?.status === "active" && canAutoCalculateTotal && Number.isFinite(calculatedTotal)) {
      setTotal(String(Number(calculatedTotal.toFixed(2))));
    }
  }, [calculatedTotal, canAutoCalculateTotal, expense?.status]);

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
        category,
        quantity: quantity ? Number(quantity) : undefined,
        unit,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
        total: Number(total),
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

    await deleteExpenseAsync(expense);
    router.replace("/expenses");
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
        trailing={<Badge label={expense.status === "active" ? "Activo" : "Anulado"} tone={expense.status === "active" ? "success" : "neutral"} />}
      />
      <ListItem title="Impacto" subtitle="Cada gasto activo descuenta dinero del resumen financiero" />
      <TextField
        editable={expense.status === "active"}
        label="Nombre"
        onChangeText={setSupplyName}
        placeholder="Gasto general"
        value={supplyName}
      />
      <SelectField
        label="Categoria"
        disabled={expense.status !== "active"}
        onValueChange={(selectedCategory) => {
          setCategoryIndex(Math.max(0, EXPENSE_CATEGORIES.findIndex((item) => item === selectedCategory)));
        }}
        options={EXPENSE_CATEGORIES.map((item) => ({ label: formatExpenseCategory(item), value: item }))}
        value={category}
      />
      <TextField
        editable={expense.status === "active"}
        keyboardType="decimal-pad"
        label="Cantidad"
        onChangeText={setQuantity}
        placeholder="Opcional"
        value={quantity}
        helperText="Cantidad comprada del insumo o gasto."
      />
      <TextField
        editable={expense.status === "active"}
        label="Unidad"
        onChangeText={setUnit}
        placeholder="kg, unidad, caja..."
        value={unit}
      />
      <TextField
        editable={expense.status === "active"}
        keyboardType="decimal-pad"
        label="Precio unitario"
        onChangeText={setUnitPrice}
        placeholder="$0.00"
        value={unitPrice}
        helperText="Si hay cantidad y precio unitario, el total se calcula automaticamente."
      />
      <TextField
        editable={expense.status === "active" && !canAutoCalculateTotal}
        keyboardType="decimal-pad"
        label="Total"
        onChangeText={setTotal}
        placeholder="$0.00"
        value={total}
        helperText={canAutoCalculateTotal ? "Calculado como cantidad por precio unitario." : "Escribelo si no registras cantidad o precio unitario."}
      />
      <TextField
        editable={expense.status === "active"}
        label="Nota"
        onChangeText={setNote}
        placeholder="Detalle opcional"
        value={note}
        multiline
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {expense.status === "active" ? (
        <View style={{ gap: 12 }}>
          <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
          <Button label="Anular gasto" onPress={handleDeleteAsync} variant="secondary" />
        </View>
      ) : null}
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
