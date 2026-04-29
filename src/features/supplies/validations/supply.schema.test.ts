import { supplySchema } from "./supply.schema";

describe("supplySchema", () => {
  it("accepts a valid supply", () => {
    expect(
      supplySchema.parse({
        name: "Harina",
        unit: "kg",
        defaultPrice: "12.5",
      })
    ).toEqual({
      name: "Harina",
      unit: "kg",
      defaultPrice: 12.5,
    });
  });

  it("rejects missing name or unit", () => {
    expect(() => supplySchema.parse({ name: "", unit: "" })).toThrow();
  });

  it("rejects units outside the fixed list", () => {
    expect(() => supplySchema.parse({ name: "Harina", unit: "saco" })).toThrow();
  });

  it("returns a friendly message for invalid default prices", () => {
    expect(() => supplySchema.parse({ name: "Harina", unit: "kg", defaultPrice: Number.NaN })).toThrow(
      "El precio establecido debe ser un numero valido."
    );
  });
});
