import { expenseSchema } from "./expense.schema";

describe("expenseSchema", () => {
  it("accepts a valid expense", () => {
    expect(
      expenseSchema.parse({
        supplyId: "supply_1",
        supplyName: "Azucar",
        quantity: "2",
        unit: "kg",
        unitPrice: "5",
      })
    ).toEqual({
      supplyId: "supply_1",
      supplyName: "Azucar",
      quantity: 2,
      unit: "kg",
      unitPrice: 5,
    });
  });

  it("rejects missing supply and invalid numbers", () => {
    expect(() => expenseSchema.parse({ supplyName: "", quantity: 0, unit: "kg", unitPrice: 0 })).toThrow();
  });

  it("rejects invalid unit", () => {
    expect(() =>
      expenseSchema.parse({
        supplyId: "supply_1",
        supplyName: "Azucar",
        quantity: 1,
        unit: "invalid",
        unitPrice: 5,
      })
    ).toThrow();
  });
});
