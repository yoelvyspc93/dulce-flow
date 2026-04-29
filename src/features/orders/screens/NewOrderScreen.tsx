import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ZodError } from "zod";

import { createOrderAsync } from "@/features/orders/services/order.service";
import { listProductsAsync } from "@/features/products/services/product.service";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import type { Product } from "@/shared/types";
import { colors, spacing, typography } from "@/theme";

type OrderLine = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

function toDateInputValue(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function NewOrderScreen() {
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dueDate, setDueDate] = useState(toDateInputValue());
  const [items, setItems] = useState<OrderLine[]>([]);
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProductsAsync() {
      const products = await listProductsAsync();

      if (isMounted) {
        const active = products.filter((product) => product.isActive);
        setActiveProducts(active);
        setItems(active[0] ? [{ id: "item_1", productId: active[0].id, quantity: "1", unitPrice: String(active[0].price) }] : []);
      }
    }

    void loadProductsAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  const productOptions =
    activeProducts.length > 0
      ? activeProducts.map((product) => ({ label: product.name, value: product.id }))
      : [{ label: "No tienes productos activos", value: "empty", disabled: true }];
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);

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
    if (items.length === 0) {
      setErrorMessage("Debes crear un producto activo antes de registrar pedidos.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const created = await createOrderAsync({
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
      router.replace(`/orders/${created.order.id}`);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Datos invalidos.");
      } else if (error instanceof Error && error.message === "PRODUCT_NOT_AVAILABLE") {
        setErrorMessage("Uno de los productos seleccionados no esta disponible.");
      } else {
        setErrorMessage("No se pudo guardar el pedido.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen title="Nuevo pedido" backHref="/orders">
      <TextField label="Cliente" onChangeText={setCustomerName} placeholder="Nombre del cliente" value={customerName} />
      <TextField label="Telefono" onChangeText={setCustomerPhone} placeholder="Telefono" value={customerPhone} />
      <TextField
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
              disabled={activeProducts.length === 0}
              onValueChange={(productId) => updateItem(item.id, { productId })}
              options={productOptions}
              value={item.productId || "empty"}
            />
            <TextField
              keyboardType="decimal-pad"
              label="Cantidad"
              onChangeText={(quantity) => updateItem(item.id, { quantity })}
              placeholder="1"
              value={item.quantity}
            />
            <TextField
              keyboardType="decimal-pad"
              label="Precio"
              onChangeText={(unitPrice) => updateItem(item.id, { unitPrice })}
              placeholder="$0.00"
              value={item.unitPrice}
            />
            <Text style={styles.lineSubtotal}>
              Subtotal: ${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
            </Text>
            {items.length > 1 ? (
              <Button label="Eliminar producto" onPress={() => removeItem(item.id)} variant="secondary" />
            ) : null}
          </View>
        ))}
        <Button label="Adicionar producto" onPress={addItem} variant="secondary" />
      </View>
      <View style={styles.totals}>
        <Text style={styles.totalText}>Subtotal: ${subtotal.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total: ${subtotal.toFixed(2)}</Text>
      </View>
      <TextField label="Nota" onChangeText={setNote} placeholder="Detalles de entrega o decoracion" value={note} multiline />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar pedido"} onPress={handleSaveAsync} />
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
});
