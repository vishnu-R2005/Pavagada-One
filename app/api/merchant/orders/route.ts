import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const u = await currentUser();
  if (!u || u.role !== "merchant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const r = await query(
    `select o.id,o.order_no,o.status,o.total_paise,o.created_at,
            a.address_line,a.landmark,c.full_name customer_name,c.phone customer_phone
     from orders o
     join addresses a on a.id=o.address_id
     join users c on c.id=o.customer_id
     where o.shop_id in (select id from shops where owner_id=?)
     order by o.created_at desc`,
    [u.id]
  );

  const itemsRes = await query(
    `select oi.order_id,oi.product_name,oi.quantity,oi.total_paise,p.unit,p.image_url
     from order_items oi
     join orders o on o.id=oi.order_id
     left join products p on p.id=oi.product_id
     where o.shop_id in (select id from shops where owner_id=?)`,
    [u.id]
  );

  const byOrder = new Map<
    string,
    Array<{
      product_name: string;
      quantity: number;
      total_paise: number;
      unit: string | null;
      image_url: string | null;
    }>
  >();
  for (const row of itemsRes.rows as Array<Record<string, unknown>>) {
    const oid = String(row.order_id);
    const list = byOrder.get(oid) ?? [];
    list.push({
      product_name: String(row.product_name),
      quantity: Number(row.quantity),
      total_paise: Number(row.total_paise),
      unit: row.unit ? String(row.unit) : null,
      image_url: row.image_url ? String(row.image_url) : null,
    });
    byOrder.set(oid, list);
  }

  const orders = (r.rows as Array<Record<string, unknown>>).map((o) => ({
    ...o,
    items: byOrder.get(String(o.id)) ?? [],
  }));

  return NextResponse.json({ orders });
}
