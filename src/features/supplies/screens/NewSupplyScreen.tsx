import { Screen, SelectField, TextField } from "@/shared/ui";

export function NewSupplyScreen() {
  return (
    <Screen title="Nuevo insumo" subtitle="Pantalla base del catalogo de insumos.">
      <TextField label="Nombre" placeholder="Harina" />
      <TextField label="Unidad" placeholder="kg, unidad, caja..." />
      <SelectField label="Categoria sugerida" value="Ingredientes" />
    </Screen>
  );
}
