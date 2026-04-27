import { View } from "react-native";

import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen } from "@/shared/ui";

export function ExpensesScreen() {
  return (
    <Screen title="Gastos" subtitle="Cada gasto activo impacta el dashboard y queda auditable.">
      <View style={{ gap: 12 }}>
        <Button label="Registrar gasto" />
        <ListItem title="Filtro por categoria" subtitle="Ingredientes" trailing={<Badge label="active" />} />
      </View>

      <SectionHeader
        title="Vista inicial"
        subtitle="La lista se conectara a SQLite cuando empecemos la capa de datos."
      />
      <EmptyState
        eyebrow="Sin gastos"
        title="Todavia no tienes gastos registrados"
        description="Agrega tu primer gasto para calcular mejor tus ganancias."
      />
    </Screen>
  );
}
