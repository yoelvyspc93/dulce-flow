import { View } from "react-native";

import { MetricCard, SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";

export function HomeScreen() {
  const businessSettings = useAppStore((state) => state.businessSettings);

  return (
    <Screen
      title={businessSettings?.businessName ?? "DulceFlow"}
      subtitle={`Controla ventas, gastos y movimientos${businessSettings ? ` en ${businessSettings.currency}` : ""}.`}
      action={<Badge label="MVP" />}
    >
      <View style={{ gap: 16 }}>
        <MetricCard label="Ingresos del periodo" amount="$0.00" tone="success" />
        <MetricCard label="Gastos del periodo" amount="$0.00" tone="danger" />
        <MetricCard label="Ganancia estimada" amount="$0.00" />
      </View>

      <SectionHeader
        title="Accesos rapidos"
        subtitle="Estos botones quedaran conectados en las fases de gastos y ordenes."
      />
      <View style={{ gap: 12 }}>
        <Button label="Nueva orden" />
        <Button label="Registrar gasto" variant="secondary" />
      </View>

      <SectionHeader
        title="Ultimos movimientos"
        subtitle="La tabla movements sera la fuente de verdad del dashboard."
      />
      <EmptyState
        eyebrow="Sin datos"
        title="Todavia no tienes movimientos"
        description="Cuando registres ventas o gastos, apareceran aqui con impacto financiero."
      />
      <ListItem title="Filtro actual" subtitle="Este mes" trailing={<Badge label="Listo" />} />
    </Screen>
  );
}
