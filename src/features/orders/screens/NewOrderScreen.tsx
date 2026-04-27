import { Screen, SelectField, TextField } from "@/shared/ui";

export function NewOrderScreen() {
  return (
    <Screen title="Nueva orden" subtitle="Base de formulario para la fase de ordenes.">
      <TextField label="Cliente" placeholder="Nombre del cliente" />
      <TextField label="Telefono" placeholder="Telefono" />
      <SelectField label="Productos" value="Selecciona productos del catalogo" />
      <TextField label="Nota" placeholder="Detalles de entrega o decoracion" multiline />
    </Screen>
  );
}
