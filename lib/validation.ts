import {z} from "zod";
export const checkoutSchema=z.object({addressId:z.string().uuid(),paymentMethod:z.enum(["cash_on_delivery","online"]),deliveryInstructions:z.string().max(300).optional()});
export const productSchema=z.object({name:z.string().min(2).max(120),pricePaise:z.number().int().positive(),stock:z.number().int().min(0),categoryId:z.string().uuid().nullable()});