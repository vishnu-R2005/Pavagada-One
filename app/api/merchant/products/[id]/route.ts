import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,audit} from "@/lib/auth";
import {query} from "@/lib/db";

const imageRef=z.string().max(650_000).refine(value=>/^https?:\/\//i.test(value)||/^data:image\/(png|jpeg|webp);base64,/i.test(value)||value.startsWith("/images/"),"Invalid image");

const S=z.object({
  name:z.string().trim().min(2).max(120),
  pricePaise:z.number().int().positive(),
  stock:z.number().int().min(0),
  lowStockThreshold:z.number().int().min(0).max(10_000).optional(),
  unit:z.string().trim().max(30).nullable(),
  categoryId:z.string().nullable().optional(),
  description:z.string().trim().max(500).optional(),
  imageUrl:imageRef.nullable().optional(),
  isActive:z.boolean(),
});

export async function PATCH(q:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u||u.role!=="merchant")return NextResponse.json({error:"Forbidden"},{status:403});
  const p=S.safeParse(await q.json());
  if(!p.success)return NextResponse.json({error:"Enter a valid product name, price, and stock quantity."},{status:400});
  const{id}=await params;
  const r=await query("update products set name=?,category_id=?,description=?,price_paise=?,unit=?,image_url=?,is_active=?,updated_at=CURRENT_TIMESTAMP where id=? and shop_id in(select id from shops where owner_id=?)",[p.data.name,p.data.categoryId??null,p.data.description??null,p.data.pricePaise,p.data.unit,p.data.imageUrl??null,Number(p.data.isActive),id,u.id]);
  if(!r.rowsAffected)return NextResponse.json({error:"Product not found"},{status:404});
  await query("update inventory set quantity=?,low_stock_threshold=coalesce(?,low_stock_threshold),updated_at=CURRENT_TIMESTAMP where product_id=?",[p.data.stock,p.data.lowStockThreshold??null,id]);
  await audit(u.id,"product.updated","product",id);
  return NextResponse.json({ok:true});
}
