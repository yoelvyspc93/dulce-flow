import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import {
  listExpensesAsync,
  type ExpensePeriodFilter,
} from "@/features/expenses/services/expense.service";
import type { Expense } from "@/shared/types";

const PAGE_SIZE = 20;

type PaginatedExpensesState = {
  items: Expense[];
  isInitialLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
};

type UsePaginatedExpensesArgs = {
  period: ExpensePeriodFilter;
};

function getCursor(expenses: Expense[]) {
  const lastExpense = expenses.at(-1);
  return lastExpense ? { createdAt: lastExpense.createdAt, id: lastExpense.id } : null;
}

export function usePaginatedExpenses({ period }: UsePaginatedExpensesArgs): PaginatedExpensesState {
  const [items, setItems] = useState<Expense[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);
  const itemsRef = useRef<Expense[]>([]);
  const hasMoreRef = useRef(true);
  const isFetchingMoreRef = useRef(false);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsInitialLoading(true);
    itemsRef.current = [];
    setItems([]);
    setHasMore(true);
    hasMoreRef.current = true;

    const nextItems = await listExpensesAsync({ period, limit: PAGE_SIZE });

    if (requestIdRef.current !== requestId) {
      return;
    }

    itemsRef.current = nextItems;
    setItems(nextItems);
    const nextHasMore = nextItems.length === PAGE_SIZE;
    hasMoreRef.current = nextHasMore;
    setHasMore(nextHasMore);
    setIsInitialLoading(false);
  }, [period]);

  const loadMore = useCallback(async () => {
    if (isFetchingMoreRef.current || !hasMoreRef.current || itemsRef.current.length === 0) {
      return;
    }

    const cursor = getCursor(itemsRef.current);
    if (!cursor) {
      return;
    }

    isFetchingMoreRef.current = true;
    setIsFetchingMore(true);
    const requestId = requestIdRef.current;

    try {
      const nextItems = await listExpensesAsync({ period, cursor, limit: PAGE_SIZE });

      if (requestIdRef.current !== requestId) {
        return;
      }

      const existingIds = new Set(itemsRef.current.map((expense) => expense.id));
      const mergedItems = [
        ...itemsRef.current,
        ...nextItems.filter((expense) => !existingIds.has(expense.id)),
      ];
      itemsRef.current = mergedItems;
      setItems(mergedItems);
      const nextHasMore = nextItems.length === PAGE_SIZE;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
    } finally {
      if (requestIdRef.current === requestId) {
        isFetchingMoreRef.current = false;
        setIsFetchingMore(false);
      }
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      void refresh();

      return () => {
        requestIdRef.current += 1;
      };
    }, [refresh])
  );

  return {
    items,
    isInitialLoading,
    isFetchingMore,
    hasMore,
    refresh,
    loadMore,
  };
}
