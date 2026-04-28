export const DATABASE_NAME = "dulceflow.db";
export const DATABASE_VERSION = 3;

export const CREATE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL CHECK(price > 0),
    description TEXT,
    image_uri TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_SUPPLIES_TABLE = `
  CREATE TABLE IF NOT EXISTS supplies (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    category TEXT,
    default_price REAL CHECK(default_price IS NULL OR default_price > 0),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_PRODUCT_RECIPE_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS product_recipe_items (
    id TEXT PRIMARY KEY NOT NULL,
    product_id TEXT NOT NULL,
    supply_id TEXT,
    supply_name TEXT NOT NULL,
    quantity REAL NOT NULL CHECK(quantity > 0),
    unit TEXT NOT NULL,
    unit_price REAL NOT NULL CHECK(unit_price > 0),
    subtotal REAL NOT NULL CHECK(subtotal > 0),
    created_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY(supply_id) REFERENCES supplies(id) ON DELETE SET NULL
  );
`;

export const CREATE_ORDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('pending', 'delivered', 'cancelled')),
    payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'paid')),
    note TEXT,
    delivered_at TEXT,
    cancelled_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_ORDER_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY NOT NULL,
    order_id TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    quantity REAL NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL CHECK(unit_price >= 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    created_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`;

export const CREATE_EXPENSES_TABLE = `
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    supply_id TEXT,
    supply_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('ingredients', 'packaging', 'decoration', 'transport', 'services', 'other')),
    quantity REAL,
    unit TEXT,
    unit_price REAL CHECK(unit_price IS NULL OR unit_price > 0),
    total REAL NOT NULL CHECK(total > 0),
    status TEXT NOT NULL CHECK(status IN ('active', 'voided')) DEFAULT 'active',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(supply_id) REFERENCES supplies(id) ON DELETE SET NULL
  );
`;

export const CREATE_MOVEMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'adjustment', 'reversal')),
    direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
    source_type TEXT NOT NULL CHECK(source_type IN ('order', 'expense', 'manual')),
    source_id TEXT,
    amount REAL NOT NULL CHECK(amount > 0),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'voided', 'reversed')) DEFAULT 'active',
    movement_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    reversed_movement_id TEXT,
    FOREIGN KEY(reversed_movement_id) REFERENCES movements(id)
  );
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);",
  "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);",
  "CREATE INDEX IF NOT EXISTS idx_recipe_product ON product_recipe_items(product_id);",
  "CREATE INDEX IF NOT EXISTS idx_recipe_supply ON product_recipe_items(supply_id);",
  "CREATE INDEX IF NOT EXISTS idx_movements_type ON movements(type);",
  "CREATE INDEX IF NOT EXISTS idx_movements_status ON movements(status);",
  "CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(movement_date);",
  "CREATE INDEX IF NOT EXISTS idx_movements_source ON movements(source_type, source_id);",
];

export const SCHEMA_STATEMENTS = [
  "PRAGMA foreign_keys = ON;",
  CREATE_PRODUCTS_TABLE,
  CREATE_SUPPLIES_TABLE,
  CREATE_PRODUCT_RECIPE_ITEMS_TABLE,
  CREATE_ORDERS_TABLE,
  CREATE_ORDER_ITEMS_TABLE,
  CREATE_EXPENSES_TABLE,
  CREATE_MOVEMENTS_TABLE,
  CREATE_SETTINGS_TABLE,
  ...CREATE_INDEXES,
];
