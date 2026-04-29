import { orderSchema } from "./order.schema";

describe("orderSchema", () => {
  it("accepts a valid order", () => {
    expect(
      orderSchema.parse({
        customerName: "Maria",
        dueDate: "2026-04-29",
        items: [{ productId: "product_1", quantity: "2", unitPrice: "5" }],
      })
    ).toEqual({
      customerName: "Maria",
      dueDate: "2026-04-29",
      items: [{ productId: "product_1", quantity: 2, unitPrice: 5 }],
    });
  });

  it("rejects missing customer name", () => {
    expect(() =>
      orderSchema.parse({
        customerName: "",
        dueDate: "2026-04-29",
        items: [{ productId: "product_1", quantity: "2", unitPrice: "5" }],
      })
    ).toThrow("El nombre del cliente es obligatorio.");
  });

  it("returns friendly messages for invalid numeric values", () => {
    expect(() =>
      orderSchema.parse({
        customerName: "Maria",
        dueDate: "2026-04-29",
        items: [{ productId: "product_1", quantity: Number.NaN, unitPrice: 5 }],
      })
    ).toThrow("La cantidad debe ser un numero valido.");
  });

  it("rejects missing product or invalid quantity", () => {
    expect(() =>
      orderSchema.parse({
        customerName: "Maria",
        dueDate: "2026-04-29",
        items: [{ productId: "", quantity: 0, unitPrice: 1 }],
      })
    ).toThrow();
  });
});
