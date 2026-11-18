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
  categoryId:z.string().nullable().optional(),
  description:z.string().trim().max(500).optional(),
  unit:z.string().trim().max(30).nullable().optional(),
  imageUrl:imageRef.nullable().optional(),
});

export async function GET(){
  const u=await currentUser();
  if(!u||u.role!=="merchant")return NextResponse.json({error:"Forbidden"},{status:403});
  const r=await query("select p.*,i.quantity,i.low_stock_threshold,c.name category_name from products p join inventory i on i.product_id=p.id join shops s on s.id=p.shop_id left join categories c on c.id=p.category_id where s.owner_id=? order by p.created_at desc",[u.id]);
  return NextResponse.json({products:r.rows});
}

export async function POST(q:Request){
  const u=await currentUser();
  if(!u||u.role!=="merchant")return NextResponse.json({error:"Forbidden"},{status:403});
  const p=S.safeParse(await q.json());
  if(!p.success)return NextResponse.json({error:"Enter a valid product name, price, and stock quantity."},{status:400});
  const sh=(await query("select id from shops where owner_id=?",[u.id])).rows[0] as unknown as {id:string}|undefined;
  if(!sh)return NextResponse.json({error:"Shop not found"},{status:404});
  const id=crypto.randomUUID();
  await query("insert into products(id,shop_id,category_id,name,description,price_paise,unit,image_url) values(?,?,?,?,?,?,?,?)",[id,sh.id,p.data.categoryId??null,p.data.name,p.data.description??null,p.data.pricePaise,p.data.unit??null,p.data.imageUrl??null]);
  await query("insert into inventory(product_id,quantity,low_stock_threshold) values(?,?,?)",[id,p.data.stock,p.data.lowStockThreshold??5]);
  await audit(u.id,"product.created","product",id);
  return NextResponse.json({id},{status:201});
}
