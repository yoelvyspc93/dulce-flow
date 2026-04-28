import { orderSchema } from "./order.schema";

describe("orderSchema", () => {
  it("accepts a valid order", () => {
    expect(
      orderSchema.parse({
        items: [{ productId: "product_1", quantity: "2", unitPrice: "5" }],
        paymentStatus: "paid",
      })
    ).toEqual({
      items: [{ productId: "product_1", quantity: 2, unitPrice: 5 }],
      paymentStatus: "paid",
    });
  });

  it("rejects missing product or invalid quantity", () => {
    expect(() => orderSchema.parse({ items: [{ productId: "", quantity: 0, unitPrice: 1 }] })).toThrow();
  });
});
