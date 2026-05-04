import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Receipt } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ExpenseCard } from "@/features/expenses/components/ExpenseCard";
import { usePaginatedExpenses } from "@/features/expenses/hooks/usePaginatedExpenses";
import { type ExpensePeriodFilter } from "@/features/expenses/services/expense.service";
import { SectionHeader } from "@/shared/components";
import type { Expense } from "@/shared/types";
import { EmptyState, Screen, SegmentedControl } from "@/shared/ui";
import { formatPeriod } from "@/shared/utils/labels";
import { colors, spacing } from "@/theme";

const PERIODS: ExpensePeriodFilter[] = ["today", "week", "month", "all"];

export function ExpensesScreen() {
  const [periodIndex, setPeriodIndex] = useState(2);
  const period = PERIODS[periodIndex];
  const {
    items: expenses,
    isInitialLoading,
    isFetchingMore,
    refresh,
    loadMore,
  } = usePaginatedExpenses({ period });

  const renderExpense = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseCard
        expense={item}
        onPress={() => router.push(`/expenses/${item.id}`)}
      />
    ),
    []
  );

  return (
    <Screen
      addAction={{ accessibilityLabel: "Registrar gasto", onPress: () => router.push("/expenses/new") }}
      scrollable={false}
      title="Gastos"
    >
      <FlashList
        contentContainerStyle={styles.listContent}
        data={expenses}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(expense) => expense.id}
        ListEmptyComponent={
          isInitialLoading ? (
            <ActivityIndicator color={colors.accent} style={styles.loading} />
          ) : (
            <EmptyState
              action={{ label: "Registrar gasto", onPress: () => router.push("/expenses/new") }}
              icon={Receipt}
              title="Todavia no tienes gastos registrados"
              description="Agrega tu primer gasto para calcular mejor tus ganancias."
            />
          )
        }
        ListFooterComponent={
          isFetchingMore ? <ActivityIndicator color={colors.accent} style={styles.footerLoading} /> : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl
              accessibilityLabel="Filtro por periodo"
              menuAccessibilityLabel="Mostrar todos los periodos"
              onValueChange={(selectedPeriod) => {
                setPeriodIndex(Math.max(0, PERIODS.findIndex((item) => item === selectedPeriod)));
              }}
              options={PERIODS.map((item) => ({ label: formatPeriod(item), value: item }))}
              visibleOptionCount={3}
              value={period}
            />
            <SectionHeader
              title="Gastos registrados"
              subtitle={isInitialLoading ? "Cargando gastos..." : `${expenses.length} gastos cargados`}
            />
          </View>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        onRefresh={refresh}
        refreshing={isInitialLoading && expenses.length > 0}
        renderItem={renderExpense}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  footerLoading: {
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
});
