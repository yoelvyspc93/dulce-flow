import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  price: z.coerce.number().finite("El precio debe ser un numero valido.").positive("El precio debe ser mayor que 0."),
  description: z.string().trim().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
