import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ZodError } from "zod";

import { createExpenseAsync } from "@/features/expenses/services/expense.service";
import { EXPENSE_CATEGORIES } from "@/features/expenses/validations/expense.schema";
import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import type { Supply } from "@/shared/types";
import { formatExpenseCategory } from "@/shared/utils/labels";
import { colors, spacing, typography } from "@/theme";

export function NewExpenseScreen() {
  const [activeSupplies, setActiveSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState("manual");
  const [manualName, setManualName] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedSupply = activeSupplies.find((supply) => supply.id === selectedSupplyId);
  const category = EXPENSE_CATEGORIES[categoryIndex];
  const calculatedTotal =
    quantity && unitPrice ? Number(quantity || 0) * Number(unitPrice || 0) : Number(total || 0);
  const canAutoCalculateTotal = Boolean(quantity && unitPrice);

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliesAsync() {
      const supplies = await listSuppliesAsync();

      if (isMounted) {
        const active = supplies.filter((supply) => supply.isActive);
        setActiveSupplies(active);
        setSelectedSupplyId(active[0]?.id ?? "manual");
      }
    }

    void loadSuppliesAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSupply) {
      return;
    }

    setUnit(selectedSupply.unit);
    if (selectedSupply.defaultPrice) {
      setUnitPrice(String(selectedSupply.defaultPrice));
    }
  }, [selectedSupply]);

  useEffect(() => {
    if (canAutoCalculateTotal && Number.isFinite(calculatedTotal)) {
      setTotal(String(Number(calculatedTotal.toFixed(2))));
    }
  }, [calculatedTotal, canAutoCalculateTotal]);

  const supplyOptions = [
    ...activeSupplies.map((supply) => ({ label: supply.name, value: supply.id })),
    { label: "Gasto sin insumo", value: "manual" },
  ];

  async function handleSaveAsync() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await createExpenseAsync({
        supplyId: selectedSupply?.id,
        supplyName: selectedSupply?.name ?? manualName,
        category,
        quantity: quantity ? Number(quantity) : undefined,
        unit: selectedSupply?.unit ?? unit,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
        total: Number(total),
        note,
      });
      router.replace("/expenses");
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else {
        setErrorMessage("No se pudo guardar el gasto.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen title="Nuevo gasto" backHref="/expenses">
      <SelectField
        label="Insumo"
        onValueChange={setSelectedSupplyId}
        options={supplyOptions}
        value={selectedSupply?.id ?? "manual"}
      />
      {!selectedSupply ? (
        <TextField label="Nombre manual" onChangeText={setManualName} placeholder="Gasto general" value={manualName} />
      ) : null}
      <SelectField
        label="Categoria"
        onValueChange={(selectedCategory) => {
          setCategoryIndex(Math.max(0, EXPENSE_CATEGORIES.findIndex((item) => item === selectedCategory)));
        }}
        options={EXPENSE_CATEGORIES.map((item) => ({ label: formatExpenseCategory(item), value: item }))}
        value={category}
      />
      <TextField
        keyboardType="decimal-pad"
        label="Cantidad"
        onChangeText={setQuantity}
        placeholder="Opcional"
        value={quantity}
        helperText="Cantidad comprada del insumo o gasto."
      />
      <TextField label="Unidad" onChangeText={setUnit} placeholder="kg, unidad, caja..." value={unit} />
      <TextField
        keyboardType="decimal-pad"
        label="Precio unitario"
        onChangeText={setUnitPrice}
        placeholder="$0.00"
        value={unitPrice}
        helperText="Si hay cantidad y precio unitario, el total se calcula automaticamente."
      />
      <TextField
        editable={!canAutoCalculateTotal}
        keyboardType="decimal-pad"
        label="Total"
        onChangeText={setTotal}
        placeholder="$0.00"
        value={total}
        helperText={canAutoCalculateTotal ? "Calculado como cantidad por precio unitario." : "Escribelo si no registras cantidad o precio unitario."}
      />
      <TextField label="Nota" onChangeText={setNote} placeholder="Detalle opcional" value={note} multiline />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar gasto"} onPress={handleSaveAsync} />
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
