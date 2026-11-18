import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["cash_on_delivery", "online"]),
  deliveryInstructions: z.string().max(300).optional(),
  couponCode: z.string().trim().max(40).optional(),
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  pricePaise: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.string().nullable(),
});