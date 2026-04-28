import { z } from "zod";

export const orderSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  productId: z.string().min(1, "Debes seleccionar un producto."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que 0."),
  discount: z.coerce.number().min(0, "El descuento no puede ser negativo.").default(0),
  paymentStatus: z.enum(["pending", "paid"]).default("pending"),
  note: z.string().trim().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
