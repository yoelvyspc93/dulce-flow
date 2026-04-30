import { router } from "expo-router";

import { ListItem, Screen } from "@/shared/ui";
import { colors } from "@/theme";
import { ChevronRight } from "lucide-react-native";

export function SettingsScreen() {
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
        subtitle="Catalogo de articulos que vendes en pedidos"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        onPress={() => router.push("/supplies")}
        title="Insumos"
        subtitle="Materiales o compras que usas para registrar gastos"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        onPress={() => router.push("/accessibility")}
        title="Accesibilidad"
        subtitle="Legibilidad"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
    </Screen>
  );
}
