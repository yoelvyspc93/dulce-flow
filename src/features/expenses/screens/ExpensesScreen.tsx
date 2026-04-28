import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import {
  listExpensesAsync,
  type ExpenseCategoryFilter,
  type ExpensePeriodFilter,
} from "@/features/expenses/services/expense.service";
import { EXPENSE_CATEGORIES } from "@/features/expenses/validations/expense.schema";
import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen, SelectField } from "@/shared/ui";
import type { Expense } from "@/shared/types";

const PERIODS: ExpensePeriodFilter[] = ["today", "week", "month", "all"];
const CATEGORIES: ExpenseCategoryFilter[] = ["all", ...EXPENSE_CATEGORIES];

export function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [periodIndex, setPeriodIndex] = useState(2);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const period = PERIODS[periodIndex];
  const category = CATEGORIES[categoryIndex];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadExpensesAsync() {
        setIsLoading(true);
        const loadedExpenses = await listExpensesAsync({ period, category });

        if (isActive) {
          setExpenses(loadedExpenses);
          setIsLoading(false);
        }
      }

      void loadExpensesAsync();

      return () => {
        isActive = false;
      };
    }, [category, period])
  );

  return (
    <Screen title="Gastos" subtitle="Cada gasto activo impacta el dashboard y queda auditable.">
      <View style={{ gap: 12 }}>
        <Button label="Registrar gasto" onPress={() => router.push("/expenses/new")} />
        <SelectField
          label="Filtro por categoria"
          onValueChange={(selectedCategory) => {
            setCategoryIndex(Math.max(0, CATEGORIES.findIndex((item) => item === selectedCategory)));
          }}
          options={CATEGORIES.map((item) => ({ label: item, value: item }))}
          value={category}
        />
        <SelectField
          label="Filtro por periodo"
          onValueChange={(selectedPeriod) => {
            setPeriodIndex(Math.max(0, PERIODS.findIndex((item) => item === selectedPeriod)));
          }}
          options={PERIODS.map((item) => ({ label: item, value: item }))}
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
          <ListItem
            key={expense.id}
            onPress={() => router.push(`/expenses/${expense.id}`)}
            title={expense.supplyName}
            subtitle={`$${expense.total.toFixed(2)} - ${expense.category}`}
            trailing={<Badge label={expense.status === "active" ? "Activo" : "Anulado"} tone={expense.status === "active" ? "success" : "neutral"} />}
          />
        ))}
      </View>
    </Screen>
  );
}
