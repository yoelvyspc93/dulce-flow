import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  getProductAsync,
  setProductActiveAsync,
  updateProductAsync,
} from "@/features/products/services/product.service";
import { Badge, Button, EmptyState, ListItem, Screen, TextField } from "@/shared/ui";
import type { Product } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProductAsync() {
      const loadedProduct = params.id ? await getProductAsync(params.id) : null;

      if (isActive && loadedProduct) {
        setProduct(loadedProduct);
        setName(loadedProduct.name);
        setPrice(String(loadedProduct.price));
        setDescription(loadedProduct.description ?? "");
      }
    }

    void loadProductAsync();

    return () => {
      isActive = false;
    };
  }, [params.id]);

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

  if (!product) {
    return (
      <Screen title="Detalle de producto" subtitle="Quedara conectado al CRUD de productos.">
        <EmptyState eyebrow="Producto" title="Producto no encontrado" description="Vuelve al catalogo y selecciona otro producto." />
        <Button label="Volver al catalogo" onPress={() => router.replace("/products")} />
      </Screen>
    );
  }

  return (
    <Screen title="Detalle de producto" subtitle="Edita datos sin eliminar el historial del catalogo.">
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
          variant="secondary"
        />
      </View>
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
