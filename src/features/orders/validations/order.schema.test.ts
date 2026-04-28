import { orderSchema } from "./order.schema";

describe("orderSchema", () => {
  it("accepts a valid order", () => {
    expect(
      orderSchema.parse({
        productId: "product_1",
        quantity: "2",
        discount: "1",
        paymentStatus: "paid",
      })
    ).toEqual({
      productId: "product_1",
      quantity: 2,
      discount: 1,
      paymentStatus: "paid",
    });
  });

  it("rejects missing product or invalid quantity", () => {
    expect(() => orderSchema.parse({ productId: "", quantity: 0 })).toThrow();
  });
});
