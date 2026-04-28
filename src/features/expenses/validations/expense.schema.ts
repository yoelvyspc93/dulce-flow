import { z } from "zod";

import type { ExpenseCategory } from "@/shared/types";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "ingredients",
  "packaging",
  "decoration",
  "transport",
  "services",
  "other",
];

export const expenseSchema = z.object({
  supplyId: z.string().optional(),
  supplyName: z.string().trim().min(1, "El nombre del gasto o insumo es obligatorio."),
  category: z.enum(EXPENSE_CATEGORIES),
  quantity: z.coerce.number().finite("La cantidad debe ser un numero valido.").positive("La cantidad debe ser mayor que 0.").optional(),
  unit: z.string().trim().optional(),
  unitPrice: z.coerce.number().finite("El precio unitario debe ser un numero valido.").positive("El precio unitario debe ser mayor que 0.").optional(),
  total: z.coerce.number().finite("El total debe ser un numero valido.").positive("El total debe ser mayor que 0."),
  note: z.string().trim().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
