import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  price: z.coerce.number().finite("El precio debe ser un numero valido.").positive("El precio debe ser mayor que 0."),
  description: z.string().trim().optional(),
});

export const productRecipeItemSchema = z.object({
  supplyId: z.string().optional(),
  supplyName: z.string().trim().min(1, "El nombre del insumo es obligatorio."),
  quantity: z.coerce.number().finite("La cantidad debe ser un numero valido.").positive("La cantidad debe ser mayor que 0."),
  unit: z.string().trim().min(1, "La unidad es obligatoria."),
  unitPrice: z.coerce.number().finite("El precio unitario debe ser un numero valido.").positive("El precio unitario debe ser mayor que 0."),
});

export const productWithRecipeSchema = productSchema.extend({
  recipeItems: z.array(productRecipeItemSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductWithRecipeFormValues = z.infer<typeof productWithRecipeSchema>;
