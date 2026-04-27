import { Badge, ListItem, Screen } from "@/shared/ui";

export function OrderDetailsScreen() {
  return (
    <Screen title="Detalle de orden" subtitle="Pantalla preparada para conectar estado y movimientos.">
      <ListItem title="Estado" subtitle="Solo las ordenes entregadas generan ingreso" trailing={<Badge label="pending" />} />
      <ListItem title="Pago" subtitle="Se guarda aparte del estado operativo" trailing={<Badge label="pending" tone="warning" />} />
    </Screen>
  );
}
