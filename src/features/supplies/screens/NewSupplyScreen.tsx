import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ZodError } from "zod";

import { createSupplyAsync } from "@/features/supplies/services/supply.service";
import { SUPPLY_UNITS } from "@/features/supplies/validations/supply.schema";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import { colors, spacing, typography } from "@/theme";

export function NewSupplyScreen() {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<(typeof SUPPLY_UNITS)[number]>("unidad");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveAsync() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await createSupplyAsync({
        name,
        unit,
        defaultPrice: defaultPrice ? Number(defaultPrice) : undefined,
      });
      router.replace("/supplies");
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else {
        setErrorMessage("No se pudo guardar el insumo.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen title="Nuevo insumo" backHref="/supplies">
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
      <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar insumo"} onPress={handleSaveAsync} />
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
