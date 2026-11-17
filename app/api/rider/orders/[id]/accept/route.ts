import {NextResponse} from "next/server";
import {audit,currentUser} from "@/lib/auth";
import {requireDb} from "@/lib/db";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const rider=await currentUser();
  if(!rider||rider.role!=="rider")return NextResponse.json({error:"Delivery Partner access is required."},{status:403});
  const {id}=await params;
  const db=requireDb();const tx=await db.transaction("write");
  try{
    const availability=await tx.execute({sql:"select rider_available from users where id=? and role='rider'",args:[rider.id]});
    if(!Number((availability.rows[0] as Record<string,unknown>|undefined)?.rider_available))throw new Error("Go online before accepting an order.");
    const order=await tx.execute({sql:"select id,order_no,customer_id from orders where id=? and status='ready' and not exists(select 1 from delivery_assignments where order_id=?)",args:[id,id]});
    const row=order.rows[0] as Record<string,unknown>|undefined;
    if(!row)throw new Error("This delivery is no longer available.");
    await tx.execute({sql:"insert into delivery_assignments(id,order_id,rider_id,assigned_by,status) values(?,?,?,?,?)",args:[crypto.randomUUID(),id,rider.id,rider.id,"assigned"]});
    await tx.execute({sql:"update orders set status='assigned',updated_at=CURRENT_TIMESTAMP where id=?",args:[id]});
    await tx.execute({sql:"insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",args:[crypto.randomUUID(),id,"assigned",rider.id,"Delivery partner accepted the order"]});
    await tx.execute({sql:"insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",args:[crypto.randomUUID(),String(row.customer_id),"delivery","Delivery partner assigned",`${String(row.order_no)} has been accepted for delivery.`,JSON.stringify({orderId:id,status:"assigned"})]});
    await tx.commit();await audit(rider.id,"delivery.accepted","order",id);
    return NextResponse.json({ok:true});
  }catch(error){await tx.rollback();return NextResponse.json({error:error instanceof Error?error.message:"Unable to accept this delivery."},{status:409});}
}
