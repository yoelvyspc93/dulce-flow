import { useEffect, useState } from "react";

import { listSuppliesAsync } from "@/features/supplies/services/supply.service";
import { Screen, SelectField, TextField } from "@/shared/ui";
import type { Supply } from "@/shared/types";

export function NewExpenseScreen() {
  const [activeSupplies, setActiveSupplies] = useState<Supply[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliesAsync() {
      const supplies = await listSuppliesAsync();

      if (isMounted) {
        setActiveSupplies(supplies.filter((supply) => supply.isActive));
      }
    }

    void loadSuppliesAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  const supplyLabel =
    activeSupplies.length > 0
      ? `${activeSupplies[0].name}${activeSupplies.length > 1 ? ` +${activeSupplies.length - 1}` : ""}`
      : "No tienes insumos activos";

  return (
    <Screen title="Nuevo gasto" subtitle="Base de formulario para la fase de gastos.">
      <SelectField label="Insumo" value={supplyLabel} />
      <SelectField label="Categoria" value="Ingredientes" />
      <TextField label="Total" placeholder="$0.00" />
      <TextField label="Nota" placeholder="Detalle opcional" multiline />
    </Screen>
  );
}
