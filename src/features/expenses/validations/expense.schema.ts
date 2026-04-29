import { z } from "zod";

import { SUPPLY_UNITS } from "@/features/supplies/validations/supply.schema";

export const expenseSchema = z.object({
  supplyId: z.string().trim().min(1, "Debes seleccionar un insumo."),
  supplyName: z.string().trim().min(1, "El nombre del insumo es obligatorio."),
  quantity: z.coerce
    .number({ error: "La cantidad debe ser un numero valido." })
    .finite("La cantidad debe ser un numero valido.")
    .positive("La cantidad debe ser mayor que 0."),
  unit: z.enum(SUPPLY_UNITS, "Debes seleccionar una unidad."),
  unitPrice: z.coerce
    .number({ error: "El precio unitario debe ser un numero valido." })
    .finite("El precio unitario debe ser un numero valido.")
    .positive("El precio unitario debe ser mayor que 0."),
  note: z.string().trim().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
