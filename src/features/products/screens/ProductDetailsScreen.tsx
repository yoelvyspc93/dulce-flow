import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  calculateRecipeCost,
  deleteProductPermanentlyAsync,
  getProductDetailsAsync,
  getProductUsageCountAsync,
  setProductActiveAsync,
  suggestSalePrice,
  updateProductWithRecipeAsync,
  type ProductDetails,
} from "@/features/products/services/product.service";
import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { Badge, Button, ConfirmDialog, EmptyState, ListItem, Screen, SelectField, TextField } from "@/shared/ui";
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

export function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [activeSupplies, setActiveSupplies] = useState<Supply[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [marginPercent, setMarginPercent] = useState("30");
  const [recipeItems, setRecipeItems] = useState<RecipeLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const product = details?.product ?? null;
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
    let isActive = true;

    async function loadProductAsync() {
      setIsLoading(true);
      setLoadErrorMessage("");

      try {
        const [loadedDetails, supplies, loadedUsageCount] = await Promise.all([
          productId ? getProductDetailsAsync(productId) : Promise.resolve(null),
          listSuppliesAsync(),
          productId ? getProductUsageCountAsync(productId) : Promise.resolve(0),
        ]);

        if (isActive) {
          setDetails(loadedDetails);
          setActiveSupplies(supplies.filter((supply) => supply.isActive));
          setUsageCount(loadedUsageCount);

          if (loadedDetails) {
            setName(loadedDetails.product.name);
            setPrice(String(loadedDetails.product.price));
            setDescription(loadedDetails.product.description ?? "");
            setRecipeItems(
              loadedDetails.recipeItems.map((item) => ({
                id: item.id,
                supplyId: item.supplyId ?? "",
                supplyName: item.supplyName,
                quantity: String(item.quantity),
                unit: item.unit,
                unitPrice: String(item.unitPrice),
              }))
            );
          }
        }
      } catch {
        if (isActive) {
          setLoadErrorMessage("No se pudo cargar el producto.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProductAsync();

    return () => {
      isActive = false;
    };
  }, [productId]);

  async function handleSaveAsync() {
    if (!product) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedDetails = await updateProductWithRecipeAsync(product, {
        name,
        price: Number(price),
        description,
        recipeItems: recipeItems.map((item) => ({
          supplyId: item.supplyId || undefined,
          supplyName: item.supplyName,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
        })),
      });
      setDetails(updatedDetails);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else {
        setErrorMessage("No se pudo actualizar el producto.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActiveAsync() {
    if (!product) {
      return;
    }

    const updatedProduct = await setProductActiveAsync(product, !product.isActive);
    setDetails((current) => (current ? { ...current, product: updatedProduct } : current));
  }

  async function handleDeleteAsync() {
    if (!product) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteProductPermanentlyAsync(product);
      setIsDeleteDialogVisible(false);
      router.replace("/products");
    } catch (error) {
      if (error instanceof Error && error.message === "PRODUCT_HAS_HISTORY") {
        setErrorMessage("Este producto tiene ordenes asociadas. Puedes desactivarlo para ocultarlo de nuevas ventas.");
      } else {
        setErrorMessage("No se pudo eliminar el producto.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

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

  if (isLoading) {
    return (
      <Screen title="Detalle de producto" backHref="/products">
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Buscando producto...</Text>
        </View>
      </Screen>
    );
  }

  if (loadErrorMessage) {
    return (
      <Screen title="Detalle de producto" backHref="/products">
        <EmptyState eyebrow="Producto" title="No se pudo cargar" description={loadErrorMessage} />
        <Button label="Volver al catalogo" onPress={() => router.replace("/products")} />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen title="Detalle de producto" backHref="/products">
        <EmptyState eyebrow="Producto" title="Producto no encontrado" description="Vuelve al catalogo y selecciona otro producto." />
        <Button label="Volver al catalogo" onPress={() => router.replace("/products")} />
      </Screen>
    );
  }

  return (
    <Screen title="Detalle de producto" backHref="/products">
      <ListItem
        title="Estado"
        subtitle="Los productos usados no se eliminan fisicamente"
        trailing={<Badge label={product.isActive ? "Activo" : "Inactivo"} tone={product.isActive ? "success" : "neutral"} />}
      />
      <TextField label="Nombre" onChangeText={setName} placeholder="Cupcake de vainilla" value={name} />
      <TextField keyboardType="decimal-pad" label="Precio" onChangeText={setPrice} placeholder="$0.00" value={price} />
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
      <View style={{ gap: 12 }}>
        <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
        <Button
          label={product.isActive ? "Desactivar producto" : "Activar producto"}
          onPress={handleToggleActiveAsync}
          variant="secondary"
        />
        {usageCount === 0 ? (
          <Button label="Eliminar permanentemente" onPress={() => setIsDeleteDialogVisible(true)} variant="secondary" />
        ) : (
          <Text style={styles.helperText}>Este producto tiene historial. Para conservar las ordenes, solo se puede desactivar.</Text>
        )}
      </View>
      <ConfirmDialog
        confirmLabel="Eliminar"
        description="El producto se eliminara permanentemente y no se podra recuperar."
        isLoading={isDeleting}
        onCancel={() => setIsDeleteDialogVisible(false)}
        onConfirm={handleDeleteAsync}
        title="Eliminar producto"
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
  helperText: {
    color: colors.textMuted,
    ...typography.caption,
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
