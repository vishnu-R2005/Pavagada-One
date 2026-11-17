import {NextResponse} from "next/server";
import {query} from "@/lib/db";

export async function GET(){
  try{
    const [categories,shops,products]=await Promise.all([
      query("select id,name,image_url from categories where is_active=1 order by name"),
      query("select id,name,slug,address,phone,image_url,opening_hours,delivery_available,is_open from shops where is_approved=1 order by name"),
      query("select p.id,p.shop_id,p.category_id,p.name,p.description,p.price_paise,p.image_url,p.unit,i.quantity from products p join inventory i on i.product_id=p.id join shops s on s.id=p.shop_id where p.is_active=1 and s.is_approved=1 and s.is_open=1 and i.quantity>0 order by p.name"),
    ]);
    return NextResponse.json({categories:categories.rows,shops:shops.rows,products:products.rows});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Catalog unavailable"},{status:500});
  }
}
