import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {query} from "@/lib/db";

export async function GET(){
  const rider=await currentUser();
  if(!rider||rider.role!=="rider")return NextResponse.json({error:"Delivery Partner access is required."},{status:403});
  try{
    const [profile,active,available,history,today,week]=await Promise.all([
      query("select id,full_name,email,phone,coalesce(rider_available,0) rider_available from users where id=?",[rider.id]),
      query("select da.id assignment_id,da.status assignment_status,da.assigned_at,o.id,o.order_no,o.status,o.total_paise,o.delivery_fee_paise,o.created_at,s.name shop_name,s.address shop_address,s.phone shop_phone,c.full_name customer_name,c.phone customer_phone,a.address_line,a.landmark,(select count(*) from order_items where order_id=o.id) item_count,(select p.image_url from order_items oi left join products p on p.id=oi.product_id where oi.order_id=o.id limit 1) preview_image,(select product_name from order_items where order_id=o.id limit 1) preview_name from delivery_assignments da join orders o on o.id=da.order_id join shops s on s.id=o.shop_id join users c on c.id=o.customer_id join addresses a on a.id=o.address_id where da.rider_id=? and da.status in ('assigned','picked_up') order by da.assigned_at asc",[rider.id]),
      query("select o.id,o.order_no,o.status,o.total_paise,o.delivery_fee_paise,o.created_at,s.name shop_name,s.address shop_address,s.phone shop_phone,c.full_name customer_name,c.phone customer_phone,a.address_line,a.landmark,(select count(*) from order_items where order_id=o.id) item_count,(select p.image_url from order_items oi left join products p on p.id=oi.product_id where oi.order_id=o.id limit 1) preview_image,(select product_name from order_items where order_id=o.id limit 1) preview_name from orders o join shops s on s.id=o.shop_id join users c on c.id=o.customer_id join addresses a on a.id=o.address_id where o.status='ready' and not exists(select 1 from delivery_assignments da where da.order_id=o.id) order by o.created_at asc limit 20"),
      query("select da.id assignment_id,da.delivered_at,o.id,o.order_no,o.total_paise,o.delivery_fee_paise,s.name shop_name,c.full_name customer_name from delivery_assignments da join orders o on o.id=da.order_id join shops s on s.id=o.shop_id join users c on c.id=o.customer_id where da.rider_id=? and da.status='delivered' order by da.delivered_at desc limit 30",[rider.id]),
      query("select count(*) deliveries,coalesce(sum(o.delivery_fee_paise),0) earnings from delivery_assignments da join orders o on o.id=da.order_id where da.rider_id=? and da.status='delivered' and date(da.delivered_at)=date('now')",[rider.id]),
      query("select count(*) deliveries,coalesce(sum(o.delivery_fee_paise),0) earnings from delivery_assignments da join orders o on o.id=da.order_id where da.rider_id=? and da.status='delivered' and date(da.delivered_at)>=date('now','-6 days')",[rider.id]),
    ]);
    return NextResponse.json({profile:profile.rows[0]??null,active:active.rows,available:available.rows,history:history.rows,earnings:{today:today.rows[0],week:week.rows[0]}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to load rider dashboard."},{status:500});}
}
