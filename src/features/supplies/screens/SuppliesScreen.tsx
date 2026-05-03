import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen, SegmentedControl } from "@/shared/ui";
import type { Supply } from "@/shared/types";
import { formatMoney } from "@/shared/utils/money";

type ActivityFilter = "all" | "active" | "inactive";

const ACTIVITY_FILTERS: ActivityFilter[] = ["all", "active", "inactive"];
const ACTIVITY_FILTER_LABELS: Record<ActivityFilter, string> = {
  all: "Todos",
  active: "Activo",
  inactive: "Inactivo",
};
const EMPTY_STATE_TITLES: Record<ActivityFilter, string> = {
  all: "No tienes insumos registrados",
  active: "No tienes insumos activos",
  inactive: "No tienes insumos inactivos",
};

export function SuppliesScreen() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const filteredSupplies = supplies.filter((supply) => {
    if (activityFilter === "active") {
      return supply.isActive;
    }

    if (activityFilter === "inactive") {
      return !supply.isActive;
    }

    return true;
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSuppliesAsync() {
        setIsLoading(true);
        const loadedSupplies = await listSuppliesAsync();

        if (isActive) {
          setSupplies(loadedSupplies);
          setIsLoading(false);
        }
      }

      void loadSuppliesAsync();

      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <Screen title="Insumos" backHref="/(tabs)/settings">
      <View style={{ gap: 12 }}>
        <Button label="Nuevo insumo" onPress={() => router.push("/supplies/new")} />
        <SegmentedControl
          accessibilityLabel="Filtro por estado del insumo"
          onValueChange={(selectedFilter) => setActivityFilter(selectedFilter as ActivityFilter)}
          options={ACTIVITY_FILTERS.map((item) => ({ label: ACTIVITY_FILTER_LABELS[item], value: item }))}
          value={activityFilter}
        />
      </View>

      <SectionHeader
        title="Catalogo"
        subtitle={isLoading ? "Cargando insumos..." : `${filteredSupplies.length} insumos registrados`}
      />

      {filteredSupplies.length === 0 && !isLoading ? (
        <EmptyState
          eyebrow="Sin insumos"
          title={EMPTY_STATE_TITLES[activityFilter]}
          description="Crea insumos para registrar compras y gastos mas rapido."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {filteredSupplies.map((supply) => (
          <ListItem
            key={supply.id}
            onPress={() => router.push(`/supplies/${supply.id}`)}
            title={supply.name}
            subtitle={`${supply.unit}${supply.defaultPrice ? ` - ${formatMoney(supply.defaultPrice)}` : ""}`}
            trailing={
              <Badge label={supply.isActive ? "Activo" : "Inactivo"} tone={supply.isActive ? "success" : "neutral"} />
            }
          />
        ))}
      </View>
    </Screen>
  );
}
