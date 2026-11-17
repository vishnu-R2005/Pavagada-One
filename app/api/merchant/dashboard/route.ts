import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {query} from "@/lib/db";

export async function GET(){
  const u=await currentUser();
  if(!u||u.role!=="merchant")return NextResponse.json({error:"Forbidden"},{status:403});
  const owner=[u.id];
  const [today,week,month,low,recent,top,statuses]=await Promise.all([
    query("select count(*) orders,coalesce(sum(total_paise),0) revenue from orders where shop_id in(select id from shops where owner_id=?) and date(created_at)=date('now')",owner),
    query("select count(*) orders,coalesce(sum(total_paise),0) revenue from orders where shop_id in(select id from shops where owner_id=?) and date(created_at)>=date('now','-6 days')",owner),
    query("select count(*) orders,coalesce(sum(total_paise),0) revenue from orders where shop_id in(select id from shops where owner_id=?) and date(created_at)>=date('now','start of month')",owner),
    query("select p.id,p.name,i.quantity,i.low_stock_threshold from products p join inventory i on i.product_id=p.id where p.shop_id in(select id from shops where owner_id=?) and i.quantity<=i.low_stock_threshold order by i.quantity asc",owner),
    query("select o.id,o.order_no,o.status,o.total_paise,o.created_at,u.full_name customer_name from orders o join users u on u.id=o.customer_id where o.shop_id in(select id from shops where owner_id=?) order by o.created_at desc limit 8",owner),
    query("select oi.product_name,sum(oi.quantity) units,sum(oi.total_paise) revenue from order_items oi join orders o on o.id=oi.order_id where o.shop_id in(select id from shops where owner_id=?) and o.status!='cancelled' group by oi.product_name order by units desc limit 5",owner),
    query("select status,count(*) count from orders where shop_id in(select id from shops where owner_id=?) group by status",owner),
  ]);
  return NextResponse.json({
    sales:{today:today.rows[0],week:week.rows[0],month:month.rows[0]},
    lowStock:low.rows,
    recentOrders:recent.rows,
    topProducts:top.rows,
    statusCounts:statuses.rows,
  });
}
