import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { listProductsAsync } from "@/features/products/services/product.service";
import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen } from "@/shared/ui";
import type { Product } from "@/shared/types";

export function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProductsAsync() {
        setIsLoading(true);
        const loadedProducts = await listProductsAsync();

        if (isActive) {
          setProducts(loadedProducts);
          setIsLoading(false);
        }
      }

      void loadProductsAsync();

      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <Screen title="Productos" backHref="/(tabs)/settings">
      <Button label="Nuevo producto" onPress={() => router.push("/products/new")} />

      <SectionHeader
        title="Catalogo"
        subtitle={isLoading ? "Cargando productos..." : `${products.length} productos registrados`}
      />

      {products.length === 0 && !isLoading ? (
        <EmptyState
          eyebrow="Sin productos"
          title="No tienes productos activos"
          description="Crea productos desde Ajustes para poder registrar pedidos."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {products.map((product) => (
          <ListItem
            key={product.id}
            onPress={() => router.push(`/products/${product.id}`)}
            title={product.name}
            subtitle={`$${product.price.toFixed(2)}${product.description ? ` - ${product.description}` : ""}`}
            trailing={<Badge label={product.isActive ? "Activo" : "Inactivo"} tone={product.isActive ? "success" : "neutral"} />}
          />
        ))}
      </View>
    </Screen>
  );
}
