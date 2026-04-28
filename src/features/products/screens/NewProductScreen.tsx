import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  calculateRecipeCost,
  createProductWithRecipeAsync,
  suggestSalePrice,
} from "@/features/products/services/product.service";
import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import type { Supply } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

type RecipeLine = {
  id: string;
  supplyId: string;
  supplyName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

export function NewProductScreen() {
  const [activeSupplies, setActiveSupplies] = useState<Supply[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [marginPercent, setMarginPercent] = useState("30");
  const [recipeItems, setRecipeItems] = useState<RecipeLine[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const recipeCost = calculateRecipeCost(
    recipeItems.map((item) => ({
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    }))
  );
  const suggestedPrice = suggestSalePrice(recipeCost, Number(marginPercent || 0));
  const supplyOptions =
    activeSupplies.length > 0
      ? activeSupplies.map((supply) => ({ label: supply.name, value: supply.id }))
      : [{ label: "Sin insumos activos", value: "empty", disabled: true }];

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliesAsync() {
      const supplies = await listSuppliesAsync();

      if (isMounted) {
        setActiveSupplies(supplies.filter((supply) => supply.isActive));
      }
    }

    void loadSuppliesAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateRecipeItem(id: string, patch: Partial<RecipeLine>) {
    setRecipeItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const next = { ...item, ...patch };
        if (patch.supplyId) {
          const supply = activeSupplies.find((candidate) => candidate.id === patch.supplyId);
          if (supply) {
            next.supplyName = supply.name;
            next.unit = supply.unit;
            next.unitPrice = supply.defaultPrice ? String(supply.defaultPrice) : next.unitPrice;
          }
        }

        return next;
      })
    );
  }

  function addRecipeItem() {
    const supply = activeSupplies[0];
    if (!supply) {
      return;
    }

    setRecipeItems((current) => [
      ...current,
      {
        id: `recipe_${Date.now()}`,
        supplyId: supply.id,
        supplyName: supply.name,
        quantity: "",
        unit: supply.unit,
        unitPrice: supply.defaultPrice ? String(supply.defaultPrice) : "",
      },
    ]);
  }

  function removeRecipeItem(id: string) {
    setRecipeItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSaveAsync() {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await createProductWithRecipeAsync({
        name,
        price: Number(price),
        description,
        recipeItems: recipeItems.map((item) => ({
          supplyId: item.supplyId,
          supplyName: item.supplyName,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
        })),
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
    <Screen title="Nuevo producto" backHref="/products">
      <TextField label="Nombre" onChangeText={setName} placeholder="Cupcake de vainilla" value={name} />
      <TextField
        keyboardType="decimal-pad"
        label="Precio"
        onChangeText={setPrice}
        placeholder="$0.00"
        value={price}
      />
      <TextField label="Descripcion" onChangeText={setDescription} placeholder="Opcional" value={description} multiline />
      <View style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Receta</Text>
        {recipeItems.map((item, index) => (
          <View key={item.id} style={styles.recipeCard}>
            <Text style={styles.recipeTitle}>Insumo {index + 1}</Text>
            <SelectField
              label="Insumo"
              onValueChange={(supplyId) => updateRecipeItem(item.id, { supplyId })}
              options={supplyOptions}
              value={item.supplyId || "empty"}
              helperText="Materia prima usada para calcular el costo del producto."
            />
            <TextField
              keyboardType="decimal-pad"
              label="Cantidad"
              onChangeText={(quantity) => updateRecipeItem(item.id, { quantity })}
              placeholder="0"
              value={item.quantity}
            />
            <TextField label="Unidad" onChangeText={(unit) => updateRecipeItem(item.id, { unit })} placeholder="kg" value={item.unit} />
            <TextField
              keyboardType="decimal-pad"
              label="Precio unitario"
              onChangeText={(unitPrice) => updateRecipeItem(item.id, { unitPrice })}
              placeholder="$0.00"
              value={item.unitPrice}
              helperText="Costo de una unidad de este insumo."
            />
            <Text style={styles.recipeSubtotal}>
              Subtotal: ${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
            </Text>
            <Button label="Eliminar insumo" onPress={() => removeRecipeItem(item.id)} variant="secondary" />
          </View>
        ))}
        <Button disabled={activeSupplies.length === 0} label="Agregar insumo a receta" onPress={addRecipeItem} variant="secondary" />
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Costo estimado: ${recipeCost.toFixed(2)}</Text>
        <TextField
          keyboardType="decimal-pad"
          label="Margen sugerido (%)"
          onChangeText={setMarginPercent}
          placeholder="30"
          value={marginPercent}
          helperText="Se usa solo para sugerir precio de venta."
        />
        <Text style={styles.summaryText}>Precio sugerido: ${suggestedPrice.toFixed(2)}</Text>
        <Button
          disabled={suggestedPrice <= 0}
          label="Usar precio sugerido"
          onPress={() => setPrice(String(suggestedPrice))}
          variant="secondary"
        />
      </View>
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
  sectionTitle: {
    color: colors.text,
    ...typography.section,
  },
  recipeCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  recipeTitle: {
    color: colors.text,
    ...typography.bodyStrong,
  },
  recipeSubtotal: {
    color: colors.textMuted,
    ...typography.caption,
  },
  summary: {
    gap: spacing.md,
  },
  summaryText: {
    color: colors.text,
    ...typography.bodyStrong,
  },
});
