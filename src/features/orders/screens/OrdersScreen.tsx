import { View } from "react-native";

import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen } from "@/shared/ui";

export function OrdersScreen() {
  return (
    <Screen title="Ordenes" subtitle="Pendientes, entregadas y canceladas con reglas financieras claras.">
      <View style={{ gap: 12 }}>
        <Button label="Crear orden" />
        <ListItem title="Filtro por estado" subtitle="Pendientes" trailing={<Badge label="pending" />} />
      </View>

      <SectionHeader
        title="Vista inicial"
        subtitle="La lista real llegara cuando exista persistencia y CRUD de ordenes."
      />
      <EmptyState
        eyebrow="Sin ordenes"
        title="Todavia no tienes ordenes"
        description="Crea tu primera orden para empezar a registrar ventas y entregas."
      />
    </Screen>
  );
}
