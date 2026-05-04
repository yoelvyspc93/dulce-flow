import { router, useFocusEffect } from "expo-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

import {
  loadDashboardDataAsync,
  type DashboardData,
  type DashboardPeriodFilter,
} from "@/features/home/services/dashboard.service";
import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen, SegmentedControl } from "@/shared/ui";
import { formatDisplayDate } from "@/shared/utils/date";
import { formatMoney } from "@/shared/utils/money";
import { useAppStore } from "@/store/app.store";
import { colors, radius, spacing, typography } from "@/theme";

const HOME_DECORATIVE_IMAGE = require("../../../../assets/home-decorative.png");
const INCOME_COLOR = "#82C66F";
const EXPENSE_COLOR = "#FF5E61";

const PERIODS: DashboardPeriodFilter[] = ["today", "week", "month", "all"];
const PERIOD_LABELS: Record<DashboardPeriodFilter, string> = {
  today: "Hoy",
  week: "Semana",
  month: "Mes",
  all: "Año",
};

export function HomeScreen() {
  const businessSettings = useAppStore((state) => state.businessSettings);
  const [periodIndex, setPeriodIndex] = useState(2);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const period = PERIODS[periodIndex];

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
  const pendingOrders = dashboardData?.pendingOrders ?? [];
  const totalFlow = summary.totalIn + summary.totalOut;
  const incomePercent = totalFlow > 0 ? summary.totalIn / totalFlow : 0;
  const expensePercent = totalFlow > 0 ? summary.totalOut / totalFlow : 0;

  return (
    <Screen title="DulceFlow">
      <View style={{ marginBottom: 8 }}>
        <Text numberOfLines={1} style={styles.greeting}>Hola,</Text>
        <View style={{ alignItems: "center", flexDirection: "row" }}>
          <Text numberOfLines={1} style={styles.greeting}>{businessSettings?.businessName ?? "DulceFlow"} </Text>
          <Text accessibilityLabel="mano saludando" style={{ ...typography.title }}>
            👋
          </Text>
        </View>
      </View>
      <View style={styles.summarySection}>
        <SegmentedControl
          accessibilityLabel="Periodo del resumen financiero"
          menuAccessibilityLabel="Mostrar todos los periodos"
          onValueChange={(selectedPeriod) => {
            setPeriodIndex(Math.max(0, PERIODS.findIndex((item) => item === selectedPeriod)));
          }}
          options={PERIODS.map((item) => ({ label: PERIOD_LABELS[item], value: item }))}
          value={period}
        />

        <View style={styles.heroCard}>
          <ImageBackground
            accessibilityIgnoresInvertColors
            imageStyle={styles.heroImage}
            resizeMode="cover"
            source={HOME_DECORATIVE_IMAGE}
            style={styles.heroBackground}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Ganancia</Text>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={styles.heroAmount}
              >
                {formatMoney(summary.netProfit)}
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.metricGrid}>
          <SummaryMetric
            amount={formatMoney(summary.totalIn)}
            label="Ingresos"
            progress={incomePercent}
            tone="success"
          />
          <SummaryMetric
            amount={formatMoney(summary.totalOut)}
            label="Gastos"
            progress={expensePercent}
            tone="danger"
          />
        </View>
      </View>

      <SectionHeader
        title="Accesos rapidos"
        subtitle="Abren los mismos formularios que encuentras en Pedidos y Gastos."
      />
      <View style={{ gap: 12 }}>
        <Button label="Nuevo pedido" onPress={() => router.push("/orders/new")} />
        <Button label="Registrar gasto" onPress={() => router.push("/expenses/new")} variant="outlineLight" />
      </View>

      <SectionHeader
        title="Pedidos pendientes"
        subtitle={isLoading ? "Cargando pedidos..." : `${pendingOrders.length} pedidos por entregar`}
      />
      {pendingOrders.length === 0 && !isLoading ? (
        <EmptyState
          eyebrow="Sin pendientes"
          title="No tienes pedidos pendientes"
          description="Cuando crees pedidos, apareceran aqui ordenados por fecha."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {pendingOrders.map((order) => (
          <ListItem
            key={order.id}
            onPress={() => router.push(`/orders/${order.id}`)}
            title={order.customerName ?? order.orderNumber}
            subtitle={`${formatDisplayDate(order.dueDate)} - ${formatMoney(order.total)}`}
            trailing={<Badge label="Pendiente" tone="warning" />}
          />
        ))}
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
            subtitle={formatDisplayDate(movement.movementDate)}
            trailing={
              <Badge
                label={formatMoney(movement.amount)}
                tone={movement.direction === "in" ? "success" : "danger"}
              />
            }
          />
        ))}
      </View>
    </Screen>
  );
}

type SummaryMetricProps = {
  label: string;
  amount: string;
  progress: number;
  tone: "success" | "danger";
};

function SummaryMetric({ label, amount, progress, tone }: SummaryMetricProps) {
  const toneColor = tone === "success" ? INCOME_COLOR : EXPENSE_COLOR;
  const progressWidth = `${Math.max(0, Math.min(progress, 1)) * 100}%` as `${number}%`;
  const Icon = tone === "success" ? ArrowUpRight : ArrowDownRight;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: toneColor }]}>
        <Icon color={colors.white} size={24} strokeWidth={2.4} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={styles.metricAmount}
      >
        {amount}
      </Text>
      <View style={styles.metricProgressTrack}>
        <View style={[styles.metricProgressFill, { backgroundColor: toneColor, width: progressWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summarySection: {
    gap: spacing.md,
  },
  heroCard: {
    minHeight: 154,
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: colors.backgroundAccent,
  },
  heroBackground: {
    minHeight: 154,
    justifyContent: "center",
  },
  heroImage: {
    borderRadius: radius.lg,
  },
  heroContent: {
    width: "62%",
    minHeight: 154,
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  greeting: {
    ...typography.title,
    color: colors.text
  },
  heroLabel: {
    color: "rgba(255, 255, 255, 0.78)",
    ...typography.bodyStrong,
  },
  heroAmount: {
    ...typography.title,
    color: colors.darkGray,
  },
  metricGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minHeight: 156,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  metricLabel: {
    color: colors.textMuted,
    ...typography.body,
  },
  metricAmount: {
    ...typography.section,
    color: colors.text,
  },
  metricProgressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginTop: spacing.sm,
  },
  metricProgressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
});
