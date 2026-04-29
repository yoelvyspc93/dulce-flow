import { orderSchema } from "./order.schema";

describe("orderSchema", () => {
  it("accepts a valid order", () => {
    expect(
      orderSchema.parse({
        dueDate: "2026-04-29",
        items: [{ productId: "product_1", quantity: "2", unitPrice: "5" }],
      })
    ).toEqual({
      dueDate: "2026-04-29",
      items: [{ productId: "product_1", quantity: 2, unitPrice: 5 }],
    });
  });

  it("rejects missing product or invalid quantity", () => {
    expect(() => orderSchema.parse({ dueDate: "2026-04-29", items: [{ productId: "", quantity: 0, unitPrice: 1 }] })).toThrow();
  });
});
