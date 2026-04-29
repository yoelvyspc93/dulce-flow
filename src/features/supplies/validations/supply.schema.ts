import { z } from "zod";

export const SUPPLY_UNITS = ["kg", "g", "lb", "litro", "ml", "unidad", "paquete", "caja", "docena"] as const;

export const supplySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  unit: z.enum(SUPPLY_UNITS, "Debes seleccionar una unidad."),
  defaultPrice: z.coerce
    .number({ error: "El precio establecido debe ser un numero valido." })
    .finite("El precio establecido debe ser un numero valido.")
    .positive("El precio establecido debe ser mayor que 0."),
});

export type SupplyFormValues = z.infer<typeof supplySchema>;
