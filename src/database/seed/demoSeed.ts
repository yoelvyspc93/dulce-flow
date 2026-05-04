import type { DatabaseClient } from "@/database/client";
import { getDatabaseAsync } from "@/database/connection";
import type { ExpenseStatus, OrderStatus } from "@/shared/types";

const DEMO_PREFIX = "demo_";

type DemoProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
};

type DemoSupply = {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
  isActive: boolean;
};

type DemoOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  dueDate: string;
  note: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    product: DemoProduct;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    createdAt: string;
  }[];
  subtotal: number;
  total: number;
};

type DemoExpense = {
  id: string;
  supply: DemoSupply;
  quantity: number;
  unitPrice: number;
  total: number;
  status: ExpenseStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
};

const productRows: Array<[string, string, number, string, boolean]> = [
  ["tarta_guayaba", "Tarta de guayaba", 18, "Tarta artesanal con mermelada de guayaba y cobertura brillante.", true],
  ["cake_chocolate", "Cake de chocolate", 24, "Bizcocho humedo de cacao con crema de chocolate.", true],
  ["cupcake_vainilla", "Cupcake de vainilla", 3.5, "Cupcake suave con crema de mantequilla y lluvia de colores.", true],
  ["pastel_tres_leches", "Pastel tres leches", 26, "Pastel frio con mezcla de tres leches y merengue.", true],
  ["flan_caramelo", "Flan de caramelo", 12, "Flan cremoso con caramelo dorado.", true],
  ["brownie_nuez", "Brownie con nuez", 4.25, "Brownie denso con trozos de nuez y chocolate.", true],
  ["galleta_mantequilla", "Galleta de mantequilla", 1.5, "Galleta crujiente decorada con azucar fina.", true],
  ["cheesecake_fresa", "Cheesecake de fresa", 28, "Cheesecake horneado con salsa de fresa natural.", true],
  ["panetela_naranja", "Panetela de naranja", 14, "Panetela ligera con ralladura de naranja.", true],
  ["tartaleta_limon", "Tartaleta de limon", 4, "Base crujiente con crema de limon y merengue.", true],
  ["donut_glaseada", "Dona glaseada", 2.75, "Dona esponjosa con glaseado clasico.", true],
  ["profiterol_crema", "Profiterol relleno", 2.25, "Masa choux con crema pastelera.", true],
  ["milhojas_crema", "Milhojas de crema", 5, "Capas de hojaldre con crema pastelera.", true],
  ["merenguito", "Merenguito", 1.25, "Merengue seco pequeño para mesas dulces.", true],
  ["cake_red_velvet", "Cake red velvet", 30, "Cake rojo con crema de queso.", true],
  ["torta_boda", "Torta de boda sencilla", 85, "Torta decorada con crema blanca y flores de azucar.", true],
  ["brazo_gitano", "Brazo gitano de crema", 16, "Enrollado de panetela con crema y azucar glass.", true],
  ["alfajor_maicena", "Alfajor de maicena", 2, "Alfajor suave con dulce de leche y coco.", true],
  ["pay_manzana", "Pay de manzana", 20, "Pay horneado con manzana especiada.", true],
  ["cake_coco", "Cake de coco", 22, "Cake con crema de coco y coco rallado.", true],
  ["cupcake_chocolate", "Cupcake de chocolate", 3.75, "Cupcake de cacao con crema oscura.", true],
  ["galleta_jengibre", "Galleta de jengibre", 1.75, "Galleta especiada para paquetes festivos.", true],
  ["tiramisu_vaso", "Tiramisu en vaso", 6.5, "Postre frio con cafe, crema y cacao.", true],
  ["mousse_maracuya", "Mousse de maracuya", 5.5, "Mousse aireado con pulpa de maracuya.", true],
  ["pan_dulce", "Pan dulce relleno", 3, "Pan suave relleno con crema o guayaba.", true],
  ["cake_zanahoria", "Cake de zanahoria", 25, "Cake especiado con crema de queso.", true],
  ["macaron", "Macaron surtido", 2.5, "Macaron delicado en sabores variados.", false],
  ["bombon_coco", "Bombon de coco", 1.2, "Bombon cubierto de chocolate.", false],
  ["pudin_pan", "Pudin de pan", 10, "Postre tradicional con pasas y caramelo.", false],
  ["eclair_chocolate", "Eclair de chocolate", 4.5, "Masa choux alargada con crema y chocolate.", false],
];

const products: DemoProduct[] = productRows.map(([id, name, price, description, isActive]) => ({
  id: `${DEMO_PREFIX}product_${id}`,
  name,
  price,
  description,
  isActive,
}));

const supplyRows: Array<[string, string, string, number, boolean]> = [
  ["harina_trigo", "Harina de trigo", "kg", 1.15, true],
  ["azucar_blanca", "Azucar blanca", "kg", 1.05, true],
  ["azucar_glass", "Azucar glass", "kg", 1.75, true],
  ["mantequilla", "Mantequilla", "kg", 6.5, true],
  ["huevo", "Huevo", "docena", 3.8, true],
  ["leche_entera", "Leche entera", "litro", 1.35, true],
  ["leche_condensada", "Leche condensada", "unidad", 2.2, true],
  ["crema_leche", "Crema de leche", "litro", 4.5, true],
  ["queso_crema", "Queso crema", "kg", 7.2, true],
  ["cacao_polvo", "Cacao en polvo", "kg", 5.4, true],
  ["chocolate_cobertura", "Chocolate de cobertura", "kg", 8.9, true],
  ["vainilla", "Esencia de vainilla", "ml", 0.04, true],
  ["polvo_hornear", "Polvo de hornear", "kg", 3.2, true],
  ["levadura", "Levadura seca", "paquete", 1.1, true],
  ["sal", "Sal fina", "kg", 0.55, true],
  ["guayaba", "Pasta de guayaba", "kg", 3.4, true],
  ["fresa", "Fresa natural", "kg", 4.8, true],
  ["limon", "Limon", "unidad", 0.18, true],
  ["naranja", "Naranja", "unidad", 0.22, true],
  ["manzana", "Manzana", "kg", 2.9, true],
  ["coco_rallado", "Coco rallado", "kg", 3.7, true],
  ["nuez", "Nuez", "kg", 11.5, true],
  ["dulce_leche", "Dulce de leche", "kg", 5.6, true],
  ["cafe", "Cafe fuerte", "kg", 6.2, true],
  ["maracuya", "Pulpa de maracuya", "kg", 4.4, true],
  ["zanahoria", "Zanahoria", "kg", 1.1, true],
  ["canela", "Canela molida", "kg", 4.9, true],
  ["colorante_rojo", "Colorante rojo", "ml", 0.08, true],
  ["capsulas", "Capsulas para cupcakes", "paquete", 2.3, true],
  ["cajas", "Cajas para dulces", "caja", 9.5, true],
  ["servilletas", "Servilletas decoradas", "paquete", 1.6, true],
  ["manga", "Mangas pasteleras", "paquete", 4.2, false],
  ["boquillas", "Boquillas antiguas", "unidad", 1.9, false],
  ["gelatina", "Gelatina sin sabor", "paquete", 0.95, false],
  ["pasas", "Pasas", "kg", 3.1, false],
];

const supplies: DemoSupply[] = supplyRows.map(([id, name, unit, defaultPrice, isActive]) => ({
  id: `${DEMO_PREFIX}supply_${id}`,
  name,
  unit,
  defaultPrice,
  isActive,
}));

const customers = [
  ["Ana Maria Perez", "555-0101"],
  ["Carlos Fernandez", "555-0102"],
  ["Diana Suarez", "555-0103"],
  ["Miguel Torres", "555-0104"],
  ["Laura Benitez", "555-0105"],
  ["Patricia Gomez", "555-0106"],
  ["Jorge Ramirez", "555-0107"],
  ["Claudia Morales", "555-0108"],
  ["Sofia Herrera", "555-0109"],
  ["Rafael Castro", "555-0110"],
  ["Elena Valdes", "555-0111"],
  ["Roberto Medina", "555-0112"],
];

function roundMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

function buildDate(now: Date, index: number, hour = 10): string {
  const monthOffset = index % 8;
  const day = (index * 3) % 24 + 3;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthOffset, day, hour, index % 60, 0)).toISOString();
}

function offsetDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function buildOrders(now: Date): DemoOrder[] {
  const activeProducts = products.filter((product) => product.isActive);

  return Array.from({ length: 80 }, (_, index) => {
    const id = `${DEMO_PREFIX}order_${String(index + 1).padStart(3, "0")}`;
    const createdAt = buildDate(now, index, 9 + (index % 8));
    const status: OrderStatus = index % 10 === 0 ? "cancelled" : index % 4 === 0 ? "pending" : "delivered";
    const deliveredAt = status === "delivered" || (status === "cancelled" && index % 20 === 0) ? offsetDays(createdAt, 1) : undefined;
    const cancelledAt = status === "cancelled" ? offsetDays(createdAt, 2) : undefined;
    const itemCount = 1 + (index % 4);
    const [customerName, customerPhone] = customers[index % customers.length];
    const items = Array.from({ length: itemCount }, (_, itemIndex) => {
      const product = activeProducts[(index + itemIndex * 3) % activeProducts.length];
      const quantity = itemIndex === 0 ? 1 + (index % 3) : 1 + ((index + itemIndex) % 2);
      const unitPrice = roundMoney(product.price + (index % 5) * 0.25);
      return {
        id: `${DEMO_PREFIX}order_item_${String(index + 1).padStart(3, "0")}_${itemIndex + 1}`,
        product,
        quantity,
        unitPrice,
        subtotal: roundMoney(quantity * unitPrice),
        createdAt,
      };
    });
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));

    return {
      id,
      orderNumber: `DEMO-ORD-${String(index + 1).padStart(4, "0")}`,
      customerName,
      customerPhone,
      status,
      dueDate: offsetDays(createdAt, 3 + (index % 9)),
      note: status === "cancelled" ? "Pedido cancelado por cambio de fecha del cliente." : "Preparar con acabado limpio y empaque cuidado.",
      deliveredAt,
      cancelledAt,
      createdAt,
      updatedAt: cancelledAt ?? deliveredAt ?? createdAt,
      items,
      subtotal,
      total: subtotal,
    };
  });
}

function buildExpenses(now: Date): DemoExpense[] {
  const activeSupplies = supplies.filter((supply) => supply.isActive);

  return Array.from({ length: 90 }, (_, index) => {
    const supply = activeSupplies[(index * 2 + 3) % activeSupplies.length];
    const quantity = roundMoney(1 + (index % 7) * 0.75);
    const unitPrice = roundMoney(supply.defaultPrice * (1 + (index % 5) * 0.04));
    const total = roundMoney(quantity * unitPrice);
    const createdAt = buildDate(now, index + 13, 8 + (index % 9));
    const status: ExpenseStatus = index % 9 === 0 ? "voided" : "active";

    return {
      id: `${DEMO_PREFIX}expense_${String(index + 1).padStart(3, "0")}`,
      supply,
      quantity,
      unitPrice,
      total,
      status,
      note: status === "voided" ? "Compra anulada por error en el comprobante." : "Compra para produccion semanal de reposteria.",
      createdAt,
      updatedAt: status === "voided" ? offsetDays(createdAt, 1) : createdAt,
    };
  });
}

async function cleanupDemoDataAsync(client: DatabaseClient): Promise<void> {
  await client.runAsync("DELETE FROM movements;");
  await client.runAsync("DELETE FROM order_items;");
  await client.runAsync("DELETE FROM expenses;");
  await client.runAsync("DELETE FROM orders;");
  await client.runAsync("DELETE FROM products;");
  await client.runAsync("DELETE FROM supplies;");
}

async function insertProductsAsync(client: DatabaseClient, now: string): Promise<void> {
  for (const product of products) {
    await client.runAsync(
      `INSERT INTO products (
        id, name, price, description, image_uri, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [product.id, product.name, product.price, product.description, null, product.isActive ? 1 : 0, now, now]
    );
  }
}

async function insertSuppliesAsync(client: DatabaseClient, now: string): Promise<void> {
  for (const supply of supplies) {
    await client.runAsync(
      `INSERT INTO supplies (
        id, name, unit, default_price, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [supply.id, supply.name, supply.unit, supply.defaultPrice, supply.isActive ? 1 : 0, now, now]
    );
  }
}

async function insertOrdersAsync(client: DatabaseClient, orders: DemoOrder[]): Promise<void> {
  for (const order of orders) {
    await client.runAsync(
      `INSERT INTO orders (
        id, order_number, customer_name, customer_phone, subtotal, total, status,
        due_date, note, delivered_at, cancelled_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        order.id,
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.subtotal,
        order.total,
        order.status,
        order.dueDate,
        order.note,
        order.deliveredAt ?? null,
        order.cancelledAt ?? null,
        order.createdAt,
        order.updatedAt,
      ]
    );

    for (const item of order.items) {
      await client.runAsync(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [item.id, order.id, item.product.id, item.product.name, item.quantity, item.unitPrice, item.subtotal, item.createdAt]
      );
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      const movementDate = order.deliveredAt ?? order.cancelledAt ?? order.updatedAt;
      await client.runAsync(
        `INSERT INTO movements (
          id, type, direction, source_type, source_id, amount, description,
          status, movement_date, created_at, updated_at, reversed_movement_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          `${DEMO_PREFIX}movement_order_${order.id.replace(DEMO_PREFIX, "")}`,
          "income",
          "in",
          "order",
          order.id,
          order.total,
          `Ingreso por pedido ${order.orderNumber}`,
          order.status === "cancelled" ? "voided" : "active",
          movementDate,
          movementDate,
          order.updatedAt,
          null,
        ]
      );
    }
  }
}

async function insertExpensesAsync(client: DatabaseClient, expenses: DemoExpense[]): Promise<void> {
  for (const expense of expenses) {
    await client.runAsync(
      `INSERT INTO expenses (
        id, supply_id, supply_name, quantity, unit, unit_price, total, status, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        expense.id,
        expense.supply.id,
        expense.supply.name,
        expense.quantity,
        expense.supply.unit,
        expense.unitPrice,
        expense.total,
        expense.status,
        expense.note,
        expense.createdAt,
        expense.updatedAt,
      ]
    );

    await client.runAsync(
      `INSERT INTO movements (
        id, type, direction, source_type, source_id, amount, description,
        status, movement_date, created_at, updated_at, reversed_movement_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        `${DEMO_PREFIX}movement_${expense.id.replace(DEMO_PREFIX, "")}`,
        "expense",
        "out",
        "expense",
        expense.id,
        expense.total,
        `Gasto en ${expense.supply.name}`,
        expense.status === "voided" ? "voided" : "active",
        expense.createdAt,
        expense.createdAt,
        expense.updatedAt,
        null,
      ]
    );
  }
}

export async function seedDemoDatabaseAsync(client?: DatabaseClient, now = new Date()): Promise<void> {
  const database = client ?? (await getDatabaseAsync());
  const createdAt = now.toISOString();
  const orders = buildOrders(now);
  const expenses = buildExpenses(now);

  await database.withTransactionAsync(async (transaction) => {
    await cleanupDemoDataAsync(transaction);
    await insertProductsAsync(transaction, createdAt);
    await insertSuppliesAsync(transaction, createdAt);
    await insertOrdersAsync(transaction, orders);
    await insertExpensesAsync(transaction, expenses);
  });
}
