import { ListItem, Screen } from "@/shared/ui";

export function SettingsScreen() {
  return (
    <Screen title="Ajustes" subtitle="Catalogos, negocio y onboarding de la app.">
      <ListItem
        title="Onboarding"
        subtitle="Nombre del negocio y moneda principal"
        trailing=">"
      />
      <ListItem title="Productos" subtitle="Gestion del catalogo" trailing=">" />
      <ListItem title="Insumos" subtitle="Gestion del catalogo de gastos" trailing=">" />
      <ListItem title="Datos del negocio" subtitle="Preferencias generales" trailing=">" />
    </Screen>
  );
}
