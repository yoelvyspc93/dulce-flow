import { calculateRecipeCost, suggestSalePrice } from "./product.service";

describe("product recipe pricing", () => {
  it("calculates recipe cost from ingredients", () => {
    expect(
      calculateRecipeCost([
        { quantity: 2, unitPrice: 3 },
        { quantity: 0.5, unitPrice: 10 },
      ])
    ).toBe(11);
  });

  it("suggests sale price from cost and margin", () => {
    expect(suggestSalePrice(10, 30)).toBe(13);
  });
});
