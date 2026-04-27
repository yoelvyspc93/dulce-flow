import { Badge, ListItem, Screen } from "@/shared/ui";

export function ExpenseDetailsScreen() {
  return (
    <Screen title="Detalle de gasto" subtitle="Preparado para soportar anulacion y reversal.">
      <ListItem title="Estado" subtitle="Los gastos anulados no se eliminan fisicamente" trailing={<Badge label="active" />} />
      <ListItem title="Impacto" subtitle="Cada gasto genera un movement expense/out" />
    </Screen>
  );
}
