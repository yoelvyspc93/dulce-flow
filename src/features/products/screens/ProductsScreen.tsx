import { router, useFocusEffect } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { listProductsAsync } from "@/features/products/services/product.service";
import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen, SegmentedControl } from "@/shared/ui";
import type { Product } from "@/shared/types";
import { formatMoney } from "@/shared/utils/money";

type ActivityFilter = "all" | "active" | "inactive";

const ACTIVITY_FILTERS: ActivityFilter[] = ["all", "active", "inactive"];
const ACTIVITY_FILTER_LABELS: Record<ActivityFilter, string> = {
  all: "Todos",
  active: "Activo",
  inactive: "Inactivo",
};
const EMPTY_STATE_TITLES: Record<ActivityFilter, string> = {
  all: "No tienes productos registrados",
  active: "No tienes productos activos",
  inactive: "No tienes productos inactivos",
};

export function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const filteredProducts = products.filter((product) => {
    if (activityFilter === "active") {
      return product.isActive;
    }

    if (activityFilter === "inactive") {
      return !product.isActive;
    }

    return true;
  });

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
      <View style={{ gap: 12 }}>
        <Button label="Nuevo producto" onPress={() => router.push("/products/new")} />
        <SegmentedControl
          accessibilityLabel="Filtro por estado del producto"
          onValueChange={(selectedFilter) => setActivityFilter(selectedFilter as ActivityFilter)}
          options={ACTIVITY_FILTERS.map((item) => ({ label: ACTIVITY_FILTER_LABELS[item], value: item }))}
          value={activityFilter}
        />
      </View>

      <SectionHeader
        title="Catalogo"
        subtitle={isLoading ? "Cargando productos..." : `${filteredProducts.length} productos registrados`}
      />

      {filteredProducts.length === 0 && !isLoading ? (
        <EmptyState
          action={{ label: "Nuevo producto", onPress: () => router.push("/products/new") }}
          icon={ShoppingBag}
          title={EMPTY_STATE_TITLES[activityFilter]}
          description="Crea productos para venderlos despues dentro de tus pedidos."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {filteredProducts.map((product) => (
          <ListItem
            key={product.id}
            onPress={() => router.push(`/products/${product.id}`)}
            title={product.name}
            subtitle={`${formatMoney(product.price)}${product.description ? ` - ${product.description}` : ""}`}
            trailing={<Badge label={product.isActive ? "Activo" : "Inactivo"} tone={product.isActive ? "success" : "neutral"} />}
          />
        ))}
      </View>
    </Screen>
  );
}
