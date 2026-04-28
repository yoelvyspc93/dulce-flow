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
  const [selectedSupplyIndex, setSelectedSupplyIndex] = useState(-1);
  const [manualName, setManualName] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedSupply = selectedSupplyIndex >= 0 ? activeSupplies[selectedSupplyIndex] : undefined;
  const category = selectedSupply?.category ?? EXPENSE_CATEGORIES[categoryIndex];

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliesAsync() {
      const supplies = await listSuppliesAsync();

      if (isMounted) {
        const active = supplies.filter((supply) => supply.isActive);
        setActiveSupplies(active);
        setSelectedSupplyIndex(active.length > 0 ? 0 : -1);
      }
    }

    void loadSuppliesAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  const supplyLabel = selectedSupply ? selectedSupply.name : "Gasto sin insumo";

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
    <Screen title="Nuevo gasto" subtitle="Base de formulario para la fase de gastos.">
      <SelectField
        label="Insumo"
        onPress={() => {
          setSelectedSupplyIndex((current) => {
            if (activeSupplies.length === 0) {
              return -1;
            }

            return current >= activeSupplies.length - 1 ? -1 : current + 1;
          });
        }}
        value={supplyLabel}
      />
      {!selectedSupply ? (
        <TextField label="Nombre manual" onChangeText={setManualName} placeholder="Gasto general" value={manualName} />
      ) : null}
      <SelectField
        label="Categoria"
        onPress={() => setCategoryIndex((current) => (current + 1) % EXPENSE_CATEGORIES.length)}
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
