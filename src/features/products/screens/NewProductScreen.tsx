import { Screen, TextField } from "@/shared/ui";

export function NewProductScreen() {
  return (
    <Screen title="Nuevo producto" subtitle="Pantalla base del catalogo de productos.">
      <TextField label="Nombre" placeholder="Cupcake de vainilla" />
      <TextField label="Precio" placeholder="$0.00" />
      <TextField label="Descripcion" placeholder="Opcional" multiline />
    </Screen>
  );
}
