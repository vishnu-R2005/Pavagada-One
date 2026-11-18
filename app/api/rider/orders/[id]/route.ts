import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rider = await currentUser();
  if (!rider || rider.role !== "rider") {
    return NextResponse.json(
      { error: "Delivery Partner access is required." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const orderRes = await query(
    `select o.id,o.order_no,o.status,o.subtotal_paise,o.delivery_fee_paise,o.total_paise,
            o.payment_method,o.payment_status,o.delivery_instructions,o.created_at,
            s.name shop_name,s.address shop_address,s.phone shop_phone,s.image_url shop_image,
            c.full_name customer_name,c.phone customer_phone,
            a.label address_label,a.address_line,a.landmark,
            da.id assignment_id,da.status assignment_status,da.assigned_at,da.delivered_at
     from orders o
     join shops s on s.id=o.shop_id
     join users c on c.id=o.customer_id
     join addresses a on a.id=o.address_id
     left join delivery_assignments da on da.order_id=o.id and da.rider_id=? and da.status!='cancelled'
     where o.id=?
       and (
         da.rider_id=?
         or (
           o.status='ready'
           and not exists(select 1 from delivery_assignments d2 where d2.order_id=o.id and d2.status!='cancelled')
         )
       )`,
    [rider.id, id, rider.id]
  );

  const order = orderRes.rows[0];
  if (!order) {
    return NextResponse.json(
      { error: "Delivery order not found or no longer available." },
      { status: 404 }
    );
  }

  const itemsRes = await query(
    `select oi.id,oi.product_name,oi.unit_price_paise,oi.quantity,oi.total_paise,p.image_url,p.unit
     from order_items oi
     left join products p on p.id=oi.product_id
     where oi.order_id=?
     order by oi.product_name asc`,
    [id]
  );

  return NextResponse.json({
    order,
    items: itemsRes.rows,
  });
}
