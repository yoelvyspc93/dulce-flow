import { z } from "zod";

export const orderSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  dueDate: z.string().trim().min(1, "La fecha del pedido es obligatoria."),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Debes seleccionar un producto."),
      quantity: z.coerce.number().finite("La cantidad debe ser un numero valido.").positive("La cantidad debe ser mayor que 0."),
      unitPrice: z.coerce.number().finite("El precio debe ser un numero valido.").positive("El precio debe ser mayor que 0."),
    })
  ).min(1, "Debes adicionar al menos un producto."),
  note: z.string().trim().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
