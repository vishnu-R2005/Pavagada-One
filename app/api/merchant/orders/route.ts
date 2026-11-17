import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {query} from "@/lib/db";

export async function GET(){
  const u=await currentUser();
  if(!u||u.role!=="merchant")return NextResponse.json({error:"Forbidden"},{status:403});
  const r=await query("select o.id,o.order_no,o.status,o.total_paise,o.created_at,a.address_line,a.landmark,c.full_name customer_name,c.phone customer_phone from orders o join addresses a on a.id=o.address_id join users c on c.id=o.customer_id where o.shop_id in (select id from shops where owner_id=?) order by o.created_at desc",[u.id]);
  return NextResponse.json({orders:r.rows});
}
