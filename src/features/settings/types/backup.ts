export type BackupProductRow = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_uri: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type BackupSupplyRow = {
  id: string;
  name: string;
  unit: string;
  default_price: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type BackupOrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  total: number;
  status: string;
  due_date: string;
  note: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BackupOrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
};

export type BackupExpenseRow = {
  id: string;
  supply_id: string;
  supply_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type BackupMovementRow = {
  id: string;
  type: string;
  direction: string;
  source_type: string;
  source_id: string | null;
  amount: number;
  description: string;
  status: string;
  movement_date: string;
  created_at: string;
  updated_at: string;
  reversed_movement_id: string | null;
};

export type BackupSettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

export type DulceFlowBackupData = {
  products: BackupProductRow[];
  supplies: BackupSupplyRow[];
  orders: BackupOrderRow[];
  order_items: BackupOrderItemRow[];
  expenses: BackupExpenseRow[];
  movements: BackupMovementRow[];
  settings: BackupSettingRow[];
};

export type DulceFlowBackup = {
  app: "DulceFlow";
  backup_version: 1;
  exported_at: string;
  database_version: number;
  data: DulceFlowBackupData;
};
