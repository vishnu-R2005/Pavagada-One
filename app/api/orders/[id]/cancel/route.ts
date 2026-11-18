import { NextResponse } from "next/server";
import { audit, currentUser } from "@/lib/auth";
import { requireDb } from "@/lib/db";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;

  const tx = await requireDb().transaction("write");
  try {
    const orderRow = (
      await tx.execute({
        sql: "select o.order_no,s.owner_id from orders o join shops s on s.id=o.shop_id where o.id=? and o.customer_id=? and o.status='placed'",
        args: [id, u.id],
      })
    ).rows[0] as unknown as { order_no: string; owner_id: string } | undefined;

    if (!orderRow)
      throw new Error("Only newly placed orders can be cancelled.");

    const result = await tx.execute({
      sql: "update orders set status='cancelled',updated_at=CURRENT_TIMESTAMP where id=? and customer_id=? and status='placed'",
      args: [id, u.id],
    });
    if (Number(result.rowsAffected) !== 1)
      throw new Error("Only newly placed orders can be cancelled.");

    const items = await tx.execute({
      sql: "select product_id,quantity from order_items where order_id=?",
      args: [id],
    });
    for (const x of items.rows) {
      if (x.product_id) {
        await tx.execute({
          sql: "update inventory set quantity=quantity+?,updated_at=CURRENT_TIMESTAMP where product_id=?",
          args: [x.quantity as number, x.product_id as string],
        });
      }
    }

    await tx.execute({
      sql: "update payments set status='cancelled' where order_id=? and status='pending'",
      args: [id],
    });

    await tx.execute({
      sql: "insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",
      args: [
        crypto.randomUUID(),
        id,
        "cancelled",
        u.id,
        "Cancelled by customer",
      ],
    });

    await tx.execute({
      sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
      args: [
        crypto.randomUUID(),
        orderRow.owner_id,
        "order_status",
        "Order cancelled by customer",
        `Order ${orderRow.order_no} was cancelled before acceptance.`,
        JSON.stringify({ orderId: id, status: "cancelled" }),
      ],
    });

    await tx.commit();
    await audit(u.id, "order.cancelled", "order", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    await tx.rollback();
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cancellation failed" },
      { status: 409 }
    );
  }
}