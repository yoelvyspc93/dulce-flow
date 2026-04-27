import type { DatabaseClient } from "@/database/client";
import type { Movement, MovementDirection } from "@/shared/types";

type MovementRow = {
  id: string;
  type: Movement["type"];
  direction: MovementDirection;
  source_type: Movement["sourceType"];
  source_id: string | null;
  amount: number;
  description: string;
  status: Movement["status"];
  movement_date: string;
  created_at: string;
  updated_at: string;
  reversed_movement_id: string | null;
};

export type DashboardSummary = {
  totalIn: number;
  totalOut: number;
  netProfit: number;
};

function mapMovementRow(row: MovementRow): Movement {
  return {
    id: row.id,
    type: row.type,
    direction: row.direction,
    sourceType: row.source_type,
    sourceId: row.source_id ?? undefined,
    amount: row.amount,
    description: row.description,
    status: row.status,
    movementDate: row.movement_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reversedMovementId: row.reversed_movement_id ?? undefined,
  };
}

export class MovementRepository {
  constructor(private readonly client: DatabaseClient) {}

  async createAsync(movement: Movement): Promise<void> {
    await this.client.runAsync(
      `INSERT INTO movements (
        id, type, direction, source_type, source_id, amount, description,
        status, movement_date, created_at, updated_at, reversed_movement_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        movement.id,
        movement.type,
        movement.direction,
        movement.sourceType,
        movement.sourceId ?? null,
        movement.amount,
        movement.description,
        movement.status,
        movement.movementDate,
        movement.createdAt,
        movement.updatedAt,
        movement.reversedMovementId ?? null,
      ]
    );
  }

  async getLatestAsync(limit = 10): Promise<Movement[]> {
    const rows = await this.client.getAllAsync<MovementRow>(
      "SELECT * FROM movements WHERE status = 'active' ORDER BY movement_date DESC, created_at DESC LIMIT ?;",
      [limit]
    );
    return rows.map(mapMovementRow);
  }

  async getSummaryByDateRangeAsync(startDate: string, endDate: string): Promise<DashboardSummary> {
    const rows = await this.client.getAllAsync<{ direction: MovementDirection; total: number }>(
      `SELECT direction, COALESCE(SUM(amount), 0) AS total
       FROM movements
       WHERE status = 'active'
         AND movement_date BETWEEN ? AND ?
       GROUP BY direction;`,
      [startDate, endDate]
    );

    const totalIn = rows.find((row) => row.direction === "in")?.total ?? 0;
    const totalOut = rows.find((row) => row.direction === "out")?.total ?? 0;

    return {
      totalIn,
      totalOut,
      netProfit: totalIn - totalOut,
    };
  }
}
