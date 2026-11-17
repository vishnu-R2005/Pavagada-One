import {NextResponse} from "next/server";
import {requireRole} from "@/lib/auth";
import {query} from "@/lib/db";

export async function GET(){
  await requireRole("admin");
  const [orders,sales,shops,riders,users,categories,refunds,coupons,settings,report,products]=await Promise.all([
    query("select o.id,o.order_no,o.status,o.total_paise,o.created_at,s.name shop,u.full_name customer from orders o join shops s on s.id=o.shop_id join users u on u.id=o.customer_id order by o.created_at desc limit 100"),
    query("select count(*) order_count,coalesce(sum(total_paise),0) gross_sales from orders where status!='cancelled'"),
    query("select id,name,is_open,is_approved from shops"),
    query("select id,full_name,phone,rider_available from users where role='rider' and is_active=1"),
    query("select id,email,full_name,role,is_active from users"),
    query("select id,name,is_active from categories"),
    query("select id,order_id,reason,status from refund_requests"),
    query("select id,code,discount_type,discount_value,active from coupons"),
    query("select key,value from platform_settings"),
    query("select s.name shop,count(o.id) orders,coalesce(sum(o.total_paise),0) revenue,sum(case when o.status='cancelled' then 1 else 0 end) cancellations from shops s left join orders o on o.shop_id=s.id group by s.id"),
    query("select p.id,p.name,p.image_url,p.is_active,s.name shop from products p join shops s on s.id=p.shop_id order by p.created_at desc limit 100"),
  ]);
  return NextResponse.json({orders:orders.rows,sales:sales.rows[0],shops:shops.rows,riders:riders.rows,users:users.rows,categories:categories.rows,refunds:refunds.rows,coupons:coupons.rows,settings:settings.rows,report:report.rows,products:products.rows});
}
