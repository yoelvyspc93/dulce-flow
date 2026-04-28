import { z } from "zod";

import type { ExpenseCategory } from "@/shared/types";

export const SUPPLY_CATEGORIES: ExpenseCategory[] = [
  "ingredients",
  "packaging",
  "decoration",
  "transport",
  "services",
  "other",
];

export const supplySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  unit: z.string().trim().min(1, "La unidad es obligatoria."),
  category: z.enum(SUPPLY_CATEGORIES).optional(),
});

export type SupplyFormValues = z.infer<typeof supplySchema>;
