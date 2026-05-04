import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { ExpenseCard } from "@/features/expenses/components/ExpenseCard";
import {
  listExpensesAsync,
  type ExpensePeriodFilter,
} from "@/features/expenses/services/expense.service";
import { SectionHeader } from "@/shared/components";
import type { Expense } from "@/shared/types";
import { Button, EmptyState, Screen, SegmentedControl } from "@/shared/ui";
import { formatPeriod } from "@/shared/utils/labels";

const PERIODS: ExpensePeriodFilter[] = ["today", "week", "month", "all"];

export function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [periodIndex, setPeriodIndex] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const period = PERIODS[periodIndex];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadExpensesAsync() {
        setIsLoading(true);
        const loadedExpenses = await listExpensesAsync({ period });

        if (isActive) {
          setExpenses(loadedExpenses);
          setIsLoading(false);
        }
      }

      void loadExpensesAsync();

      return () => {
        isActive = false;
      };
    }, [period])
  );

  return (
    <Screen title="Gastos">
      <View style={{ gap: 12 }}>
        <Button label="Registrar gasto" onPress={() => router.push("/expenses/new")} />
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
      </View>

      <SectionHeader
        title="Gastos registrados"
        subtitle={isLoading ? "Cargando gastos..." : `${expenses.length} gastos encontrados`}
      />
      {expenses.length === 0 && !isLoading ? (
        <EmptyState
          eyebrow="Sin gastos"
          title="Todavia no tienes gastos registrados"
          description="Agrega tu primer gasto para calcular mejor tus ganancias."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onPress={() => router.push(`/expenses/${expense.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}
