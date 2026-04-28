# DulceFlow — Decisiones cerradas del MVP

## 1. Objetivo cerrado

**DulceFlow** será una aplicación móvil simple para administrar una dulcería, repostería o negocio casero de postres.

La app debe permitir controlar:

- Productos vendidos.
- Órdenes recibidas.
- Gastos del negocio.
- Ingresos reales.
- Ganancias estimadas.
- Historial auditable de movimientos.

El objetivo principal del MVP es que una persona pueda abrir la app y entender rápidamente cuánto vendió, cuánto gastó y cuánto ganó.

---

## 2. Usuario principal

La app será usada por una sola persona: el dueño o administrador del negocio.

### Decisión cerrada

No habrá:

- Login.
- Roles.
- Permisos.
- Panel administrativo externo.
- Usuarios múltiples.

La primera versión será **offline-first** y funcionará directamente en el teléfono.

---

## 3. Stack técnico

### Decisión cerrada

La app se desarrollará con:

```txt
React Native + Expo + TypeScript + SQLite + Zustand
```

### Uso de cada tecnología

| Tecnología | Uso |
|---|---|
| React Native | Desarrollo de la aplicación móvil |
| Expo | Configuración rápida, build y herramientas móviles |
| TypeScript | Tipado seguro de entidades y lógica de negocio |
| SQLite | Base de datos local persistente |
| Zustand | Estado global ligero para UI, filtros y datos temporales |

### Razón

SQLite permite guardar productos, insumos, órdenes, gastos y movimientos de forma local, estructurada y consultable. Zustand se usará solo para estado de interfaz y sincronización temporal entre pantallas.

---

## 4. Navegación principal

### Decisión cerrada

La app tendrá navegación inferior con 4 secciones principales:

```txt
Inicio | Órdenes | Gastos | Ajustes
```

### Pantallas principales

| Sección | Pantallas |
|---|---|
| Inicio | Dashboard, últimos movimientos, accesos rápidos |
| Órdenes | Lista de órdenes, crear orden, detalle de orden, editar orden |
| Gastos | Lista de gastos, crear gasto, detalle de gasto, editar gasto |
| Ajustes | Productos, insumos, datos del negocio |

---

## 5. Alcance cerrado del MVP

## 5.1 Incluido en el MVP

### Inicio

- Ver ingresos.
- Ver gastos.
- Ver ganancia estimada.
- Ver últimos movimientos.
- Acceso rápido para crear orden.
- Acceso rápido para registrar gasto.
- Filtros por período.

### Órdenes

- Crear orden.
- Editar orden mientras esté pendiente.
- Cancelar orden.
- Marcar orden como entregada.
- Seleccionar productos del catálogo.
- Definir cantidad por producto.
- Calcular subtotal y total automáticamente.
- Listar órdenes.
- Ver detalle de una orden.
- Filtrar por estado.
- Buscar por cliente.

### Gastos

- Registrar gasto.
- Editar gasto.
- Eliminar gasto si fue creado por error.
- Seleccionar insumo del catálogo.
- Registrar gastos sin insumo cuando sea necesario.
- Listar gastos.
- Ver detalle de un gasto.
- Filtrar por período.
- Filtrar por categoría.

### Ajustes

- Crear productos.
- Editar productos.
- Activar/desactivar productos.
- Crear insumos.
- Editar insumos.
- Activar/desactivar insumos.
- Configurar nombre del negocio.
- Configurar moneda principal.

### Auditoría

- Registrar todos los movimientos financieros en una tabla central `movements`.
- Mantener relación entre cada movimiento y su entidad origen.
- Permitir consultas financieras desde `movements`.

---

## 5.2 No incluido en el MVP

Estas funciones quedan para versiones futuras:

- Login.
- Nube.
- Sincronización entre dispositivos.
- Inventario automático.
- Clientes frecuentes.
- Reportes avanzados con gráficos complejos.
- Exportar PDF.
- Exportar Excel.
- Recordatorios automáticos.
- Notificaciones push.
- Control de empleados.
- Permisos por usuario.

---

## 6. Regla financiera principal

### Decisión cerrada

Una orden solo cuenta como ingreso cuando su estado sea:

```txt
Entregado
```

Las órdenes pendientes no cuentan como ingreso real.

Las órdenes canceladas no cuentan como ingreso.

### Fórmula principal

```txt
Ganancia estimada = Ingresos entregados - Gastos registrados
```

### Reglas

| Entidad | Cuándo afecta finanzas |
|---|---|
| Orden pendiente | No suma ingreso |
| Orden entregada | Suma ingreso |
| Orden cancelada | No suma ingreso |
| Gasto registrado | Suma gasto |
| Gasto eliminado | Revierte el gasto |

---

## 7. Estados de órdenes

### Decisión cerrada

Una orden tendrá 3 estados:

```ts
type OrderStatus = 'pending' | 'delivered' | 'cancelled';
```

| Estado | Significado | Afecta ingresos |
|---|---|---|
| pending | La orden fue creada pero no entregada | No |
| delivered | La orden fue entregada y cuenta como venta | Sí |
| cancelled | La orden fue cancelada | No |

---

## 8. Estado de pago

### Decisión cerrada

La orden tendrá un estado de pago independiente:

```ts
type PaymentStatus = 'pending' | 'paid';
```

| Estado | Significado |
|---|---|
| pending | El cliente todavía no ha pagado |
| paid | El cliente ya pagó |

### Regla del MVP

Para mantener la app simple, el dashboard principal contará como ingreso las órdenes **entregadas**.

El estado de pago quedará guardado para mejorar reportes en el futuro, pero no será la regla principal del dashboard inicial.

---

## 9. Categorías de gastos

### Decisión cerrada

Los gastos tendrán categorías simples para facilitar reportes futuros.

```ts
type ExpenseCategory =
  | 'ingredients'
  | 'packaging'
  | 'decoration'
  | 'transport'
  | 'services'
  | 'other';
```

| Categoría | Uso |
|---|---|
| ingredients | Harina, azúcar, leche, huevos, mantequilla |
| packaging | Envases, cajas, bolsas |
| decoration | Toppers, colores, detalles decorativos |
| transport | Entregas, combustible, transporte |
| services | Electricidad, gas, internet u otros servicios |
| other | Cualquier gasto que no encaje en otra categoría |

---

## 10. Filtros del MVP

### Decisión cerrada

La app tendrá filtros por período:

```txt
Hoy | Esta semana | Este mes | Todo
```

### Uso por pantalla

| Pantalla | Filtros |
|---|---|
| Inicio | Hoy, esta semana, este mes, todo |
| Órdenes | Estado, cliente, período |
| Gastos | Categoría, período |
| Movimientos | Tipo, período |

---

## 11. Validaciones obligatorias

### Productos

- El nombre es obligatorio.
- El precio debe ser mayor que 0.
- Un producto puede desactivarse.
- Un producto usado en órdenes no debe eliminarse físicamente.

### Insumos

- El nombre es obligatorio.
- La unidad de medida es obligatoria.
- Un insumo puede desactivarse.
- Un insumo usado en gastos no debe eliminarse físicamente.

### Órdenes

- Una orden debe tener al menos un producto.
- La cantidad de cada producto debe ser mayor que 0.
- El total debe calcularse automáticamente.
- Una orden entregada no debe editarse libremente.
- Una orden cancelada no debe sumar ingresos.

### Gastos

- El total es obligatorio.
- El total debe ser mayor que 0.
- La fecha es obligatoria.
- El gasto puede tener insumo relacionado o nombre manual.

### Movimientos

- Todo movimiento debe tener tipo.
- Todo movimiento debe tener monto.
- Todo movimiento debe tener fecha.
- Todo movimiento debe tener entidad origen cuando venga de una orden o gasto.
- Los movimientos no deben eliminarse físicamente; deben anularse o revertirse.

---

## 12. Flujo de primera instalación

### Decisión cerrada

La primera vez que se abra la app, se mostrará una pantalla de configuración básica.

### Flujo

```txt
1. Escribir nombre del negocio.
2. Seleccionar moneda principal.
3. Crear el primer producto o saltar este paso.
4. Ir al Inicio.
```

### Estado inicial permitido

Si el usuario no crea productos al inicio, la pantalla de Inicio mostrará estados vacíos y accesos claros para configurar el negocio.

---

## 13. Estados vacíos obligatorios

### Sin órdenes

```txt
Todavía no tienes órdenes.
Crea tu primera orden para empezar a registrar tus ventas.
```

### Sin gastos

```txt
Todavía no tienes gastos registrados.
Agrega tu primer gasto para calcular mejor tus ganancias.
```

### Sin productos

```txt
No tienes productos activos.
Crea productos desde Ajustes para poder registrar órdenes.
```

### Sin insumos

```txt
No tienes insumos activos.
Crea insumos desde Ajustes para registrar tus gastos más rápido.
```

### Sin movimientos

```txt
Todavía no tienes movimientos.
Cuando registres ventas o gastos, aparecerán aquí.
```

---

# 14. Modelo de datos cerrado

## 14.1 Product

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

## 14.2 Supply

```ts
type Supply = {
  id: string;
  name: string;
  unit: string;
  category?: ExpenseCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

## 14.3 Order

```ts
type Order = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 14.4 OrderItem

```ts
type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
};
```

## 14.5 Expense

```ts
type Expense = {
  id: string;
  supplyId?: string;
  supplyName: string;
  category: ExpenseCategory;
  quantity?: number;
  unit?: string;
  total: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 14.6 Movement

```ts
type MovementType = 'income' | 'expense' | 'adjustment' | 'reversal';

type MovementSourceType = 'order' | 'expense' | 'manual';

type MovementStatus = 'active' | 'voided' | 'reversed';

type Movement = {
  id: string;
  type: MovementType;
  sourceType: MovementSourceType;
  sourceId?: string;
  amount: number;
  description: string;
  status: MovementStatus;
  movementDate: string;
  createdAt: string;
  updatedAt: string;
  reversedMovementId?: string;
};
```

---

# 15. Tabla central de movimientos

## 15.1 Objetivo

La tabla `movements` será el centro financiero de la app.

Desde esta tabla se deben consultar:

- Ingresos.
- Gastos.
- Ganancias.
- Últimos movimientos.
- Historial financiero.
- Auditoría de cambios importantes.

## 15.2 Razón

Aunque las órdenes y gastos tienen sus propias tablas, no conviene calcular todo directamente desde ellas cada vez.

La tabla `movements` permite tener un historial financiero más limpio, consultable y auditable.

## 15.3 Qué registra

| Acción | Movimiento generado |
|---|---|
| Marcar orden como entregada | income |
| Registrar gasto | expense |
| Eliminar/anular gasto | reversal |
| Cancelar orden entregada | reversal |
| Ajuste manual futuro | adjustment |

## 15.4 Reglas de auditoría

### Regla 1

Los movimientos no se eliminan físicamente.

### Regla 2

Si un movimiento fue un error, se marca como:

```txt
voided
```

O se crea un movimiento contrario de tipo:

```txt
reversal
```

### Regla 3

Cada movimiento debe guardar de dónde vino:

```txt
sourceType + sourceId
```

Ejemplo:

```txt
sourceType: order
sourceId: order_001
```

### Regla 4

Las consultas financieras solo deben considerar movimientos con estado:

```txt
active
```

---

# 16. Esquema de base de datos SQLite

## 16.1 Tabla products

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK(price > 0),
  description TEXT,
  image TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 16.2 Tabla supplies

```sql
CREATE TABLE supplies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 16.3 Tabla orders

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'paid')),
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 16.4 Tabla order_items

```sql
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL CHECK(unit_price >= 0),
  subtotal REAL NOT NULL CHECK(subtotal >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);
```

## 16.5 Tabla expenses

```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  supply_id TEXT,
  supply_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('ingredients', 'packaging', 'decoration', 'transport', 'services', 'other')),
  quantity REAL,
  unit TEXT,
  total REAL NOT NULL CHECK(total > 0),
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(supply_id) REFERENCES supplies(id)
);
```

## 16.6 Tabla movements

```sql
CREATE TABLE movements (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'adjustment', 'reversal')),
  source_type TEXT NOT NULL CHECK(source_type IN ('order', 'expense', 'manual')),
  source_id TEXT,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'voided', 'reversed')) DEFAULT 'active',
  movement_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reversed_movement_id TEXT,
  FOREIGN KEY(reversed_movement_id) REFERENCES movements(id)
);
```

## 16.7 Tabla business_settings

```sql
CREATE TABLE business_settings (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

# 17. Índices recomendados

```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_movements_type ON movements(type);
CREATE INDEX idx_movements_status ON movements(status);
CREATE INDEX idx_movements_date ON movements(movement_date);
CREATE INDEX idx_movements_source ON movements(source_type, source_id);
```

---

# 18. Consultas principales desde movements

## 18.1 Ingresos por período

```sql
SELECT COALESCE(SUM(amount), 0) AS total_income
FROM movements
WHERE type = 'income'
  AND status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

## 18.2 Gastos por período

```sql
SELECT COALESCE(SUM(amount), 0) AS total_expense
FROM movements
WHERE type = 'expense'
  AND status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

## 18.3 Ganancia por período

```sql
SELECT
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS profit
FROM movements
WHERE status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

## 18.4 Últimos movimientos

```sql
SELECT *
FROM movements
WHERE status = 'active'
ORDER BY movement_date DESC, created_at DESC
LIMIT 10;
```

## 18.5 Movimientos por origen

```sql
SELECT *
FROM movements
WHERE source_type = ?
  AND source_id = ?
ORDER BY created_at DESC;
```

---

# 19. Reglas para crear movimientos

## 19.1 Cuando una orden pasa a entregada

Se crea un movimiento:

```ts
const movement = {
  type: 'income',
  sourceType: 'order',
  sourceId: order.id,
  amount: order.total,
  description: `Ingreso por orden ${order.orderNumber}`,
  status: 'active',
  movementDate: new Date().toISOString(),
};
```

## 19.2 Cuando se registra un gasto

Se crea un movimiento:

```ts
const movement = {
  type: 'expense',
  sourceType: 'expense',
  sourceId: expense.id,
  amount: expense.total,
  description: `Gasto en ${expense.supplyName}`,
  status: 'active',
  movementDate: expense.createdAt,
};
```

## 19.3 Cuando se cancela una orden ya entregada

No se borra el movimiento original.

Se crea un movimiento de reversa:

```ts
const movement = {
  type: 'reversal',
  sourceType: 'order',
  sourceId: order.id,
  amount: -order.total,
  description: `Reverso por cancelación de orden ${order.orderNumber}`,
  status: 'active',
  movementDate: new Date().toISOString(),
  reversedMovementId: originalIncomeMovement.id,
};
```

Además, el movimiento original puede marcarse como:

```txt
reversed
```

## 19.4 Cuando se elimina/anula un gasto

No se borra el movimiento original.

Se crea un movimiento de reversa:

```ts
const movement = {
  type: 'reversal',
  sourceType: 'expense',
  sourceId: expense.id,
  amount: expense.total,
  description: `Reverso por anulación de gasto ${expense.supplyName}`,
  status: 'active',
  movementDate: new Date().toISOString(),
  reversedMovementId: originalExpenseMovement.id,
};
```

El movimiento original puede marcarse como:

```txt
reversed
```

---

# 20. Decisión importante sobre reversos

## Decisión cerrada

Para que las consultas sean simples y auditables:

- Los ingresos se guardan con monto positivo.
- Los gastos se guardan con monto positivo.
- Los reversos de ingresos se guardan con monto negativo.
- Los reversos de gastos se guardan con monto positivo, pero se consultan como ajuste según `source_type` y `reversed_movement_id`.

## Recomendación para simplificar todavía más

Usar una columna extra llamada `direction`.

```ts
type MovementDirection = 'in' | 'out';
```

Con esta mejora, la tabla queda más clara:

| Movimiento | type | direction | amount |
|---|---|---|---|
| Venta | income | in | 50 |
| Gasto | expense | out | 20 |
| Reverso de venta | reversal | out | 50 |
| Reverso de gasto | reversal | in | 20 |

### Decisión final recomendada

Usar `direction` desde el inicio.

---

# 21. Tabla movements mejorada con direction

## Decisión cerrada

La tabla final de movimientos debe incluir `direction`.

```sql
CREATE TABLE movements (
  id TEXT PRIMARY KEY,
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
```

### Ventaja

Con `direction`, todos los montos son positivos y el significado financiero depende de si el dinero entra o sale.

Esto hace la app más limpia, más fácil de auditar y menos propensa a errores.

---

# 22. Consultas finales usando direction

## 22.1 Ingresos reales

```sql
SELECT COALESCE(SUM(amount), 0) AS total_income
FROM movements
WHERE direction = 'in'
  AND status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

## 22.2 Salidas reales

```sql
SELECT COALESCE(SUM(amount), 0) AS total_outcome
FROM movements
WHERE direction = 'out'
  AND status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

## 22.3 Ganancia neta

```sql
SELECT
  COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END), 0) AS net_profit
FROM movements
WHERE status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

## 22.4 Últimos movimientos

```sql
SELECT *
FROM movements
WHERE status = 'active'
ORDER BY movement_date DESC, created_at DESC
LIMIT 10;
```

---

# 23. Flujo financiero final

## Crear orden pendiente

```txt
Se crea la orden.
No se crea movimiento financiero.
```

## Marcar orden como entregada

```txt
Se crea movement:
type: income
direction: in
sourceType: order
amount: total de la orden
```

## Registrar gasto

```txt
Se crea expense.
Se crea movement:
type: expense
direction: out
sourceType: expense
amount: total del gasto
```

## Cancelar orden pendiente

```txt
Se cambia la orden a cancelled.
No se crea movimiento.
```

## Cancelar orden entregada

```txt
Se cambia la orden a cancelled.
Se crea movement:
type: reversal
direction: out
sourceType: order
amount: total de la orden
reversedMovementId: movimiento original
```

## Anular gasto

```txt
Se marca el gasto como anulado o eliminado lógico.
Se crea movement:
type: reversal
direction: in
sourceType: expense
amount: total del gasto
reversedMovementId: movimiento original
```

---

# 24. Ajuste recomendado en expenses

Para soportar auditoría, la tabla `expenses` debe tener estado.

## Decisión cerrada

Agregar `status` a gastos.

```ts
type ExpenseStatus = 'active' | 'voided';
```

## Tabla actualizada

```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  supply_id TEXT,
  supply_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('ingredients', 'packaging', 'decoration', 'transport', 'services', 'other')),
  quantity REAL,
  unit TEXT,
  total REAL NOT NULL CHECK(total > 0),
  status TEXT NOT NULL CHECK(status IN ('active', 'voided')) DEFAULT 'active',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(supply_id) REFERENCES supplies(id)
);
```

---

# 25. Orden recomendado de desarrollo

```txt
1. Crear proyecto Expo con TypeScript.
2. Configurar estructura base de carpetas.
3. Crear tema visual: colores, tipografía, spacing y radius.
4. Configurar navegación inferior.
5. Configurar SQLite.
6. Crear migraciones iniciales.
7. Crear capa de repositorios para SQLite.
8. Crear pantalla de primera configuración.
9. Crear CRUD de productos.
10. Crear CRUD de insumos.
11. Crear registro de gastos.
12. Crear tabla de movimientos.
13. Crear registro automático de movimientos al guardar gastos.
14. Crear flujo de órdenes.
15. Crear movimiento automático cuando una orden sea entregada.
16. Crear dashboard desde movements.
17. Crear filtros por período.
18. Crear últimos movimientos.
19. Crear estados vacíos.
20. Pulir UI y validaciones.
```

---

# 26. Estructura de carpetas recomendada

```txt
src/
  app/
    navigation/
  features/
    dashboard/
    orders/
    expenses/
    products/
    supplies/
    settings/
    movements/
  database/
    migrations/
    repositories/
    schema/
  shared/
    components/
    hooks/
    utils/
    constants/
    types/
  theme/
    colors.ts
    spacing.ts
    typography.ts
    radius.ts
```

---

# 27. Decisiones finales resumidas

| Tema | Decisión |
|---|---|
| Tipo de app | Mobile offline-first |
| Framework | React Native con Expo |
| Lenguaje | TypeScript |
| Base de datos | SQLite |
| Estado global | Zustand |
| Login | No en MVP |
| Roles | No en MVP |
| Navegación | Bottom tabs con 4 secciones |
| Ingreso válido | Solo orden entregada |
| Gasto válido | Gasto activo registrado |
| Dashboard | Basado en tabla movements |
| Auditoría | Movimientos no se eliminan físicamente |
| Inventario automático | Fuera del MVP |
| Nube | Fuera del MVP |
| Exportar PDF/Excel | Fuera del MVP |
| Tabla financiera central | movements |
| Montos en movements | Siempre positivos |
| Dirección financiera | direction: in/out |

---

# 28. Checklist para empezar desarrollo

Antes de escribir código, deben estar listos:

- [x] Objetivo de la app.
- [x] Usuario principal.
- [x] Stack técnico.
- [x] Navegación principal.
- [x] Alcance MVP.
- [x] Modelo de datos.
- [x] Reglas financieras.
- [x] Tabla de movimientos.
- [x] Reglas de auditoría.
- [x] Validaciones básicas.
- [x] Estados vacíos.
- [x] Orden de desarrollo.

Con estas decisiones, DulceFlow queda lista para pasar a diseño final en Figma o directamente a implementación del MVP.
