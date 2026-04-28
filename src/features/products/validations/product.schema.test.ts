import { productSchema } from "./product.schema";

describe("productSchema", () => {
  it("accepts a valid product", () => {
    expect(
      productSchema.parse({
        name: "Cupcake",
        price: "3.5",
        description: "Vainilla",
      })
    ).toEqual({
      name: "Cupcake",
      price: 3.5,
      description: "Vainilla",
    });
  });

  it("rejects empty names and non-positive prices", () => {
    expect(() => productSchema.parse({ name: "", price: 0 })).toThrow();
  });
});
