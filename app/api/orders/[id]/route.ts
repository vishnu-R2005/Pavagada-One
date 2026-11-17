import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {query} from "@/lib/db";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u)return NextResponse.json({error:"Unauthenticated"},{status:401});
  const{id}=await params;
  const order=(await query("select id,order_no,status,subtotal_paise,delivery_fee_paise,total_paise,payment_method,payment_status,created_at from orders where id=? and customer_id=?",[id,u.id])).rows[0];
  if(!order)return NextResponse.json({error:"Order not found"},{status:404});
  const[items,history]=await Promise.all([
    query("select oi.product_name,oi.unit_price_paise,oi.quantity,oi.total_paise,p.image_url from order_items oi left join products p on p.id=oi.product_id where oi.order_id=?",[id]),
    query("select status,note,created_at from order_status_history where order_id=? order by created_at",[id]),
  ]);
  return NextResponse.json({order,items:items.rows,history:history.rows});
}
