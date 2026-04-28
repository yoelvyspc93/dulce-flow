import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import { createOrderAsync } from "@/features/orders/services/order.service";
import { listProductsAsync } from "@/features/products/services/product.service";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import type { Product } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function NewOrderScreen() {
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedProduct = activeProducts.find((product) => product.id === selectedProductId);

  useEffect(() => {
    let isMounted = true;

    async function loadProductsAsync() {
      const products = await listProductsAsync();

      if (isMounted) {
        const active = products.filter((product) => product.isActive);
        setActiveProducts(active);
        setSelectedProductId(active[0]?.id ?? "");
      }
    }

    void loadProductsAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  const productOptions =
    activeProducts.length > 0
      ? activeProducts.map((product) => ({ label: `${product.name} - $${product.price.toFixed(2)}`, value: product.id }))
      : [{ label: "No tienes productos activos", value: "empty", disabled: true }];
  const subtotal = selectedProduct ? selectedProduct.price * Number(quantity || 0) : 0;
  const total = subtotal - Number(discount || 0);

  async function handleSaveAsync() {
    if (!selectedProduct) {
      setErrorMessage("Debes crear un producto activo antes de registrar ordenes.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const created = await createOrderAsync({
        customerName,
        customerPhone,
        productId: selectedProduct.id,
        quantity: Number(quantity),
        discount: Number(discount || 0),
        paymentStatus: "pending",
        note,
      });
      router.replace(`/orders/${created.order.id}`);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else if (error instanceof Error && error.message === "DISCOUNT_EXCEEDS_SUBTOTAL") {
        setErrorMessage("El descuento no puede ser mayor que el subtotal.");
      } else {
        setErrorMessage("No se pudo guardar la orden.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen title="Nueva orden" subtitle="Base de formulario para la fase de ordenes.">
      <TextField label="Cliente" onChangeText={setCustomerName} placeholder="Nombre del cliente" value={customerName} />
      <TextField label="Telefono" onChangeText={setCustomerPhone} placeholder="Telefono" value={customerPhone} />
      <SelectField
        label="Productos"
        disabled={activeProducts.length === 0}
        onValueChange={setSelectedProductId}
        options={productOptions}
        value={selectedProduct?.id ?? "empty"}
      />
      <TextField keyboardType="decimal-pad" label="Cantidad" onChangeText={setQuantity} placeholder="1" value={quantity} />
      <TextField keyboardType="decimal-pad" label="Descuento" onChangeText={setDiscount} placeholder="0" value={discount} />
      <View style={styles.totals}>
        <Text style={styles.totalText}>Subtotal: ${subtotal.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total: ${Math.max(total, 0).toFixed(2)}</Text>
      </View>
      <TextField label="Nota" onChangeText={setNote} placeholder="Detalles de entrega o decoracion" value={note} multiline />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar orden"} onPress={handleSaveAsync} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  totals: {
    gap: spacing.xs,
  },
  totalText: {
    color: colors.text,
    ...typography.bodyStrong,
  },
  errorText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
