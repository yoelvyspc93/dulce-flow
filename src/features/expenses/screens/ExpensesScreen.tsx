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
import { Badge, Button, EmptyState, ListItem, Screen } from "@/shared/ui";
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
        <ListItem
          onPress={() => setCategoryIndex((current) => (current + 1) % CATEGORIES.length)}
          title="Filtro por categoria"
          subtitle={category}
          trailing={<Badge label="Cambiar" />}
        />
        <ListItem
          onPress={() => setPeriodIndex((current) => (current + 1) % PERIODS.length)}
          title="Filtro por periodo"
          subtitle={period}
          trailing={<Badge label="Cambiar" />}
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
