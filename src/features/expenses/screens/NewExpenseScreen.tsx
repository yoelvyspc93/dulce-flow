import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ZodError } from "zod";

import { createExpenseAsync } from "@/features/expenses/services/expense.service";
import { EXPENSE_CATEGORIES } from "@/features/expenses/validations/expense.schema";
import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import type { Supply } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function NewExpenseScreen() {
  const [activeSupplies, setActiveSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState("manual");
  const [manualName, setManualName] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedSupply = activeSupplies.find((supply) => supply.id === selectedSupplyId);
  const category = selectedSupply?.category ?? EXPENSE_CATEGORIES[categoryIndex];

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
    <Screen title="Nuevo gasto">
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
        disabled={Boolean(selectedSupply)}
        onValueChange={(selectedCategory) => {
          setCategoryIndex(Math.max(0, EXPENSE_CATEGORIES.findIndex((item) => item === selectedCategory)));
        }}
        options={EXPENSE_CATEGORIES.map((item) => ({ label: item, value: item }))}
        value={category}
      />
      <TextField keyboardType="decimal-pad" label="Cantidad" onChangeText={setQuantity} placeholder="Opcional" value={quantity} />
      <TextField label="Unidad" onChangeText={setUnit} placeholder="kg, unidad, caja..." value={selectedSupply?.unit ?? unit} />
      <TextField keyboardType="decimal-pad" label="Total" onChangeText={setTotal} placeholder="$0.00" value={total} />
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
