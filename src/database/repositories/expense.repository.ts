import type { DatabaseClient } from "@/database/client";
import type { Expense, ExpenseStatus } from "@/shared/types";

type ExpenseRow = {
  id: string;
  supply_id: string | null;
  supply_name: string;
  category: Expense["category"];
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total: number;
  status: ExpenseStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    supplyId: row.supply_id ?? undefined,
    supplyName: row.supply_name,
    category: row.category,
    quantity: row.quantity ?? undefined,
    unit: row.unit ?? undefined,
    unitPrice: row.unit_price ?? undefined,
    total: row.total,
    status: row.status,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ExpenseRepository {
  constructor(private readonly client: DatabaseClient) {}

  async getAllAsync(): Promise<Expense[]> {
    const rows = await this.client.getAllAsync<ExpenseRow>("SELECT * FROM expenses ORDER BY created_at DESC;");
    return rows.map(mapExpenseRow);
  }

  async getFilteredAsync(filters?: {
    category?: Expense["category"] | "all";
    startDate?: string | null;
  }): Promise<Expense[]> {
    const clauses: string[] = [];
    const params: string[] = [];

    if (filters?.category && filters.category !== "all") {
      clauses.push("category = ?");
      params.push(filters.category);
    }

    if (filters?.startDate) {
      clauses.push("created_at >= ?");
      params.push(filters.startDate);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await this.client.getAllAsync<ExpenseRow>(
      `SELECT * FROM expenses ${where} ORDER BY created_at DESC;`,
      params
    );
    return rows.map(mapExpenseRow);
  }

  async getByIdAsync(id: string): Promise<Expense | null> {
    const row = await this.client.getFirstAsync<ExpenseRow>("SELECT * FROM expenses WHERE id = ? LIMIT 1;", [id]);
    return row ? mapExpenseRow(row) : null;
  }

  async createAsync(expense: Expense): Promise<void> {
    await this.client.runAsync(
      `INSERT INTO expenses (
        id, supply_id, supply_name, category, quantity, unit, unit_price, total, status, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        expense.id,
        expense.supplyId ?? null,
        expense.supplyName,
        expense.category,
        expense.quantity ?? null,
        expense.unit ?? null,
        expense.unitPrice ?? null,
        expense.total,
        expense.status,
        expense.note ?? null,
        expense.createdAt,
        expense.updatedAt,
      ]
    );
  }

  async updateAsync(expense: Expense): Promise<void> {
    await this.client.runAsync(
      `UPDATE expenses
       SET supply_id = ?, supply_name = ?, category = ?, quantity = ?, unit = ?, unit_price = ?, total = ?,
           status = ?, note = ?, updated_at = ?
       WHERE id = ?;`,
      [
        expense.supplyId ?? null,
        expense.supplyName,
        expense.category,
        expense.quantity ?? null,
        expense.unit ?? null,
        expense.unitPrice ?? null,
        expense.total,
        expense.status,
        expense.note ?? null,
        expense.updatedAt,
        expense.id,
      ]
    );
  }

  async updateStatusAsync(id: string, status: ExpenseStatus, updatedAt: string): Promise<void> {
    await this.client.runAsync("UPDATE expenses SET status = ?, updated_at = ? WHERE id = ?;", [status, updatedAt, id]);
  }

  async deleteAsync(id: string): Promise<void> {
    await this.client.runAsync("DELETE FROM expenses WHERE id = ?;", [id]);
  }
}
