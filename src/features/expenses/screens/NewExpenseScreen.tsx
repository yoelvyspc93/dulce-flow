import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import { createExpenseAsync } from "@/features/expenses/services/expense.service";
import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { SUPPLY_UNITS } from "@/features/supplies/validations/supply.schema";
import { Button, Screen, SelectField, SurfaceCard, TextField } from "@/shared/ui";
import type { Supply } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function NewExpenseScreen() {
  const [activeSupplies, setActiveSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<(typeof SUPPLY_UNITS)[number]>("unidad");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedSupply = activeSupplies.find((supply) => supply.id === selectedSupplyId);
  const calculatedTotal = Number(quantity || 0) * Number(unitPrice || 0);

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliesAsync() {
      const supplies = await listSuppliesAsync();

      if (isMounted) {
        const active = supplies.filter((supply) => supply.isActive);
        setActiveSupplies(active);
        setSelectedSupplyId(active[0]?.id ?? "");
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

    setUnit(SUPPLY_UNITS.includes(selectedSupply.unit as (typeof SUPPLY_UNITS)[number]) ? (selectedSupply.unit as (typeof SUPPLY_UNITS)[number]) : "unidad");
    setUnitPrice(String(selectedSupply.defaultPrice));
  }, [selectedSupply]);

  const supplyOptions = activeSupplies.map((supply) => ({ label: supply.name, value: supply.id }));
  const total = Number.isFinite(calculatedTotal) ? Number(calculatedTotal.toFixed(2)) : 0;

  async function handleSaveAsync() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await createExpenseAsync({
        supplyId: selectedSupplyId,
        supplyName: selectedSupply?.name ?? "",
        quantity: Number(quantity),
        unit,
        unitPrice: Number(unitPrice),
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
        value={selectedSupply?.id ?? ""}
        helperText={activeSupplies.length === 0 ? "Crea un insumo activo antes de registrar gastos." : undefined}
      />
      <TextField
        keyboardType="decimal-pad"
        label="Cantidad"
        onChangeText={setQuantity}
        placeholder="1"
        value={quantity}
        helperText="Cantidad comprada del insumo."
      />
      <SelectField
        label="Unidad"
        onValueChange={(selectedUnit) => setUnit(selectedUnit as (typeof SUPPLY_UNITS)[number])}
        options={SUPPLY_UNITS.map((item) => ({ label: item, value: item }))}
        value={unit}
      />
      <TextField
        keyboardType="decimal-pad"
        label="Precio unitario"
        onChangeText={setUnitPrice}
        placeholder="$0.00"
        value={unitPrice}
        helperText="Se carga desde el precio establecido del insumo."
      />
      <TextField label="Nota" onChangeText={setNote} placeholder="Detalle opcional" value={note} multiline />
      <SurfaceCard tone="accent">
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </SurfaceCard>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Button disabled={isSaving || activeSupplies.length === 0} label={isSaving ? "Guardando..." : "Guardar gasto"} onPress={handleSaveAsync} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: spacing.xs,
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
