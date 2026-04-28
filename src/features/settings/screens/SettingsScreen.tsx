import { router } from "expo-router";

import { ListItem, Screen } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";
import { colors } from "@/theme";
import { ChevronRight } from "lucide-react-native";

export function SettingsScreen() {
  const businessSettings = useAppStore((state) => state.businessSettings);

  return (
    <Screen title="Ajustes">
      <ListItem
        onPress={() => router.push("/onboarding")}
        title="Configuracion inicial"
        subtitle="Nombre del negocio y moneda principal"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        onPress={() => router.push("/products")}
        title="Productos"
        subtitle="Gestion del catalogo"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        onPress={() => router.push("/supplies")}
        title="Insumos"
        subtitle="Gestion del catalogo de gastos"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        title="Datos del negocio"
        subtitle={businessSettings ? `${businessSettings.businessName} - ${businessSettings.currency}` : "Pendiente"}
      />
    </Screen>
  );
}
