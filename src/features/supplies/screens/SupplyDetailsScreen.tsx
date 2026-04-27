import { Badge, ListItem, Screen } from "@/shared/ui";

export function SupplyDetailsScreen() {
  return (
    <Screen title="Detalle de insumo" subtitle="Quedara conectado al CRUD de insumos.">
      <ListItem title="Estado" subtitle="Los insumos usados no se eliminan fisicamente" trailing={<Badge label="active" />} />
    </Screen>
  );
}
