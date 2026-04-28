import { supplySchema } from "./supply.schema";

describe("supplySchema", () => {
  it("accepts a valid supply", () => {
    expect(
      supplySchema.parse({
        name: "Harina",
        unit: "kg",
        category: "ingredients",
      })
    ).toEqual({
      name: "Harina",
      unit: "kg",
      category: "ingredients",
    });
  });

  it("rejects missing name or unit", () => {
    expect(() => supplySchema.parse({ name: "", unit: "" })).toThrow();
  });
});
