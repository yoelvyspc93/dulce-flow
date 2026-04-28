import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import {
  formatAmount,
  loadDashboardDataAsync,
  type DashboardData,
  type DashboardPeriodFilter,
} from "@/features/home/services/dashboard.service";
import { MetricCard, SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen, SelectField } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";

const PERIODS: DashboardPeriodFilter[] = ["today", "week", "month", "all"];
const PERIOD_LABELS: Record<DashboardPeriodFilter, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  all: "Todo",
};

export function HomeScreen() {
  const businessSettings = useAppStore((state) => state.businessSettings);
  const [periodIndex, setPeriodIndex] = useState(2);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const period = PERIODS[periodIndex];
  const currency = businessSettings?.currency ?? "USD";

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAsync() {
        setIsLoading(true);
        const data = await loadDashboardDataAsync(period);

        if (isActive) {
          setDashboardData(data);
          setIsLoading(false);
        }
      }

      void loadAsync();

      return () => {
        isActive = false;
      };
    }, [period])
  );

  const summary = dashboardData?.summary ?? {
    totalIn: 0,
    totalOut: 0,
    netProfit: 0,
  };
  const latestMovements = dashboardData?.latestMovements ?? [];

  return (
    <Screen title={businessSettings?.businessName ?? "DulceFlow"}>
      <View style={{ gap: 16 }}>
        <MetricCard label="Ingresos del periodo" amount={formatAmount(summary.totalIn, currency)} tone="success" />
        <MetricCard label="Gastos del periodo" amount={formatAmount(summary.totalOut, currency)} tone="danger" />
        <MetricCard
          label="Ganancia estimada"
          amount={formatAmount(summary.netProfit, currency)}
          tone={summary.netProfit < 0 ? "danger" : "default"}
        />
      </View>

      <SelectField
        label="Periodo"
        onValueChange={(selectedPeriod) => {
          setPeriodIndex(Math.max(0, PERIODS.findIndex((item) => item === selectedPeriod)));
        }}
        options={PERIODS.map((item) => ({ label: PERIOD_LABELS[item], value: item }))}
        value={period}
      />

      <SectionHeader
        title="Accesos rapidos"
        subtitle="Registra ventas y salidas sin navegar por todo el catalogo."
      />
      <View style={{ gap: 12 }}>
        <Button label="Nueva orden" onPress={() => router.push("/orders/new")} />
        <Button label="Registrar gasto" onPress={() => router.push("/expenses/new")} variant="secondary" />
      </View>

      <SectionHeader
        title="Ultimos movimientos"
        subtitle={isLoading ? "Cargando movimientos..." : "La tabla movements es la fuente financiera."}
      />
      {latestMovements.length === 0 && !isLoading ? (
        <EmptyState
          eyebrow="Sin datos"
          title="Todavia no tienes movimientos"
          description="Cuando registres ventas o gastos, apareceran aqui con impacto financiero."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {latestMovements.map((movement) => (
          <ListItem
            key={movement.id}
            title={movement.description}
            subtitle={`${movement.type} - ${new Date(movement.movementDate).toLocaleDateString()}`}
            trailing={
              <Badge
                label={formatAmount(movement.amount, currency)}
                tone={movement.direction === "in" ? "success" : "danger"}
              />
            }
          />
        ))}
      </View>
    </Screen>
  );
}
