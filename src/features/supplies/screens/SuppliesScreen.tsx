import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen } from "@/shared/ui";
import type { Supply } from "@/shared/types";

export function SuppliesScreen() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <Screen title="Insumos">
      <Button label="Nuevo insumo" onPress={() => router.push("/supplies/new")} />

      <SectionHeader
        title="Catalogo"
        subtitle={isLoading ? "Cargando insumos..." : `${supplies.length} insumos registrados`}
      />

      {supplies.length === 0 && !isLoading ? (
        <EmptyState
          eyebrow="Sin insumos"
          title="No tienes insumos activos"
          description="Crea insumos desde Ajustes para registrar tus gastos mas rapido."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {supplies.map((supply) => (
          <ListItem
            key={supply.id}
            onPress={() => router.push(`/supplies/${supply.id}`)}
            title={supply.name}
            subtitle={`${supply.unit}${supply.category ? ` - ${supply.category}` : ""}`}
            trailing={
              <Badge label={supply.isActive ? "Activo" : "Inactivo"} tone={supply.isActive ? "success" : "neutral"} />
            }
          />
        ))}
      </View>
    </Screen>
  );
}
