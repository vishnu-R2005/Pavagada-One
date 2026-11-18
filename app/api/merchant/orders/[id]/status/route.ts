import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, audit } from "@/lib/auth";
import { requireDb } from "@/lib/db";

const S = z.object({
  status: z.enum(["accepted", "preparing", "ready", "cancelled"]),
  note: z.string().trim().max(200).optional(),
});

const allowed: Record<string, string[]> = {
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: [],
};

const titles: Record<string, string> = {
  accepted: "Order accepted",
  preparing: "Your order is being prepared",
  ready: "Your order is ready for pickup",
  cancelled: "Order cancelled",
};

export async function PATCH(
  q: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u || u.role !== "merchant")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = S.safeParse(await q.json());
  if (!p.success)
    return NextResponse.json({ error: "Invalid order update" }, { status: 400 });
  const { id } = await params;

  const tx = await requireDb().transaction("write");
  try {
    const order = (
      await tx.execute({
        sql: "select o.id,o.order_no,o.status,o.customer_id,o.payment_status,s.name shop_name from orders o join shops s on s.id=o.shop_id where o.id=? and s.owner_id=?",
        args: [id, u.id],
      })
    ).rows[0] as unknown as
      | {
          id: string;
          order_no: string;
          status: string;
          customer_id: string;
          payment_status: string;
          shop_name: string;
        }
      | undefined;

    if (!order) {
      await tx.rollback();
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!allowed[order.status]?.includes(p.data.status)) {
      await tx.rollback();
      return NextResponse.json(
        { error: "This order cannot be moved to that status." },
        { status: 409 }
      );
    }

    await tx.execute({
      sql: "update orders set status=?,updated_at=CURRENT_TIMESTAMP where id=?",
      args: [p.data.status, id],
    });

    if (p.data.status === "cancelled") {
      const items = await tx.execute({
        sql: "select product_id,quantity from order_items where order_id=?",
        args: [id],
      });
      for (const item of items.rows) {
        if (item.product_id) {
          await tx.execute({
            sql: "update inventory set quantity=quantity+?,updated_at=CURRENT_TIMESTAMP where product_id=?",
            args: [item.quantity as number, item.product_id as string],
          });
        }
      }
      await tx.execute({
        sql: "update delivery_assignments set status='cancelled' where order_id=? and status!='cancelled'",
        args: [id],
      });
      if (order.payment_status === "paid") {
        await tx.execute({
          sql: "update orders set payment_status='refunded' where id=?",
          args: [id],
        });
        await tx.execute({
          sql: "update payments set status='refunded' where order_id=?",
          args: [id],
        });
      } else {
        await tx.execute({
          sql: "update payments set status='cancelled' where order_id=? and status='pending'",
          args: [id],
        });
      }
    }

    if (p.data.status === "ready") {
      const riders = await tx.execute({
        sql: "select id from users where role='rider' and is_active=1 and rider_available=1",
        args: [],
      });
      for (const r of riders.rows) {
        await tx.execute({
          sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
          args: [
            crypto.randomUUID(),
            String(r.id),
            "delivery_available",
            "Order ready for pickup",
            `${order.order_no} at ${order.shop_name} is ready for delivery.`,
            JSON.stringify({ orderId: id, status: "ready" }),
          ],
        });
      }
    }

    await tx.execute({
      sql: "insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",
      args: [crypto.randomUUID(), id, p.data.status, u.id, p.data.note ?? null],
    });

    await tx.execute({
      sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
      args: [
        crypto.randomUUID(),
        order.customer_id,
        "order_status",
        titles[p.data.status],
        p.data.note
          ? `${order.order_no}: ${p.data.note}`
          : `${order.order_no} is ${p.data.status.replaceAll("_", " ")}.`,
        JSON.stringify({ orderId: id, status: p.data.status }),
      ],
    });

    await tx.commit();
    await audit(u.id, "order.status_changed", "order", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    await tx.rollback();
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to update order status",
      },
      { status: 500 }
    );
  }
}
