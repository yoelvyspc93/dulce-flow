import { MovementRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Movement } from "@/shared/types";

const baseMovement: Movement = {
  id: "movement_1",
  type: "income",
  direction: "in",
  sourceType: "order",
  sourceId: "order_1",
  amount: 20,
  description: "Ingreso",
  status: "active",
  movementDate: "2026-04-28T10:00:00.000Z",
  createdAt: "2026-04-28T10:01:00.000Z",
  updatedAt: "2026-04-28T10:01:00.000Z",
};

describe("MovementRepository", () => {
  it("creates and reads latest active movements with optional fields mapped", async () => {
    const mock = createMockDatabaseClient();
    const repository = new MovementRepository(mock.client);

    await repository.createAsync({ ...baseMovement, sourceId: undefined, reversedMovementId: undefined });

    await expect(repository.getLatestAsync()).resolves.toEqual([
      { ...baseMovement, sourceId: undefined, reversedMovementId: undefined },
    ]);
  });

  it("returns latest active movements ordered by movement date and created date with limit", async () => {
    const mock = createMockDatabaseClient();
    const repository = new MovementRepository(mock.client);

    await repository.createAsync({ ...baseMovement, id: "old", movementDate: "2026-04-27T10:00:00.000Z" });
    await repository.createAsync({ ...baseMovement, id: "same_older_create", movementDate: "2026-04-29T10:00:00.000Z", createdAt: "2026-04-29T10:01:00.000Z" });
    await repository.createAsync({ ...baseMovement, id: "same_newer_create", movementDate: "2026-04-29T10:00:00.000Z", createdAt: "2026-04-29T10:02:00.000Z" });
    await repository.createAsync({ ...baseMovement, id: "voided", status: "voided", movementDate: "2026-04-30T10:00:00.000Z" });

    const latest = await repository.getLatestAsync(2);

    expect(latest.map((movement) => movement.id)).toEqual(["same_newer_create", "same_older_create"]);
  });

  it("finds only the newest active movement for a source", async () => {
    const mock = createMockDatabaseClient();
    const repository = new MovementRepository(mock.client);

    await repository.createAsync({ ...baseMovement, id: "older", createdAt: "2026-04-28T10:01:00.000Z" });
    await repository.createAsync({ ...baseMovement, id: "newer", createdAt: "2026-04-28T10:02:00.000Z" });
    await repository.createAsync({ ...baseMovement, id: "voided", status: "voided", createdAt: "2026-04-28T10:03:00.000Z" });

    await expect(repository.getActiveBySourceAsync("order", "order_1")).resolves.toMatchObject({ id: "newer" });
    await expect(repository.getActiveBySourceAsync("expense", "missing")).resolves.toBeNull();
  });

  it("updates movement status and excludes it from active reads and summaries", async () => {
    const mock = createMockDatabaseClient();
    const repository = new MovementRepository(mock.client);

    await repository.createAsync(baseMovement);
    await repository.updateStatusAsync("movement_1", "reversed", "2026-04-28T12:00:00.000Z");

    await expect(repository.getLatestAsync()).resolves.toEqual([]);
    await expect(
      repository.getSummaryByDateRangeAsync("2026-04-01T00:00:00.000Z", "2026-04-30T23:59:59.999Z")
    ).resolves.toEqual({ totalIn: 0, totalOut: 0, netProfit: 0 });
  });

  it("summarizes active movements in a date range", async () => {
    const mock = createMockDatabaseClient();
    const repository = new MovementRepository(mock.client);

    await repository.createAsync({ ...baseMovement, id: "income", amount: 40 });
    await repository.createAsync({
      ...baseMovement,
      id: "expense",
      type: "expense",
      direction: "out",
      sourceType: "expense",
      sourceId: "expense_1",
      amount: 15,
    });
    await repository.createAsync({
      ...baseMovement,
      id: "outside_range",
      movementDate: "2026-03-31T23:00:00.000Z",
      amount: 100,
    });

    await expect(
      repository.getSummaryByDateRangeAsync("2026-04-01T00:00:00.000Z", "2026-04-30T23:59:59.999Z")
    ).resolves.toEqual({ totalIn: 40, totalOut: 15, netProfit: 25 });
  });

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
