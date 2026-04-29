import { getDatabaseAsync } from "@/database/connection";
import { ExpenseRepository, SupplyRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Expense, Supply } from "@/shared/types";

import {
  createSupplyAsync,
  deleteSupplyPermanentlyAsync,
  getSupplyAsync,
  getSupplyUsageCountAsync,
  listSuppliesAsync,
  setSupplyActiveAsync,
  updateSupplyAsync,
} from "./supply.service";

jest.mock("@/database/connection", () => ({
  getDatabaseAsync: jest.fn(),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

describe("supply service", () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockedGetDatabaseAsync.mockReset();
  });

  it("creates, lists, reads, updates and activates supplies", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));

    const supply = await createSupplyAsync({ name: " Azucar ", unit: "kg", defaultPrice: 4 });
    const updated = await updateSupplyAsync(supply, { name: "Harina", unit: "lb", defaultPrice: 5 });
    const inactive = await setSupplyActiveAsync(updated, false);

    jest.useRealTimers();
    expect(supply).toMatchObject({ name: "Azucar", unit: "kg", defaultPrice: 4, isActive: true });
    expect(updated).toMatchObject({ name: "Harina", unit: "lb", defaultPrice: 5 });
    expect(inactive).toMatchObject({ isActive: false });
    await expect(listSuppliesAsync()).resolves.toEqual([inactive]);
    await expect(getSupplyAsync(supply.id)).resolves.toEqual(inactive);
  });

  it("blocks duplicated supply names across active and inactive supplies", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);

    const supply = await createSupplyAsync({ name: " Azucar ", unit: "kg", defaultPrice: 4 });
    await expect(createSupplyAsync({ name: "azucar", unit: "kg", defaultPrice: 5 })).rejects.toThrow(
      "SUPPLY_NAME_DUPLICATED"
    );

    const inactive = await setSupplyActiveAsync(supply, false);
    await expect(createSupplyAsync({ name: "AZUCAR", unit: "kg", defaultPrice: 5 })).rejects.toThrow(
      "SUPPLY_NAME_DUPLICATED"
    );
    await expect(updateSupplyAsync(inactive, { name: " Azucar ", unit: "kg", defaultPrice: 6 })).resolves.toMatchObject({
      name: "Azucar",
      defaultPrice: 6,
    });
  });

  it("blocks updates to another supply name", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);

    await createSupplyAsync({ name: "Azucar", unit: "kg", defaultPrice: 4 });
    const harina = await createSupplyAsync({ name: "Harina", unit: "kg", defaultPrice: 5 });

    await expect(updateSupplyAsync(harina, { name: " azucar ", unit: "kg", defaultPrice: 5 })).rejects.toThrow(
      "SUPPLY_NAME_DUPLICATED"
    );
  });

  it("blocks permanent deletion when a supply has expense history", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const supplyRepository = new SupplyRepository(mock.client);
    const expenseRepository = new ExpenseRepository(mock.client);
    const supply: Supply = {
      id: "supply_1",
      name: "Azucar",
      unit: "kg",
      defaultPrice: 4,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    };
    const expense: Expense = {
      id: "expense_1",
      supplyId: "supply_1",
      supplyName: "Azucar",
      quantity: 1,
      unit: "kg",
      unitPrice: 10,
      total: 10,
      status: "active",
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    };
    await supplyRepository.createAsync(supply);
    await expenseRepository.createAsync(expense);

    await expect(getSupplyUsageCountAsync("supply_1")).resolves.toBe(1);
    await expect(deleteSupplyPermanentlyAsync(supply)).rejects.toThrow("SUPPLY_HAS_HISTORY");
    await expect(supplyRepository.getByIdAsync("supply_1")).resolves.toMatchObject({ isActive: true });
  });

  it("deletes supplies permanently when there is no history", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const supplyRepository = new SupplyRepository(mock.client);
    const supply: Supply = {
      id: "supply_1",
      name: "Azucar",
      unit: "kg",
      defaultPrice: 4,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    };

    await supplyRepository.createAsync(supply);
    await deleteSupplyPermanentlyAsync(supply);

    await expect(supplyRepository.getByIdAsync("supply_1")).resolves.toBeNull();
    await expect(listSuppliesAsync()).resolves.toEqual([]);
  });
});
