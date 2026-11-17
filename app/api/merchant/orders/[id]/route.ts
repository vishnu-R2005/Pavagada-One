import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {query} from "@/lib/db";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u||u.role!=="merchant")return NextResponse.json({error:"Forbidden"},{status:403});
  const{id}=await params;
  const o=(await query("select o.*,a.address_line,a.landmark,u.full_name customer_name,u.phone customer_phone from orders o join addresses a on a.id=o.address_id join users u on u.id=o.customer_id where o.id=? and o.shop_id in(select id from shops where owner_id=?)",[id,u.id])).rows[0];
  if(!o)return NextResponse.json({error:"Order not found"},{status:404});
  const items=await query("select oi.product_name,oi.quantity,oi.total_paise,p.image_url from order_items oi left join products p on p.id=oi.product_id where oi.order_id=?",[id]);
  return NextResponse.json({order:o,items:items.rows});
}
