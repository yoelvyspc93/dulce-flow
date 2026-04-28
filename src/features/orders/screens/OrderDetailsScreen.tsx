import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import {
  cancelOrderAsync,
  deliverOrderAsync,
  getOrderDetailsAsync,
  updatePendingOrderAsync,
  type OrderDetails,
} from "@/features/orders/services/order.service";
import { listProductsAsync } from "@/features/products/services/product.service";
import { Badge, Button, EmptyState, ListItem, Screen, SelectField, TextField } from "@/shared/ui";
import type { Product } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

export function OrderDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const order = details?.order;
  const selectedProduct = activeProducts.find((product) => product.id === selectedProductId);
  const isEditable = order?.status === "pending";
  const subtotal = selectedProduct ? selectedProduct.price * Number(quantity || 0) : order?.subtotal ?? 0;
  const total = subtotal - Number(discount || 0);

  useEffect(() => {
    let isMounted = true;

    async function loadAsync() {
      setIsLoading(true);
      setLoadErrorMessage("");

      try {
        const [loadedDetails, products] = await Promise.all([
          orderId ? getOrderDetailsAsync(orderId) : Promise.resolve(null),
          listProductsAsync(),
        ]);
        const active = products.filter((product) => product.isActive);

        if (isMounted) {
          setDetails(loadedDetails);
          setActiveProducts(active);

          if (loadedDetails) {
            const firstItem = loadedDetails.items[0];
            const foundProductIndex = active.findIndex((product) => product.id === firstItem?.productId);
            setSelectedProductId(foundProductIndex >= 0 ? active[foundProductIndex].id : active[0]?.id ?? "");
            setCustomerName(loadedDetails.order.customerName ?? "");
            setCustomerPhone(loadedDetails.order.customerPhone ?? "");
            setQuantity(firstItem ? String(firstItem.quantity) : "1");
            setDiscount(String(loadedDetails.order.discount));
            setNote(loadedDetails.order.note ?? "");
          }
        }
      } catch {
        if (isMounted) {
          setLoadErrorMessage("No se pudo cargar la orden.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAsync();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  async function handleSaveAsync() {
    if (!details?.order || !selectedProduct) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedDetails = await updatePendingOrderAsync(details.order, {
        customerName,
        customerPhone,
        productId: selectedProduct.id,
        quantity: Number(quantity),
        discount: Number(discount || 0),
        paymentStatus: details.order.paymentStatus,
        note,
      });
      setDetails(updatedDetails);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else if (error instanceof Error && error.message === "DISCOUNT_EXCEEDS_SUBTOTAL") {
        setErrorMessage("El descuento no puede ser mayor que el subtotal.");
      } else {
        setErrorMessage("No se pudo actualizar la orden.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeliverAsync() {
    if (!details?.order) {
      return;
    }

    const updatedOrder = await deliverOrderAsync(details.order);
    setDetails({ ...details, order: updatedOrder });
  }

  async function handleCancelAsync() {
    if (!details?.order) {
      return;
    }

    const updatedOrder = await cancelOrderAsync(details.order);
    setDetails({ ...details, order: updatedOrder });
  }

  if (isLoading) {
    return (
      <Screen title="Detalle de orden">
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Buscando orden...</Text>
        </View>
      </Screen>
    );
  }

  if (loadErrorMessage) {
    return (
      <Screen title="Detalle de orden">
        <EmptyState eyebrow="Orden" title="No se pudo cargar" description={loadErrorMessage} />
        <Button label="Volver a ordenes" onPress={() => router.replace("/orders")} />
      </Screen>
    );
  }

  if (!details || !order) {
    return (
      <Screen title="Detalle de orden">
        <EmptyState eyebrow="Orden" title="Orden no encontrada" description="Vuelve al listado y selecciona otra orden." />
        <Button label="Volver a ordenes" onPress={() => router.replace("/orders")} />
      </Screen>
    );
  }

  const selectedProductLabel = selectedProduct
    ? `${selectedProduct.name} - $${selectedProduct.price.toFixed(2)}`
    : details.items[0]?.productName ?? "Sin producto";
  const productOptions =
    activeProducts.length > 0
      ? activeProducts.map((product) => ({ label: `${product.name} - $${product.price.toFixed(2)}`, value: product.id }))
      : [{ label: selectedProductLabel, value: "empty", disabled: true }];

  return (
    <Screen title="Detalle de orden">
      <ListItem
        title="Estado"
        subtitle="Solo las ordenes entregadas generan ingreso"
        trailing={<Badge label={order.status} tone={order.status === "delivered" ? "success" : order.status === "cancelled" ? "danger" : "warning"} />}
      />
      <ListItem title="Pago" subtitle="Se guarda aparte del estado operativo" trailing={<Badge label={order.paymentStatus} tone="warning" />} />
      <TextField editable={isEditable} label="Cliente" onChangeText={setCustomerName} placeholder="Nombre" value={customerName} />
      <TextField editable={isEditable} label="Telefono" onChangeText={setCustomerPhone} placeholder="Telefono" value={customerPhone} />
      <SelectField
        label="Producto"
        disabled={!isEditable || activeProducts.length === 0}
        onValueChange={setSelectedProductId}
        options={productOptions}
        value={selectedProduct?.id ?? "empty"}
      />
      <TextField editable={isEditable} keyboardType="decimal-pad" label="Cantidad" onChangeText={setQuantity} placeholder="1" value={quantity} />
      <TextField editable={isEditable} keyboardType="decimal-pad" label="Descuento" onChangeText={setDiscount} placeholder="0" value={discount} />
      <View style={styles.totals}>
        <Text style={styles.totalText}>Subtotal: ${subtotal.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total: ${Math.max(total, 0).toFixed(2)}</Text>
      </View>
      <TextField editable={isEditable} label="Nota" onChangeText={setNote} placeholder="Detalles" value={note} multiline />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {order.status === "pending" ? (
        <View style={{ gap: 12 }}>
          <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
          <Button label="Marcar entregada" onPress={handleDeliverAsync} />
          <Button label="Cancelar orden" onPress={handleCancelAsync} variant="secondary" />
        </View>
      ) : null}
      {order.status === "delivered" ? (
        <Button label="Cancelar orden entregada" onPress={handleCancelAsync} variant="secondary" />
      ) : null}
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
  loadingState: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    color: colors.textMuted,
    ...typography.body,
  },
});
