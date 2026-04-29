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
import { Badge, Button, ConfirmDialog, EmptyState, ListItem, Screen, SelectField, TextField } from "@/shared/ui";
import type { Product } from "@/shared/types";
import { formatOrderStatus } from "@/shared/utils/labels";
import { colors, spacing, typography } from "@/theme";

type OrderLine = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

type PendingOrderAction = "deliver" | "cancel" | null;

export function OrderDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<OrderLine[]>([]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingOrderAction>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const order = details?.order;
  const isEditable = order?.status === "pending";
  const subtotal =
    items.length > 0
      ? items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
      : order?.subtotal ?? 0;

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
            setCustomerName(loadedDetails.order.customerName ?? "");
            setCustomerPhone(loadedDetails.order.customerPhone ?? "");
            setDueDate(loadedDetails.order.dueDate.slice(0, 10));
            setItems(
              loadedDetails.items.map((item) => ({
                id: item.id,
                productId: item.productId ?? active[0]?.id ?? "",
                quantity: String(item.quantity),
                unitPrice: String(item.unitPrice),
              }))
            );
            setNote(loadedDetails.order.note ?? "");
          }
        }
      } catch {
        if (isMounted) {
          setLoadErrorMessage("No se pudo cargar el pedido.");
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

  function updateItem(id: string, patch: Partial<OrderLine>) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const next = { ...item, ...patch };
        if (patch.productId) {
          const product = activeProducts.find((candidate) => candidate.id === patch.productId);
          next.unitPrice = product ? String(product.price) : next.unitPrice;
        }

        return next;
      })
    );
  }

  function addItem() {
    const product = activeProducts[0];
    if (!product) {
      return;
    }

    setItems((current) => [
      ...current,
      {
        id: `item_${Date.now()}`,
        productId: product.id,
        quantity: "1",
        unitPrice: String(product.price),
      },
    ]);
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSaveAsync() {
    if (!details?.order || items.length === 0) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedDetails = await updatePendingOrderAsync(details.order, {
        customerName,
        customerPhone,
        dueDate,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        note,
      });
      setDetails(updatedDetails);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else if (error instanceof Error && error.message === "PRODUCT_NOT_AVAILABLE") {
        setErrorMessage("Uno de los productos seleccionados no esta disponible.");
      } else {
        setErrorMessage("No se pudo actualizar el pedido.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeliverAsync() {
    if (!details?.order) {
      return;
    }

    setIsConfirmingAction(true);
    setErrorMessage("");

    try {
      const updatedOrder = await deliverOrderAsync(details.order);
      setDetails({ ...details, order: updatedOrder });
      setPendingAction(null);
    } catch {
      setErrorMessage("No se pudo marcar el pedido como entregado.");
    } finally {
      setIsConfirmingAction(false);
    }
  }

  async function handleCancelAsync() {
    if (!details?.order) {
      return;
    }

    setIsConfirmingAction(true);
    setErrorMessage("");

    try {
      const updatedOrder = await cancelOrderAsync(details.order);
      setDetails({ ...details, order: updatedOrder });
      setPendingAction(null);
    } catch {
      setErrorMessage("No se pudo cancelar el pedido.");
    } finally {
      setIsConfirmingAction(false);
    }
  }

  if (isLoading) {
    return (
      <Screen title="Detalle de pedido" backHref="/orders">
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Buscando pedido...</Text>
        </View>
      </Screen>
    );
  }

  if (loadErrorMessage) {
    return (
      <Screen title="Detalle de pedido" backHref="/orders">
        <EmptyState eyebrow="Pedido" title="No se pudo cargar" description={loadErrorMessage} />
        <Button label="Volver a pedidos" onPress={() => router.replace("/orders")} />
      </Screen>
    );
  }

  if (!details || !order) {
    return (
      <Screen title="Detalle de pedido" backHref="/orders">
        <EmptyState eyebrow="Pedido" title="Pedido no encontrado" description="Vuelve al listado y selecciona otro pedido." />
        <Button label="Volver a pedidos" onPress={() => router.replace("/orders")} />
      </Screen>
    );
  }

  const productOptions =
    activeProducts.length > 0
      ? activeProducts.map((product) => ({ label: product.name, value: product.id }))
      : [{ label: "Sin productos activos", value: "empty", disabled: true }];
  const confirmation =
    pendingAction === "deliver"
      ? {
          title: "Marcar pedido como entregado",
          description: "El pedido quedara entregado y se registrara el ingreso.",
          confirmLabel: "Marcar entregado",
          onConfirm: handleDeliverAsync,
        }
      : {
          title: "Cancelar pedido",
          description:
            order.status === "delivered"
              ? "El pedido quedara cancelado y el ingreso original dejara de contar."
              : "El pedido quedara cancelado y no contara como venta completada.",
          confirmLabel: "Cancelar pedido",
          onConfirm: handleCancelAsync,
        };

  return (
    <Screen title="Detalle de pedido" backHref="/orders">
      <ListItem
        title="Estado"
        subtitle="Marcar entregado registra el ingreso"
        trailing={
          <Badge
            label={formatOrderStatus(order.status)}
            tone={order.status === "delivered" ? "success" : order.status === "cancelled" ? "danger" : "warning"}
          />
        }
      />
      <TextField editable={isEditable} label="Cliente" onChangeText={setCustomerName} placeholder="Nombre" value={customerName} />
      <TextField editable={isEditable} label="Telefono" onChangeText={setCustomerPhone} placeholder="Telefono" value={customerPhone} />
      <TextField
        editable={isEditable}
        label="Fecha del pedido"
        onChangeText={setDueDate}
        placeholder="YYYY-MM-DD"
        value={dueDate}
        helperText="Dia en que debe estar listo o entregado."
      />
      <View style={{ gap: 12 }}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>Producto {index + 1}</Text>
            <SelectField
              label="Producto"
              disabled={!isEditable || activeProducts.length === 0}
              onValueChange={(productId) => updateItem(item.id, { productId })}
              options={productOptions}
              value={item.productId || "empty"}
            />
            <TextField
              editable={isEditable}
              keyboardType="decimal-pad"
              label="Cantidad"
              onChangeText={(quantity) => updateItem(item.id, { quantity })}
              placeholder="1"
              value={item.quantity}
            />
            <TextField
              editable={isEditable}
              keyboardType="decimal-pad"
              label="Precio"
              onChangeText={(unitPrice) => updateItem(item.id, { unitPrice })}
              placeholder="$0.00"
              value={item.unitPrice}
            />
            <Text style={styles.lineSubtotal}>
              Subtotal: ${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
            </Text>
            {isEditable && items.length > 1 ? (
              <Button label="Eliminar producto" onPress={() => removeItem(item.id)} variant="secondary" />
            ) : null}
          </View>
        ))}
        {isEditable ? <Button label="Adicionar producto" onPress={addItem} variant="secondary" /> : null}
      </View>
      <View style={styles.totals}>
        <Text style={styles.totalText}>Subtotal: ${subtotal.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total: ${subtotal.toFixed(2)}</Text>
      </View>
      <TextField editable={isEditable} label="Nota" onChangeText={setNote} placeholder="Detalles" value={note} multiline />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {order.status === "pending" ? (
        <View style={{ gap: 12 }}>
          <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar cambios"} onPress={handleSaveAsync} />
          <Button label="Marcar entregado" onPress={() => setPendingAction("deliver")} />
          <Button label="Cancelar pedido" onPress={() => setPendingAction("cancel")} variant="secondary" />
        </View>
      ) : null}
      {order.status === "delivered" ? (
        <Button label="Cancelar pedido entregado" onPress={() => setPendingAction("cancel")} variant="secondary" />
      ) : null}
      <ConfirmDialog
        confirmLabel={confirmation.confirmLabel}
        description={confirmation.description}
        isLoading={isConfirmingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        visible={pendingAction !== null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemTitle: {
    color: colors.text,
    ...typography.bodyStrong,
  },
  lineSubtotal: {
    color: colors.textMuted,
    ...typography.caption,
  },
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
