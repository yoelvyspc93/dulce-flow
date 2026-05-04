import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import {
  listOrdersAsync,
  type OrderStatusFilter,
} from "@/features/orders/services/order.service";
import type { Order } from "@/shared/types";

const PAGE_SIZE = 20;

type PaginatedOrdersState = {
  items: Order[];
  isInitialLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
};

type UsePaginatedOrdersArgs = {
  status: OrderStatusFilter;
};

function getCursor(orders: Order[]) {
  const lastOrder = orders.at(-1);
  return lastOrder ? { createdAt: lastOrder.createdAt, id: lastOrder.id } : null;
}

export function usePaginatedOrders({ status }: UsePaginatedOrdersArgs): PaginatedOrdersState {
  const [items, setItems] = useState<Order[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);
  const itemsRef = useRef<Order[]>([]);
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

    const nextItems = await listOrdersAsync({ status, limit: PAGE_SIZE });

    if (requestIdRef.current !== requestId) {
      return;
    }

    itemsRef.current = nextItems;
    setItems(nextItems);
    const nextHasMore = nextItems.length === PAGE_SIZE;
    hasMoreRef.current = nextHasMore;
    setHasMore(nextHasMore);
    setIsInitialLoading(false);
  }, [status]);

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
      const nextItems = await listOrdersAsync({ status, cursor, limit: PAGE_SIZE });

      if (requestIdRef.current !== requestId) {
        return;
      }

      const existingIds = new Set(itemsRef.current.map((order) => order.id));
      const mergedItems = [
        ...itemsRef.current,
        ...nextItems.filter((order) => !existingIds.has(order.id)),
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
  }, [status]);

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
