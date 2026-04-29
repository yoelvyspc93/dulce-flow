import { MovementRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

describe("MovementRepository", () => {
  it("summarizes expenses without counting order reversals as period expenses", async () => {
    const mock = createMockDatabaseClient();
    const repository = new MovementRepository(mock.client);

    mock.setMovementSummaryRows([
      { direction: "out", type: "expense", source_type: "expense", total: 5 },
      { direction: "out", type: "reversal", source_type: "order", total: 10 },
      { direction: "in", type: "income", source_type: "order", total: 20 },
    ]);

    await expect(
      repository.getSummaryByDateRangeAsync("2026-04-01T00:00:00.000Z", "2026-04-30T23:59:59.999Z")
    ).resolves.toEqual({
      totalIn: 20,
      totalOut: 5,
      netProfit: 15,
    });
  });
});
