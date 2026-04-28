import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ZodError } from "zod";

import { createSupplyAsync } from "@/features/supplies/services/supply.service";
import { SUPPLY_CATEGORIES } from "@/features/supplies/validations/supply.schema";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import { colors, spacing, typography } from "@/theme";

export function NewSupplyScreen() {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const category = SUPPLY_CATEGORIES[categoryIndex];

  async function handleSaveAsync() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await createSupplyAsync({
        name,
        unit,
        category,
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
    <Screen title="Nuevo insumo" subtitle="Pantalla base del catalogo de insumos.">
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
