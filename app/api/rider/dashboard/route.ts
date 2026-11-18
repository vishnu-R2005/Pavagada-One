import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rider = await currentUser();
  if (!rider || rider.role !== "rider")
    return NextResponse.json(
      { error: "Delivery Partner access is required." },
      { status: 403 }
    );
  try {
    const [profile, active, available, history, today, week, allTime, codToday, cancelled] =
      await Promise.all([
        query(
          "select id,full_name,email,phone,coalesce(rider_available,0) rider_available,created_at from users where id=?",
          [rider.id]
        ),
        query(
          `select da.id assignment_id,da.status assignment_status,da.assigned_at,
                  o.id,o.order_no,o.status,o.total_paise,o.delivery_fee_paise,o.payment_method,o.payment_status,o.delivery_instructions,o.created_at,
                  s.name shop_name,s.address shop_address,s.phone shop_phone,s.image_url shop_image,
                  c.full_name customer_name,c.phone customer_phone,
                  a.address_line,a.landmark,
                  (select count(*) from order_items where order_id=o.id) item_count,
                  (select p.image_url from order_items oi left join products p on p.id=oi.product_id where oi.order_id=o.id limit 1) preview_image,
                  (select product_name from order_items where order_id=o.id limit 1) preview_name
           from delivery_assignments da
           join orders o on o.id=da.order_id
           join shops s on s.id=o.shop_id
           join users c on c.id=o.customer_id
           join addresses a on a.id=o.address_id
           where da.rider_id=? and da.status in ('assigned','picked_up')
           order by da.assigned_at asc`,
          [rider.id]
        ),
        query(
          `select o.id,o.order_no,o.status,o.total_paise,o.delivery_fee_paise,o.payment_method,o.payment_status,o.delivery_instructions,o.created_at,
                  s.name shop_name,s.address shop_address,s.phone shop_phone,s.image_url shop_image,
                  c.full_name customer_name,c.phone customer_phone,
                  a.address_line,a.landmark,
                  (select count(*) from order_items where order_id=o.id) item_count,
                  (select p.image_url from order_items oi left join products p on p.id=oi.product_id where oi.order_id=o.id limit 1) preview_image,
                  (select product_name from order_items where order_id=o.id limit 1) preview_name
           from orders o
           join shops s on s.id=o.shop_id
           join users c on c.id=o.customer_id
           join addresses a on a.id=o.address_id
           where o.status='ready' and not exists(select 1 from delivery_assignments da where da.order_id=o.id and da.status!='cancelled')
           order by o.created_at asc limit 20`
        ),
        query(
          `select da.id assignment_id,da.status assignment_status,da.delivered_at,
                  o.id,o.order_no,o.status,o.total_paise,o.delivery_fee_paise,o.payment_method,o.payment_status,o.created_at,
                  s.name shop_name,s.address shop_address,s.phone shop_phone,s.image_url shop_image,
                  c.full_name customer_name,c.phone customer_phone,
                  a.address_line,a.landmark,
                  (select count(*) from order_items where order_id=o.id) item_count
           from delivery_assignments da
           join orders o on o.id=da.order_id
           join shops s on s.id=o.shop_id
           join users c on c.id=o.customer_id
           join addresses a on a.id=o.address_id
           where da.rider_id=? and da.status='delivered'
           order by da.delivered_at desc limit 40`,
          [rider.id]
        ),
        query(
          "select count(*) deliveries,coalesce(sum(o.delivery_fee_paise),0) earnings from delivery_assignments da join orders o on o.id=da.order_id where da.rider_id=? and da.status='delivered' and date(da.delivered_at)=date('now')",
          [rider.id]
        ),
        query(
          "select count(*) deliveries,coalesce(sum(o.delivery_fee_paise),0) earnings from delivery_assignments da join orders o on o.id=da.order_id where da.rider_id=? and da.status='delivered' and date(da.delivered_at)>=date('now','-6 days')",
          [rider.id]
        ),
        query(
          "select count(*) deliveries,coalesce(sum(o.delivery_fee_paise),0) earnings from delivery_assignments da join orders o on o.id=da.order_id where da.rider_id=? and da.status='delivered'",
          [rider.id]
        ),
        query(
          "select coalesce(sum(o.total_paise),0) cod_collected from delivery_assignments da join orders o on o.id=da.order_id where da.rider_id=? and da.status='delivered' and o.payment_method='cash_on_delivery' and date(da.delivered_at)=date('now')",
          [rider.id]
        ),
        query(
          "select count(*) cancelled from delivery_assignments where rider_id=? and status='cancelled'",
          [rider.id]
        ),
      ]);

    // Fetch batched item previews for active + available orders
    const orderIds = [...active.rows, ...available.rows].map((row) =>
      String((row as Record<string, unknown>).id)
    );
    const itemsByOrder = new Map<
      string,
      Array<{ product_name: string; quantity: number; image_url: string | null }>
    >();

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => "?").join(",");
      const itemRows = await query(
        `select oi.order_id,oi.product_name,oi.quantity,p.image_url
         from order_items oi
         left join products p on p.id=oi.product_id
         where oi.order_id in (${placeholders})`,
        orderIds
      );
      for (const r of itemRows.rows) {
        const rec = r as Record<string, unknown>;
        const oid = String(rec.order_id);
        const list = itemsByOrder.get(oid) ?? [];
        if (list.length < 4) {
          list.push({
            product_name: String(rec.product_name || ""),
            quantity: Number(rec.quantity) || 1,
            image_url: rec.image_url ? String(rec.image_url) : null,
          });
        }
        itemsByOrder.set(oid, list);
      }
    }

    const attachPreviews = (rows: typeof active.rows) =>
      rows.map((row) => {
        const rec = row as Record<string, unknown>;
        return {
          ...rec,
          items_preview: itemsByOrder.get(String(rec.id)) ?? [],
        };
      });

    return NextResponse.json(
      {
        profile: profile.rows[0] ?? null,
        active: attachPreviews(active.rows),
        available: attachPreviews(available.rows),
        history: history.rows,
        earnings: {
          today: {
            ...(today.rows[0] as Record<string, unknown>),
            cod_collected: Number(
              (codToday.rows[0] as Record<string, unknown> | undefined)
                ?.cod_collected ?? 0
            ),
          },
          week: week.rows[0],
          allTime: allTime.rows[0],
        },
        stats: {
          cancelled: Number(
            (cancelled.rows[0] as Record<string, unknown> | undefined)
              ?.cancelled ?? 0
          ),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load rider dashboard.",
      },
      { status: 500 }
    );
  }
}
