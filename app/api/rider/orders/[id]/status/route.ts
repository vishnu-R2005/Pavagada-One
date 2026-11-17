import {NextResponse} from "next/server";
import {z} from "zod";
import {audit,currentUser} from "@/lib/auth";
import {requireDb} from "@/lib/db";

const schema=z.object({status:z.enum(["picked_up","delivered"])});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const rider=await currentUser();
  if(!rider||rider.role!=="rider")return NextResponse.json({error:"Delivery Partner access is required."},{status:403});
  const body=schema.safeParse(await request.json());
  if(!body.success)return NextResponse.json({error:"Invalid delivery update."},{status:400});
  const {id}=await params;const db=requireDb();const tx=await db.transaction("write");
  try{
    const assignment=await tx.execute({sql:"select da.status,o.order_no,o.customer_id from delivery_assignments da join orders o on o.id=da.order_id where da.order_id=? and da.rider_id=?",args:[id,rider.id]});
    const row=assignment.rows[0] as Record<string,unknown>|undefined;
    if(!row)throw new Error("This delivery is not assigned to you.");
    if(body.data.status==="picked_up"&&row.status!=="assigned")throw new Error("Confirm pickup only after accepting the delivery.");
    if(body.data.status==="delivered"&&row.status!=="picked_up")throw new Error("Confirm pickup before marking delivery complete.");
    const orderStatus=body.data.status==="picked_up"?"out_for_delivery":"delivered";
    const assignmentStatus=body.data.status==="picked_up"?"picked_up":"delivered";
    await tx.execute({sql:"update delivery_assignments set status=?,delivered_at=case when ?='delivered' then CURRENT_TIMESTAMP else delivered_at end where order_id=? and rider_id=?",args:[assignmentStatus,assignmentStatus,id,rider.id]});
    await tx.execute({sql:"update orders set status=?,updated_at=CURRENT_TIMESTAMP where id=?",args:[orderStatus,id]});
    await tx.execute({sql:"insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",args:[crypto.randomUUID(),id,orderStatus,rider.id,body.data.status==="picked_up"?"Delivery partner picked up the order":"Order delivered to customer"]});
    const title=body.data.status==="picked_up"?"Order picked up":"Order delivered";const message=body.data.status==="picked_up"?`${String(row.order_no)} is on the way.`:`${String(row.order_no)} was delivered successfully.`;
    await tx.execute({sql:"insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",args:[crypto.randomUUID(),String(row.customer_id),"delivery",title,message,JSON.stringify({orderId:id,status:orderStatus})]});
    await tx.commit();await audit(rider.id,`delivery.${body.data.status}`,"order",id);
    return NextResponse.json({ok:true});
  }catch(error){await tx.rollback();return NextResponse.json({error:error instanceof Error?error.message:"Unable to update the delivery."},{status:409});}
}
