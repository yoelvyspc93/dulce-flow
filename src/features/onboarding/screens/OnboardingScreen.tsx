import { View } from "react-native";

import { SectionHeader } from "@/shared/components";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";

export function OnboardingScreen() {
  return (
    <Screen title="Primera configuracion" subtitle="Paso inicial para preparar el negocio." scrollable={false}>
      <SectionHeader
        title="Negocio"
        subtitle="Esta base se conectara a settings en la siguiente fase."
      />
      <TextField label="Nombre del negocio" placeholder="Dulces Maria" />
      <SelectField label="Moneda principal" value="USD" />
      <View style={{ gap: 12, marginTop: 8 }}>
        <Button label="Guardar y continuar" />
        <Button label="Crear primer producto despues" variant="secondary" />
      </View>
    </Screen>
  );
}
