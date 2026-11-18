import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;

  const order = (
    await query(
      `select o.id,o.order_no,o.status,o.subtotal_paise,o.delivery_fee_paise,o.total_paise,
              o.payment_method,o.payment_status,o.delivery_instructions,o.created_at,
              s.name shop_name,s.phone shop_phone,s.address shop_address,
              a.label address_label,a.address_line,a.landmark,
              r.full_name rider_name,r.phone rider_phone
       from orders o
       join shops s on s.id=o.shop_id
       join addresses a on a.id=o.address_id
       left join delivery_assignments da on da.order_id=o.id and da.status!='cancelled'
       left join users r on r.id=da.rider_id
       where o.id=? and o.customer_id=?`,
      [id, u.id]
    )
  ).rows[0];

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const [items, history] = await Promise.all([
    query(
      "select oi.product_name,oi.unit_price_paise,oi.quantity,oi.total_paise,p.image_url from order_items oi left join products p on p.id=oi.product_id where oi.order_id=?",
      [id]
    ),
    query(
      "select status,note,created_at from order_status_history where order_id=? order by created_at",
      [id]
    ),
  ]);

  return NextResponse.json({
    order,
    items: items.rows,
    history: history.rows,
  });
}
