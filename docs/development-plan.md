# Plan De Desarrollo DulceFlow MVP

## Resumen

DulceFlow se desarrollara como app offline-first con Expo SDK 55, TypeScript, Expo Router, SQLite, Zustand, React Hook Form y Zod.

El orden de entrega sera:

1. Web
2. Android
3. iOS

El avance se marcara en este documento con:

```md
- [ ] Pendiente
- [~] En progreso
- [x] Terminada
```

La interfaz seguira como inspiracion visual el estilo de TaskEz: Productivity App iOS UI Kit:

https://www.behance.net/gallery/108149857/TaskEz-Productivity-App-iOS-UI-Kit

Se tomara como referencia una estetica movil oscura, limpia, moderna, con tarjetas suaves, jerarquia clara, acentos brillantes y componentes tipo iOS. No se copiara literalmente; se adaptara a DulceFlow y al dominio de administracion de dulceria.

## Decisiones Cerradas

- [x] Web primero, Android segundo, iOS al final.
- [x] SQLite sera la fuente de verdad.
- [x] Zustand solo manejara UI, filtros y estado temporal.
- [x] El dashboard se calculara desde `movements`.
- [x] `movements` usara `direction: 'in' | 'out'`.
- [x] `amount` en `movements` siempre sera positivo.
- [x] `expenses` tendra `status: 'active' | 'voided'`.
- [x] La UI inicial sera funcional, pero desde el inicio usara tokens inspirados en TaskEz.
- [x] No habra login, nube, sincronizacion, roles, PDF, Excel ni inventario automatico en el MVP.

## Fase 0 - Base Del Proyecto `[x]`

- [x] Configurar scripts:
  - `web`
  - `android`
  - `ios`
  - `lint`
  - `typecheck`
  - `test`
- [x] Instalar dependencias:
  - `expo-sqlite`
  - `zustand`
  - `react-hook-form`
  - `zod`
  - `@hookform/resolvers`
  - `date-fns`
  - `lucide-react-native`
- [x] Instalar pruebas:
  - `jest`
  - `jest-expo`
  - `@testing-library/react-native`
- [x] Configurar alias TypeScript completos.

Criterio de terminado: `typecheck`, `lint` y `test` corren sin errores.

## Fase 1 - Arquitectura, Navegacion Y UI Base `[x]`

- [x] Crear estructura modular:
  - `features`
  - `database`
  - `shared`
  - `theme`
  - `store`
- [x] Configurar tabs:
  - Inicio
  - Ordenes
  - Gastos
  - Ajustes
- [x] Crear rutas internas para onboarding, ordenes, gastos, productos e insumos.
- [x] Crear tokens visuales inspirados en TaskEz:
  - fondo oscuro.
  - superficies elevadas.
  - tarjetas redondeadas.
  - acento principal brillante.
  - tipografia clara y compacta.
  - estados con colores diferenciados.
- [x] Crear componentes base:
  - `Screen`
  - `Button`
  - `IconButton`
  - `TextField`
  - `SelectField`
  - `AmountText`
  - `Badge`
  - `EmptyState`
  - `ListItem`
  - `ConfirmDialog`

Criterio de terminado: la app abre en web, navega entre tabs y tiene una base visual consistente.

## Fase 2 - SQLite Y Repositories `[x]`

- [x] Configurar conexion SQLite.
- [x] Crear migraciones.
- [x] Crear tablas:
  - `products`
  - `supplies`
  - `orders`
  - `order_items`
  - `expenses`
  - `movements`
  - `settings`
- [x] Crear repositories por entidad.
- [x] Crear mappers snake_case/camelCase.

Criterio de terminado: se puede guardar y leer un setting desde SQLite con tests.

## Fase 3 - Onboarding Y Ajustes `[x]`

- [x] Implementar onboarding:
  - nombre del negocio.
  - moneda principal.
  - primer producto opcional.
- [x] Guardar configuracion en SQLite.
- [x] Redirigir segun onboarding completado.
- [x] Implementar Ajustes con accesos a productos, insumos y negocio.

Criterio de terminado: onboarding persiste y no reaparece despues de completarse.

## Fase 4 - Productos E Insumos `[x]`

- [x] CRUD de productos.
- [x] CRUD de insumos.
- [x] Activar/desactivar sin eliminacion fisica.
- [x] Validaciones con Zod.

Criterio de terminado: productos e insumos persisten y aparecen en formularios.

## Fase 5 - Gastos Y Movimientos `[x]`

- [x] Crear, listar, editar y anular gastos.
- [x] Crear movimiento `expense/out` al registrar gasto.
- [x] Crear movimiento `reversal/in` al anular gasto.
- [x] Agregar filtros por periodo y categoria.
- [x] Agregar estados vacios.

Criterio de terminado: los gastos afectan el dashboard y las anulaciones revierten sin borrar auditoria.

## Fase 6 - Ordenes Y Movimientos `[x]`

- [x] Crear, listar, editar y ver ordenes.
- [x] Calcular subtotal, descuento y total automaticamente.
- [x] Permitir edicion solo en ordenes pendientes.
- [x] Entregar orden y crear movimiento `income/in`.
- [x] Cancelar orden entregada y crear movimiento `reversal/out`.
- [x] Filtrar por estado, cliente y periodo.

Criterio de terminado: solo las ordenes entregadas cuentan como ingreso.

## Fase 7 - Dashboard `[x]`

- [x] Mostrar ingresos, gastos y ganancia estimada.
- [x] Calcular todo desde `movements`.
- [x] Agregar filtros:
  - hoy
  - semana
  - mes
  - todo
- [x] Mostrar ultimos movimientos.
- [x] Agregar accesos rapidos.

Criterio de terminado: los totales son correctos y persisten despues de cerrar/reabrir la app.

## Fase 8 - Tests Y Estabilizacion

- [ ] Tests de validaciones.
- [ ] Tests de calculo de ordenes.
- [ ] Tests de movimientos financieros.
- [ ] Tests de repositories criticos.
- [ ] Tests de resumen financiero.
- [ ] Prueba manual completa del flujo principal.

Criterio de terminado: sin errores conocidos, tests pasando y flujo completo funcional.

## Fase 9 - Web

- [ ] Validar navegacion.
- [ ] Validar formularios.
- [ ] Validar persistencia.
- [ ] Ajustar responsive basico.

Criterio de terminado: MVP completo usable en navegador.

## Fase 10 - Android

- [ ] Validar en emulador o dispositivo.
- [ ] Validar SQLite persistente.
- [ ] Validar teclado movil.
- [ ] Validar navegacion y formularios.

Criterio de terminado: MVP completo funcional en Android.

## Fase 11 - iOS

- [ ] Validar cuando haya entorno disponible.
- [ ] Revisar navegacion, teclado y persistencia.
- [ ] Corregir diferencias especificas.

Criterio de terminado: MVP completo funcional en iOS.

## Fase 12 - Pulido Visual Final

- [ ] Refinar la UI siguiendo TaskEz como referencia:
  - dashboard con tarjetas oscuras y metricas claras.
  - botones principales con acento brillante.
  - listas con tarjetas compactas.
  - badges para estados.
  - formularios limpios tipo iOS.
- [ ] Revisar espaciado, tamanos, contraste y estados vacios.
- [ ] Mantener la app practica, sin convertirla en una landing page ni en una UI decorativa.

Criterio de terminado: la app se ve consistente, moderna y profesional sin cambiar logica de negocio.

## Test Plan

- [ ] Unit tests para validaciones, fechas, calculos y reglas financieras.
- [ ] Service tests para crear/reversar movimientos.
- [ ] Repository tests para persistencia SQLite.
- [ ] Pruebas manuales en web, Android e iOS.

## Supuestos

- "100% funcional" significa: sin errores conocidos, tests pasando, flujo principal probado y datos persistentes.
- El diseno TaskEz sera una referencia visual, no una copia literal.
- La prioridad del MVP sigue siendo funcionamiento correcto antes que diseno final.
