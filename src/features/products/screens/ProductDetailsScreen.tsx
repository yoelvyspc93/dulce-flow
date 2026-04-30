import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  deleteProductPermanentlyAsync,
  getProductAsync,
  getProductUsageCountAsync,
  setProductActiveAsync,
  updateProductAsync,
} from "@/features/products/services/product.service";
import { Badge, Button, ConfirmDialog, EmptyState, ListItem, Screen, TextField } from "@/shared/ui";
import type { Product } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProductAsync() {
      setIsLoading(true);
      setLoadErrorMessage("");

      try {
        const [loadedProduct, loadedUsageCount] = await Promise.all([
          productId ? getProductAsync(productId) : Promise.resolve(null),
          productId ? getProductUsageCountAsync(productId) : Promise.resolve(0),
        ]);

        if (isActive) {
          setProduct(loadedProduct);
          setUsageCount(loadedUsageCount);

          if (loadedProduct) {
            setName(loadedProduct.name);
            setPrice(String(loadedProduct.price));
            setDescription(loadedProduct.description ?? "");
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
      const updatedProduct = await updateProductAsync(product, {
        name,
        price: Number(price),
        description,
      });
      setProduct(updatedProduct);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else if (error instanceof Error && error.message === "PRODUCT_NAME_DUPLICATED") {
        setErrorMessage("Ya existe un producto con ese nombre.");
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
    setProduct(updatedProduct);
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
        setErrorMessage("Este producto tiene pedidos asociados. Puedes desactivarlo para ocultarlo de nuevas ventas.");
      } else {
        setErrorMessage("No se pudo eliminar el producto.");
      }
    } finally {
      setIsDeleting(false);
    }
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
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={{ gap: 12 }}>
        <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
        <Button
          label={product.isActive ? "Desactivar producto" : "Activar producto"}
          onPress={handleToggleActiveAsync}
          variant="outlineLight"
        />
        {usageCount === 0 ? (
          <Button label="Eliminar permanentemente" onPress={() => setIsDeleteDialogVisible(true)} variant="outlineLight" />
        ) : (
          <Text style={styles.helperText}>Este producto tiene historial. Para conservar los pedidos, solo se puede desactivar.</Text>
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
});
