import { Badge, ListItem, Screen } from "@/shared/ui";

export function ProductDetailsScreen() {
  return (
    <Screen title="Detalle de producto" subtitle="Quedara conectado al CRUD de productos.">
      <ListItem title="Estado" subtitle="Los productos usados no se eliminan fisicamente" trailing={<Badge label="active" />} />
    </Screen>
  );
}
