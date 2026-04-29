# DulceFlow — Arquitectura del proyecto

## 1. Decisión técnica principal

**DulceFlow** será una aplicación móvil desarrollada con **Expo SDK 55**, usando una arquitectura simple, modular y preparada para crecer sin convertir el proyecto en algo complejo.

La app será **offline-first**, sin login en el MVP y con almacenamiento local en el dispositivo.

## 2. Stack cerrado del MVP

```txt
Framework: Expo SDK 55
Lenguaje: TypeScript
Navegación: Expo Router
Base de datos local: expo-sqlite
Estado global ligero: Zustand
Formularios: React Hook Form
Validaciones: Zod
Fechas: date-fns
IDs: crypto.randomUUID o expo-crypto
Estilos: StyleSheet + tokens propios
Iconos: lucide-react-native
```

## 3. Principios de arquitectura

La arquitectura debe seguir estos principios:

```txt
Simple antes que compleja.
Offline-first desde el inicio.
La base de datos es la fuente de verdad.
Las pantallas no deben hablar directo con SQLite.
La lógica de negocio no debe vivir dentro de los componentes visuales.
Cada feature debe estar agrupada por dominio.
Los movimientos financieros deben ser auditables.
```

## 4. Estructura general de carpetas

```txt
dulceflow/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── orders.tsx
│   │   ├── expenses.tsx
│   │   └── settings.tsx
│   ├── orders/
│   │   ├── new.tsx
│   │   └── [id].tsx
│   ├── expenses/
│   │   ├── new.tsx
│   │   └── [id].tsx
│   ├── products/
│   │   ├── new.tsx
│   │   └── [id].tsx
│   ├── supplies/
│   │   ├── new.tsx
│   │   └── [id].tsx
│   └── onboarding.tsx
│
├── src/
│   ├── app/
│   │   ├── providers/
│   │   ├── bootstrap/
│   │   └── config/
│   │
│   ├── features/
│   │   ├── home/
│   │   ├── orders/
│   │   ├── expenses/
│   │   ├── products/
│   │   ├── supplies/
│   │   ├── movements/
│   │   ├── settings/
│   │   └── onboarding/
│   │
│   ├── database/
│   │   ├── connection.ts
│   │   ├── schema.ts
│   │   ├── migrations/
│   │   ├── repositories/
│   │   └── seed/
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── ui/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── types/
│   │   └── validations/
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   │
│   └── store/
│       ├── app.store.ts
│       └── ui.store.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── docs/
│   ├── decisions.md
│   ├── database.md
│   └── architecture.md
│
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

## 5. Responsabilidad de cada carpeta

### `app/`

Contiene solo rutas y layouts de **Expo Router**.

Las pantallas dentro de `app/` deben ser delgadas. Su trabajo es conectar la ruta con la pantalla real ubicada en `src/features`.

Ejemplo:

```tsx
// app/orders/new.tsx
import { NewOrderScreen } from '@/features/orders/screens/NewOrderScreen';

export default NewOrderScreen;
```

### `src/features/`

Contiene la lógica por dominio.

Cada feature puede tener:

```txt
components/
screens/
hooks/
services/
types/
validations/
mappers/
```

Ejemplo:

```txt
features/orders/
├── components/
│   ├── OrderCard.tsx
│   ├── OrderItemRow.tsx
│   └── OrderStatusBadge.tsx
├── screens/
│   ├── OrdersScreen.tsx
│   ├── NewOrderScreen.tsx
│   └── OrderDetailsScreen.tsx
├── hooks/
│   ├── useOrders.ts
│   └── useCreateOrder.ts
├── services/
│   └── order.service.ts
├── validations/
│   └── order.schema.ts
└── types/
    └── order.types.ts
```

### `src/database/`

Contiene todo lo relacionado con SQLite.

```txt
database/
├── connection.ts
├── schema.ts
├── migrations/
├── repositories/
└── seed/
```

Regla importante:

```txt
Los componentes no importan nada desde database/.
Las pantallas no ejecutan SQL.
Solo los repositories pueden ejecutar queries SQL.
```

### `src/shared/`

Contiene código reutilizable que no pertenece a un dominio específico.

```txt
shared/
├── ui/
├── components/
├── hooks/
├── utils/
├── constants/
├── types/
└── validations/
```

### `src/theme/`

Contiene los tokens visuales de la app.

```txt
theme/
├── colors.ts
├── spacing.ts
├── radius.ts
├── typography.ts
└── index.ts
```

### `src/store/`

Contiene estados globales ligeros.

Zustand no debe reemplazar SQLite. Solo debe manejar estado de UI o estado temporal.

Ejemplos válidos:

```txt
Tema activo.
Estado del onboarding.
Filtros seleccionados.
Modal abierto/cerrado.
Producto temporal seleccionado.
```

No guardar aquí como fuente principal:

```txt
Órdenes.
Gastos.
Movimientos.
Productos.
Insumos.
```

## 6. Arquitectura por capas

La app usará una arquitectura de 4 capas:

```txt
UI Layer
↓
Feature Layer
↓
Service Layer
↓
Repository / Database Layer
```

## 7. Flujo correcto de datos

Ejemplo al crear una orden:

```txt
NewOrderScreen
↓
useCreateOrder
↓
order.service.ts
↓
order.repository.ts
↓
SQLite
↓
movement.repository.ts
↓
SQLite
```

La pantalla nunca debe crear directamente el movimiento financiero. Eso lo hace el servicio.

## 8. Base de datos como fuente de verdad

SQLite será la fuente principal de datos.

Zustand puede cachear información temporal, pero después de crear, editar o eliminar datos, las pantallas deben refrescar desde SQLite.

## 9. Tabla central de movimientos

La tabla `movements` será el centro financiero y auditable de la app.

Todas las operaciones que afecten dinero deben registrar un movimiento.

### Objetivo

```txt
Tener una fuente única para consultar ingresos, gastos y ganancias.
Evitar cálculos dispersos entre órdenes y gastos.
Facilitar auditoría.
Poder reconstruir el historial financiero.
Preparar la app para reportes futuros.
```

### Tipos de movimientos

```ts
type MovementType = 'income' | 'expense' | 'adjustment';

type MovementSourceType =
  | 'order'
  | 'expense'
  | 'manual_adjustment';
```

### Regla principal

```txt
Una orden entregada crea un movement de tipo income.
Un gasto guardado crea un movement de tipo expense.
Una corrección manual crea un movement de tipo adjustment.
Una orden cancelada no genera ingreso.
Una orden pendiente no genera ingreso.
```

## 10. Modelo de datos recomendado

### `products`

```sql
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image_uri TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### `supplies`

```sql
CREATE TABLE IF NOT EXISTS supplies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  default_price REAL NOT NULL CHECK(default_price > 0),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### `orders`

```sql
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'delivered', 'cancelled')),
  due_date TEXT NOT NULL,
  note TEXT,
  delivered_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### `order_items`

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  created_at TEXT NOT NULL,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

### `expenses`

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  supply_id TEXT NOT NULL,
  supply_name TEXT NOT NULL,
  quantity REAL NOT NULL CHECK(quantity > 0),
  unit TEXT NOT NULL,
  unit_price REAL NOT NULL CHECK(unit_price > 0),
  total REAL NOT NULL CHECK(total > 0),
  status TEXT NOT NULL CHECK(status IN ('active', 'voided')) DEFAULT 'active',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE RESTRICT
);
```

### `movements`

```sql
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
```

### `settings`

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 11. Índices recomendados

```sql
CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_due_date
ON orders(due_date);

CREATE INDEX IF NOT EXISTS idx_expenses_created_at
ON expenses(created_at);

CREATE INDEX IF NOT EXISTS idx_movements_type
ON movements(type);

CREATE INDEX IF NOT EXISTS idx_movements_source
ON movements(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_movements_date
ON movements(movement_date);

CREATE INDEX IF NOT EXISTS idx_movements_status
ON movements(status);
```

## 12. Reglas de auditoría

### Regla 1

No se deben borrar movimientos financieros.

```txt
Incorrecto:
DELETE FROM movements WHERE id = ?

Correcto:
Marcar movement como `voided` o `reversed`.
```

### Regla 2

Si un pedido entregado se cancela, su ingreso debe dejar de contar sin crear una salida nueva.

```txt
movement.status = 'voided'
```

### Regla 3

Si un gasto fue creado por error, el gasto visible queda `voided` y su movimiento queda `voided`.

### Regla 4

Los pedidos entregados no se editan. Los pedidos pendientes se editan antes de entregarse.

Debe hacerse:

```txt
1. Editar el pedido pendiente.
2. Entregar el pedido para crear el ingreso.
```

### Regla 5

Los totales del dashboard salen de `movements`, no directamente de `orders` ni `expenses`.

## 13. Consultas base del dashboard

### Ingresos

```sql
SELECT COALESCE(SUM(amount), 0) AS total_income
FROM movements
WHERE type = 'income'
  AND status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

### Gastos

```sql
SELECT COALESCE(SUM(amount), 0) AS total_expenses
FROM movements
WHERE type = 'expense'
  AND status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

### Ganancia

```sql
SELECT
  COALESCE(SUM(
    CASE
      WHEN type = 'income' THEN amount
      WHEN type = 'expense' THEN -amount
      WHEN type = 'adjustment' THEN amount
      ELSE 0
    END
  ), 0) AS profit
FROM movements
WHERE status = 'active'
  AND movement_date BETWEEN ? AND ?;
```

### Últimos movimientos

```sql
SELECT *
FROM movements
WHERE status = 'active'
  AND movement_date BETWEEN ? AND ?
ORDER BY movement_date DESC, created_at DESC
LIMIT 10;
```

## 13.1 Migraciones SQLite

`DATABASE_VERSION` actual es `5`.

Las migraciones corren dentro de una transaccion con `withTransactionAsync`. No hay downgrade automatico ni rollback manual documentado para versiones anteriores; si una migracion falla, la transaccion debe evitar aplicar cambios parciales. Antes de una migracion destructiva en produccion se debe crear un backup de la base de datos local.

## 14. Repositories

Cada tabla principal debe tener su repository.

```txt
database/repositories/
├── product.repository.ts
├── supply.repository.ts
├── order.repository.ts
├── expense.repository.ts
├── movement.repository.ts
└── settings.repository.ts
```

### Ejemplo de responsabilidades

```txt
product.repository.ts
- createProduct
- updateProduct
- getProducts
- getActiveProducts
- deactivateProduct

order.repository.ts
- createOrder
- updateOrder
- getOrders
- getOrderById
- updateOrderStatus

movement.repository.ts
- createMovement
- reverseMovementBySource
- getDashboardSummary
- getLatestMovements
```

## 15. Services

Los servicios coordinan operaciones que tocan más de una tabla.

```txt
features/orders/services/order.service.ts
features/expenses/services/expense.service.ts
features/movements/services/movement.service.ts
```

### Ejemplo: crear orden

```txt
createOrder
1. Validar datos.
2. Crear registro en orders.
3. Crear registros en order_items.
4. Si status es delivered, crear movement income.
5. Retornar orden creada.
```

### Ejemplo: cambiar estado de orden

```txt
updateOrderStatus
1. Leer orden actual.
2. Cambiar estado.
3. Si pasa de pending a delivered, crear movement income.
4. Si pasa de delivered a cancelled, reversar movement income.
5. Guardar updated_at.
```

### Ejemplo: crear gasto

```txt
createExpense
1. Validar datos.
2. Crear registro en expenses.
3. Crear movement expense.
4. Retornar gasto creado.
```

## 16. Pantallas del MVP

### Tabs principales

```txt
Inicio
Órdenes
Gastos
Ajustes
```

### Pantallas internas

```txt
/onboarding
/orders/new
/orders/[id]
/expenses/new
/expenses/[id]
/products/new
/products/[id]
/supplies/new
/supplies/[id]
```

## 17. Navegación recomendada

```txt
app/
├── (tabs)/
│   ├── home.tsx
│   ├── orders.tsx
│   ├── expenses.tsx
│   └── settings.tsx
├── orders/
├── expenses/
├── products/
├── supplies/
└── onboarding.tsx
```

La navegación inferior debe mantenerse simple:

```txt
Inicio | Órdenes | Gastos | Ajustes
```

## 18. Estado global

### Zustand permitido para

```txt
Estado de onboarding.
Tema.
Filtros de pantalla.
Estado temporal de formularios complejos.
Preferencias visuales.
```

### Zustand no permitido como fuente principal para

```txt
Órdenes.
Gastos.
Movimientos.
Productos.
Insumos.
```

## 19. Validaciones base

### Producto

```txt
Nombre requerido.
Precio mayor que 0.
```

### Insumo

```txt
Nombre requerido.
Unidad requerida.
```

### Orden

```txt
Debe tener al menos un producto.
Cada cantidad debe ser mayor que 0.
El total no puede ser negativo.
El descuento no puede ser mayor que el subtotal.
```

### Gasto

```txt
Insumo requerido.
Cantidad mayor que 0.
Unidad requerida.
Precio unitario mayor que 0.
Total calculado como cantidad por precio unitario.
```

## 20. Manejo de fechas

Todas las fechas se guardan en formato ISO string.

```ts
const now = new Date().toISOString();
```

Para filtros de dashboard:

```txt
Hoy
Esta semana
Este mes
Todo
```

## 21. Manejo de moneda

En el MVP habrá una moneda principal configurada en settings.

```txt
default_currency = USD
```

Todos los movimientos deben guardar la moneda usada en el momento de la operación.

Esto permite que en el futuro la app pueda soportar múltiples monedas sin romper el historial.

## 22. Tema visual

El tema debe salir de tokens.

```ts
export const colors = {
  background: '#071A2F',
  surface: '#0E2A47',
  surfaceSoft: '#12385C',
  primary: '#7CCBFF',
  success: '#75E0A7',
  danger: '#FF7A7A',
  warning: '#FFD166',
  text: '#F6FAFF',
  textMuted: '#A8B8C8',
  border: 'rgba(255,255,255,0.10)',
};
```

```ts
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};
```

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
```

## 23. Componentes UI base

Crear primero:

```txt
Button
IconButton
Card
TextField
SelectField
DateField
EmptyState
Screen
SectionHeader
AmountText
Badge
ListItem
BottomSheet
ConfirmDialog
```

## 24. Alias de imports

Configurar alias para evitar rutas largas.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/features/*": ["src/features/*"],
      "@/shared/*": ["src/shared/*"],
      "@/database/*": ["src/database/*"],
      "@/theme/*": ["src/theme/*"]
    }
  }
}
```

## 25. Orden recomendado de implementación

```txt
1. Crear proyecto con Expo SDK 55.
2. Configurar TypeScript y alias.
3. Configurar Expo Router.
4. Crear tema visual.
5. Crear componentes UI base.
6. Configurar SQLite.
7. Crear migraciones.
8. Crear repositories.
9. Crear settings iniciales.
10. Crear onboarding.
11. Crear productos.
12. Crear insumos.
13. Crear gastos + movements.
14. Crear órdenes + order_items + movements.
15. Crear dashboard desde movements.
16. Crear filtros por fecha.
17. Crear estados vacíos.
18. Crear validaciones.
19. Probar flujo completo.
20. Pulir UI.
```

## 26. Scripts recomendados

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

## 27. Dependencias recomendadas

```bash
npx expo install expo-sqlite
npm install zustand react-hook-form zod @hookform/resolvers date-fns lucide-react-native
```

## 28. Primera tarea real del proyecto

La primera tarea no debe ser diseñar la pantalla de inicio.

La primera tarea debe ser dejar funcionando la base del proyecto:

```txt
Crear app Expo 55.
Configurar navegación.
Configurar tema.
Configurar SQLite.
Ejecutar primera migración.
Guardar y leer un setting.
```

Cuando eso funcione, la app ya tiene base sólida para crecer.

## 29. Criterio para considerar la arquitectura lista

La arquitectura está lista cuando se pueda hacer esto:

```txt
Abrir la app.
Completar onboarding.
Crear producto.
Crear insumo.
Registrar gasto.
Crear orden.
Marcar orden como entregada.
Ver movimiento de ingreso.
Ver movimiento de gasto.
Ver ganancia correcta en Inicio.
Cerrar y abrir la app.
Ver que todos los datos siguen guardados.
```

## 30. Decisión final

DulceFlow usará una arquitectura **modular por features**, con **Expo Router** para navegación, **SQLite** como fuente de verdad, **Zustand** solo para estado ligero y una tabla `movements` como base financiera auditable.

Esta estructura permite empezar simple, pero deja la app preparada para futuras funciones como reportes, exportación, backup en la nube, clientes frecuentes e inventario automático.
