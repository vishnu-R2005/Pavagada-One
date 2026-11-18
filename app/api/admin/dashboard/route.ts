import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const admin = await currentUser();
  if (!admin)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (admin.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );

  const [
    orders,
    sales,
    shops,
    riders,
    users,
    categories,
    refunds,
    coupons,
    settings,
    report,
    products,
    applications,
    supportCases,
  ] = await Promise.all([
    query(
      `select o.id,o.order_no,o.status,o.total_paise,o.payment_status,o.created_at,
              s.name shop,u.full_name customer,da.rider_id,r.full_name rider_name
       from orders o
       join shops s on s.id=o.shop_id
       join users u on u.id=o.customer_id
       left join delivery_assignments da on da.order_id=o.id and da.status!='cancelled'
       left join users r on r.id=da.rider_id
       order by o.created_at desc limit 100`
    ),
    query(
      "select count(*) order_count,coalesce(sum(total_paise),0) gross_sales from orders where status!='cancelled'"
    ),
    query("select id,name,phone,address,is_open,is_approved from shops order by name"),
    query(
      "select id,full_name,phone,rider_available from users where role='rider' and is_active=1 order by full_name"
    ),
    query("select id,email,full_name,role,is_active from users order by created_at desc"),
    query("select id,name,is_active from categories order by name"),
    query(
      "select rr.id,rr.order_id,o.order_no,u.full_name customer_name,rr.reason,rr.status,rr.created_at from refund_requests rr join orders o on o.id=rr.order_id join users u on u.id=rr.customer_id order by rr.created_at desc"
    ),
    query("select id,code,discount_type,discount_value,active from coupons order by code"),
    query("select key,value from platform_settings"),
    query(
      "select s.name shop,count(o.id) orders,coalesce(sum(case when o.status!='cancelled' then o.total_paise else 0 end),0) revenue,sum(case when o.status='cancelled' then 1 else 0 end) cancellations from shops s left join orders o on o.shop_id=s.id group by s.id"
    ),
    query(
      "select p.id,p.name,p.image_url,p.price_paise,p.is_active,s.name shop,i.quantity from products p join shops s on s.id=p.shop_id join inventory i on i.product_id=p.id order by p.created_at desc limit 100"
    ),
    query(
      "select ma.id,ma.shop_name,ma.phone,ma.address,ma.status,ma.created_at,u.full_name applicant_name,u.email applicant_email from merchant_applications ma join users u on u.id=ma.user_id order by ma.created_at desc"
    ),
    query(
      "select sc.id,sc.subject,sc.detail,sc.status,sc.created_at,u.full_name customer_name,o.order_no from support_cases sc join users u on u.id=sc.customer_id left join orders o on o.id=sc.order_id order by sc.created_at desc"
    ),
  ]);

  return NextResponse.json({
    orders: orders.rows,
    sales: sales.rows[0],
    shops: shops.rows,
    riders: riders.rows,
    users: users.rows,
    categories: categories.rows,
    refunds: refunds.rows,
    coupons: coupons.rows,
    settings: settings.rows,
    report: report.rows,
    products: products.rows,
    applications: applications.rows,
    supportCases: supportCases.rows,
  });
}
