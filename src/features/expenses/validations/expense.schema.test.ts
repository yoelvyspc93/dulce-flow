import { expenseSchema } from "./expense.schema";

describe("expenseSchema", () => {
  it("accepts a valid expense", () => {
    expect(
      expenseSchema.parse({
        supplyName: "Azucar",
        category: "ingredients",
        quantity: "2",
        unit: "kg",
        total: "10",
      })
    ).toEqual({
      supplyName: "Azucar",
      category: "ingredients",
      quantity: 2,
      unit: "kg",
      total: 10,
    });
  });

  it("rejects missing supply name and invalid total", () => {
    expect(() => expenseSchema.parse({ supplyName: "", category: "ingredients", total: 0 })).toThrow();
  });
});
