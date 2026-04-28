import type { Movement, Order } from "@/shared/types";

import {
  calculateOrderTotals,
  createIncomeMovement,
  createOrderReversalMovement,
  getOrderPeriodStart,
} from "./order.service";

const baseOrder: Order = {
  id: "order_1",
  orderNumber: "ORD-1",
  subtotal: 20,
  discount: 0,
  total: 20,
  status: "delivered",
  paymentStatus: "pending",
  createdAt: "2026-04-28T10:00:00.000Z",
  updatedAt: "2026-04-28T10:00:00.000Z",
};

describe("order financial rules", () => {
  it("calculates subtotal and total", () => {
    expect(calculateOrderTotals(5, 3, 2)).toEqual({
      subtotal: 15,
      total: 13,
    });
  });

  it("rejects discounts greater than subtotal", () => {
    expect(() => calculateOrderTotals(5, 1, 6)).toThrow("DISCOUNT_EXCEEDS_SUBTOTAL");
  });

  it("creates an income movement for delivered orders", () => {
    const movement = createIncomeMovement(baseOrder, "2026-04-28T11:00:00.000Z");

    expect(movement).toMatchObject({
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_1",
      amount: 20,
      status: "active",
    });
  });

  it("creates an outgoing reversal for cancelled delivered orders", () => {
    const originalMovement: Movement = {
      id: "movement_1",
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_1",
      amount: 20,
      description: "Ingreso",
      status: "active",
      movementDate: "2026-04-28T11:00:00.000Z",
      createdAt: "2026-04-28T11:00:00.000Z",
      updatedAt: "2026-04-28T11:00:00.000Z",
    };

    const movement = createOrderReversalMovement(baseOrder, originalMovement, "2026-04-28T12:00:00.000Z");

    expect(movement).toMatchObject({
      type: "reversal",
      direction: "out",
      sourceType: "order",
      sourceId: "order_1",
      amount: 20,
      reversedMovementId: "movement_1",
    });
  });

  it("returns a start date for month filters", () => {
    expect(getOrderPeriodStart("month", new Date("2026-04-28T15:00:00.000Z"))).toEqual(
      new Date(2026, 3, 1)
    );
  });
});
