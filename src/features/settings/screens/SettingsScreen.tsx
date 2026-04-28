import { router } from "expo-router";

import { ListItem, Screen } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";

export function SettingsScreen() {
  const businessSettings = useAppStore((state) => state.businessSettings);

  return (
    <Screen
      title="Ajustes"
      subtitle={
        businessSettings
          ? `${businessSettings.businessName} - Moneda ${businessSettings.currency}`
          : "Catalogos, negocio y onboarding de la app."
      }
    >
      <ListItem
        onPress={() => router.push("/onboarding")}
        title="Configuracion inicial"
        subtitle="Nombre del negocio y moneda principal"
        trailing=">"
      />
      <ListItem
        onPress={() => router.push("/products")}
        title="Productos"
        subtitle="Gestion del catalogo"
        trailing=">"
      />
      <ListItem
        onPress={() => router.push("/supplies")}
        title="Insumos"
        subtitle="Gestion del catalogo de gastos"
        trailing=">"
      />
      <ListItem
        title="Datos del negocio"
        subtitle={businessSettings ? `${businessSettings.businessName} - ${businessSettings.currency}` : "Pendiente"}
        trailing=">"
      />
    </Screen>
  );
}
