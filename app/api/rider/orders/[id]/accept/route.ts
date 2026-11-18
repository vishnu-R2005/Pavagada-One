import { NextResponse } from "next/server";
import { audit, currentUser } from "@/lib/auth";
import { requireDb } from "@/lib/db";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rider = await currentUser();
  if (!rider || rider.role !== "rider")
    return NextResponse.json(
      { error: "Delivery Partner access is required." },
      { status: 403 }
    );
  const { id } = await params;
  const db = requireDb();
  const tx = await db.transaction("write");
  try {
    const availability = await tx.execute({
      sql: "select rider_available from users where id=? and role='rider'",
      args: [rider.id],
    });
    if (
      !Number(
        (availability.rows[0] as Record<string, unknown> | undefined)
          ?.rider_available
      )
    )
      throw new Error("Go online before accepting an order.");

    const order = await tx.execute({
      sql: "select o.id,o.order_no,o.customer_id,s.owner_id from orders o join shops s on s.id=o.shop_id where o.id=? and o.status='ready' and not exists(select 1 from delivery_assignments where order_id=? and status!='cancelled')",
      args: [id, id],
    });
    const row = order.rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("This delivery is no longer available.");

    await tx.execute({
      sql: "insert into delivery_assignments(id,order_id,rider_id,assigned_by,status) values(?,?,?,?,?) on conflict(order_id) do update set rider_id=excluded.rider_id,assigned_by=excluded.assigned_by,status='assigned',assigned_at=CURRENT_TIMESTAMP",
      args: [crypto.randomUUID(), id, rider.id, rider.id, "assigned"],
    });
    await tx.execute({
      sql: "update orders set status='assigned',updated_at=CURRENT_TIMESTAMP where id=?",
      args: [id],
    });
    await tx.execute({
      sql: "insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",
      args: [
        crypto.randomUUID(),
        id,
        "assigned",
        rider.id,
        `Delivery partner ${rider.fullName} accepted the order`,
      ],
    });
    await tx.execute({
      sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
      args: [
        crypto.randomUUID(),
        String(row.customer_id),
        "delivery",
        "Delivery partner assigned",
        `${String(row.order_no)} has been accepted by ${rider.fullName} for delivery.`,
        JSON.stringify({ orderId: id, status: "assigned" }),
      ],
    });
    await tx.execute({
      sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
      args: [
        crypto.randomUUID(),
        String(row.owner_id),
        "delivery",
        "Rider assigned",
        `${rider.fullName} is on the way to pick up ${String(row.order_no)}.`,
        JSON.stringify({ orderId: id, status: "assigned" }),
      ],
    });
    await tx.commit();
    await audit(rider.id, "delivery.accepted", "order", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    await tx.rollback();
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to accept this delivery.",
      },
      { status: 409 }
    );
  }
}
