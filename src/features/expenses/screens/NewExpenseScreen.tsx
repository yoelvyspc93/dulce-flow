import { Screen, SelectField, TextField } from "@/shared/ui";

export function NewExpenseScreen() {
  return (
    <Screen title="Nuevo gasto" subtitle="Base de formulario para la fase de gastos.">
      <SelectField label="Insumo" value="Selecciona un insumo o usa nombre manual" />
      <SelectField label="Categoria" value="Ingredientes" />
      <TextField label="Total" placeholder="$0.00" />
      <TextField label="Nota" placeholder="Detalle opcional" multiline />
    </Screen>
  );
}
