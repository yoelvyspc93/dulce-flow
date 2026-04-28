import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ZodError } from "zod";

import { createProductAsync } from "@/features/products/services/product.service";
import { Button, Screen, TextField } from "@/shared/ui";
import { colors, spacing, typography } from "@/theme";

export function NewProductScreen() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveAsync() {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await createProductAsync({
        name,
        price: Number(price),
        description,
      });
      router.replace("/products");
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else {
        setErrorMessage("No se pudo guardar el producto.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen title="Nuevo producto">
      <TextField label="Nombre" onChangeText={setName} placeholder="Cupcake de vainilla" value={name} />
      <TextField
        keyboardType="decimal-pad"
        label="Precio"
        onChangeText={setPrice}
        placeholder="$0.00"
        value={price}
      />
      <TextField label="Descripcion" onChangeText={setDescription} placeholder="Opcional" value={description} multiline />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar producto"} onPress={handleSaveAsync} />
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
