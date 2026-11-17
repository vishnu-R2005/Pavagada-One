import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,audit} from "@/lib/auth";
import {query} from "@/lib/db";

const S=z.object({status:z.enum(["accepted","preparing","ready","cancelled"]),note:z.string().trim().max(200).optional()});
const allowed:Record<string,string[]>={placed:["accepted","cancelled"],accepted:["preparing","cancelled"],preparing:["ready","cancelled"],ready:[]};
const titles:Record<string,string>={accepted:"Order accepted",preparing:"Your order is being prepared",ready:"Your order is ready",cancelled:"Order cancelled"};

export async function PATCH(q:Request,{params}:{params:Promise<{id:string}>}){
  const u=await currentUser();
  if(!u||u.role!=="merchant")return NextResponse.json({error:"Forbidden"},{status:403});
  const p=S.safeParse(await q.json());
  if(!p.success)return NextResponse.json({error:"Invalid order update"},{status:400});
  const{id}=await params;
  const order=(await query("select id,order_no,status,customer_id from orders where id=? and shop_id in(select id from shops where owner_id=?)",[id,u.id])).rows[0] as unknown as {id:string;order_no:string;status:string;customer_id:string}|undefined;
  if(!order)return NextResponse.json({error:"Order not found"},{status:404});
  if(!allowed[order.status]?.includes(p.data.status))return NextResponse.json({error:"This order cannot be moved to that status."},{status:409});
  await query("update orders set status=?,updated_at=CURRENT_TIMESTAMP where id=?",[p.data.status,id]);
  await query("insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",[crypto.randomUUID(),id,p.data.status,u.id,p.data.note??null]);
  await query("insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",[crypto.randomUUID(),order.customer_id,"order_status",titles[p.data.status],`${order.order_no} is ${p.data.status.replaceAll("_"," ")}.`,JSON.stringify({orderId:id,status:p.data.status})]);
  await audit(u.id,"order.status_changed","order",id);
  return NextResponse.json({ok:true});
}
