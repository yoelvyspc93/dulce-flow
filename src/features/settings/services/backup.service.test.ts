import { BackupUserError, parseBackupJson, validateBackup } from "./backup.service";
import type { DulceFlowBackup } from "../types/backup";

const baseBackup: DulceFlowBackup = {
  app: "DulceFlow",
  backup_version: 1,
  exported_at: "2026-05-04T12:00:00.000Z",
  database_version: 6,
  data: {
    products: [
      {
        id: "product_1",
        name: "Cake",
        price: 10,
        description: null,
        image_uri: null,
        is_active: 1,
        created_at: "2026-05-04T10:00:00.000Z",
        updated_at: "2026-05-04T10:00:00.000Z",
      },
    ],
    supplies: [
      {
        id: "supply_1",
        name: "Sugar",
        unit: "kg",
        default_price: 5,
        is_active: 1,
        created_at: "2026-05-04T10:00:00.000Z",
        updated_at: "2026-05-04T10:00:00.000Z",
      },
    ],
    orders: [
      {
        id: "order_1",
        order_number: "ORD-1",
        customer_name: null,
        customer_phone: null,
        subtotal: 20,
        total: 20,
        status: "pending",
        due_date: "2026-05-05T12:00:00.000Z",
        note: null,
        delivered_at: null,
        cancelled_at: null,
        created_at: "2026-05-04T10:00:00.000Z",
        updated_at: "2026-05-04T10:00:00.000Z",
      },
    ],
    order_items: [
      {
        id: "item_1",
        order_id: "order_1",
        product_id: "product_1",
        product_name: "Cake",
        quantity: 2,
        unit_price: 10,
        subtotal: 20,
        created_at: "2026-05-04T10:00:00.000Z",
      },
    ],
    expenses: [
      {
        id: "expense_1",
        supply_id: "supply_1",
        supply_name: "Sugar",
        quantity: 1,
        unit: "kg",
        unit_price: 5,
        total: 5,
        status: "active",
        note: null,
        created_at: "2026-05-04T10:00:00.000Z",
        updated_at: "2026-05-04T10:00:00.000Z",
      },
    ],
    movements: [
      {
        id: "movement_1",
        type: "income",
        direction: "in",
        source_type: "order",
        source_id: "order_1",
        amount: 20,
        description: "Ingreso por pedido ORD-1",
        status: "active",
        movement_date: "2026-05-04T10:00:00.000Z",
        created_at: "2026-05-04T10:00:00.000Z",
        updated_at: "2026-05-04T10:00:00.000Z",
        reversed_movement_id: null,
      },
    ],
    settings: [
      {
        key: "business_name",
        value: "Dulces Maria",
        updated_at: "2026-05-04T10:00:00.000Z",
      },
    ],
  },
};

function cloneBackup(overrides?: Partial<DulceFlowBackup>): DulceFlowBackup {
  return {
    ...structuredClone(baseBackup),
    ...overrides,
  };
}

describe("backup validation", () => {
  it("accepts a valid DulceFlow backup JSON", () => {
    expect(parseBackupJson(JSON.stringify(baseBackup))).toEqual(baseBackup);
  });

  it("rejects empty files and invalid JSON", () => {
    expect(() => parseBackupJson("   ")).toThrow(BackupUserError);
    expect(() => parseBackupJson("{not-json")).toThrow(BackupUserError);
  });

  it("rejects backups from another app and incompatible versions", () => {
    expect(() => validateBackup({ ...baseBackup, app: "OtherApp" })).toThrow("no pertenece");
    expect(() => validateBackup({ ...baseBackup, backup_version: 99 })).toThrow("no es compatible");
    expect(() => validateBackup({ ...baseBackup, database_version: "6" })).toThrow("base de datos");
  });

  it("rejects missing data collections and non-array collections", () => {
    expect(() => validateBackup({ ...baseBackup, data: undefined })).toThrow("no incluye datos");
    expect(() =>
      validateBackup({
        ...baseBackup,
        data: {
          ...baseBackup.data,
          products: {},
        },
      })
    ).toThrow("colecciones");
  });

  it("rejects rows with unsupported shapes", () => {
    const backup = cloneBackup({
      data: {
        ...baseBackup.data,
        products: [{ ...baseBackup.data.products[0], price: "10" as unknown as number }],
      },
    });

    expect(() => validateBackup(backup)).toThrow("formato no compatible");
  });

  it("rejects broken relationships before restore", () => {
    const backup = cloneBackup({
      data: {
        ...baseBackup.data,
        order_items: [{ ...baseBackup.data.order_items[0], order_id: "missing_order" }],
      },
    });

    expect(() => validateBackup(backup)).toThrow("sin pedido asociado");
  });
});
