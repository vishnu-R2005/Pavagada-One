import {NextResponse} from "next/server";
import {z} from "zod";
import {audit,currentUser} from "@/lib/auth";
import {query} from "@/lib/db";

const schema=z.object({available:z.boolean()});
export async function PATCH(request:Request){
  const rider=await currentUser();
  if(!rider||rider.role!=="rider")return NextResponse.json({error:"Delivery Partner access is required."},{status:403});
  const body=schema.safeParse(await request.json());
  if(!body.success)return NextResponse.json({error:"Invalid availability status."},{status:400});
  await query("update users set rider_available=? where id=? and role='rider'",[Number(body.data.available),rider.id]);
  await audit(rider.id,body.data.available?"rider.online":"rider.offline","user",rider.id);
  return NextResponse.json({ok:true});
}
