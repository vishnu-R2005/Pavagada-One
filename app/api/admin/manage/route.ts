import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, currentUser } from "@/lib/auth";
import { query, requireDb } from "@/lib/db";

const S = z.object({
  kind: z.enum([
    "shop",
    "user",
    "order",
    "rider",
    "refund",
    "setting",
    "coupon",
    "category",
    "delivery",
    "support",
    "product",
  ]),
  id: z.string().optional(),
  action: z.string(),
  value: z.unknown().optional(),
});

export async function POST(req: Request) {
  const a = await currentUser();
  if (!a) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (a.role !== "admin")
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const p = S.safeParse(await req.json());
  if (!p.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const id = p.data.id ?? "";

  if (p.data.kind === "shop") {
    if (p.data.action === "approve") {
      await query("update shops set is_approved=1,is_open=1 where id=?", [id]);
    } else if (p.data.action === "suspend") {
      await query("update shops set is_approved=0,is_open=0 where id=?", [id]);
    } else if (p.data.action === "open") {
      await query("update shops set is_open=1 where id=?", [id]);
    } else {
      await query("update shops set is_open=0 where id=?", [id]);
    }
  } else if (p.data.kind === "user") {
    const role = String(p.data.value);
    if (!["customer", "merchant", "rider", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    await query(
      "update users set role=?,updated_at=CURRENT_TIMESTAMP where id=?",
      [role, id]
    );
  } else if (p.data.kind === "order") {
    const validStatuses = [
      "placed",
      "accepted",
      "preparing",
      "ready",
      "assigned",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(p.data.action)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    const tx = await requireDb().transaction("write");
    try {
      const ord = (
        await tx.execute({
          sql: "select id,order_no,status,customer_id,payment_method,payment_status from orders where id=?",
          args: [id],
        })
      ).rows[0] as unknown as
        | {
            id: string;
            order_no: string;
            status: string;
            customer_id: string;
            payment_method: string;
            payment_status: string;
          }
        | undefined;
      if (!ord) throw new Error("Order not found");

      if (p.data.action === "cancelled" && ord.status !== "cancelled") {
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
        if (ord.payment_status === "paid") {
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

      if (p.data.action === "delivered") {
        await tx.execute({
          sql: "update delivery_assignments set status='delivered',delivered_at=coalesce(delivered_at,CURRENT_TIMESTAMP) where order_id=? and status!='cancelled'",
          args: [id],
        });
        if (ord.payment_method === "cash_on_delivery") {
          await tx.execute({
            sql: "update orders set payment_status='paid' where id=?",
            args: [id],
          });
          await tx.execute({
            sql: "update payments set status='paid' where order_id=?",
            args: [id],
          });
        }
      }

      await tx.execute({
        sql: "update orders set status=?,updated_at=CURRENT_TIMESTAMP where id=?",
        args: [p.data.action, id],
      });
      await tx.execute({
        sql: "insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          id,
          p.data.action,
          a.id,
          "Status updated by operations admin",
        ],
      });
      await tx.execute({
        sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          ord.customer_id,
          "order_status",
          "Order status updated",
          `${ord.order_no} is now ${p.data.action.replaceAll("_", " ")}.`,
          JSON.stringify({ orderId: id, status: p.data.action }),
        ],
      });
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Order update failed" },
        { status: 400 }
      );
    }
  } else if (p.data.kind === "rider") {
    await query(
      "update users set rider_available=? where id=? and role='rider'",
      [Number(p.data.action === "available"), id]
    );
  } else if (p.data.kind === "delivery") {
    const riderId = String(p.data.value ?? "");
    if (!riderId) {
      return NextResponse.json({ error: "Select a rider" }, { status: 400 });
    }
    const tx = await requireDb().transaction("write");
    try {
      const ord = (
        await tx.execute({
          sql: "select id,order_no,status,customer_id from orders where id=?",
          args: [id],
        })
      ).rows[0] as unknown as
        | { id: string; order_no: string; status: string; customer_id: string }
        | undefined;
      if (!ord) throw new Error("Order not found");
      if (ord.status === "delivered" || ord.status === "cancelled") {
        throw new Error(`Cannot assign a rider to a ${ord.status} order.`);
      }

      await tx.execute({
        sql: "insert into delivery_assignments(id,order_id,rider_id,assigned_by,status) values(?,?,?,?,?) on conflict(order_id) do update set rider_id=excluded.rider_id,assigned_by=excluded.assigned_by,status='assigned',assigned_at=CURRENT_TIMESTAMP,delivered_at=NULL",
        args: [crypto.randomUUID(), id, riderId, a.id, "assigned"],
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
          a.id,
          "Rider assigned by operations admin",
        ],
      });
      await tx.execute({
        sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          ord.customer_id,
          "delivery",
          "Delivery partner assigned",
          `A delivery partner has been assigned to ${ord.order_no}.`,
          JSON.stringify({ orderId: id, status: "assigned" }),
        ],
      });
      await tx.execute({
        sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          riderId,
          "delivery",
          "New delivery assigned",
          `You have been assigned order ${ord.order_no}.`,
          JSON.stringify({ orderId: id, status: "assigned" }),
        ],
      });
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Dispatch failed" },
        { status: 400 }
      );
    }
  } else if (p.data.kind === "refund") {
    const reqRow = (
      await query(
        "select rr.order_id,rr.customer_id,o.order_no from refund_requests rr join orders o on o.id=rr.order_id where rr.id=?",
        [id]
      )
    ).rows[0] as unknown as
      | { order_id: string; customer_id: string; order_no: string }
      | undefined;

    await query(
      "update refund_requests set status=?,admin_note=? where id=?",
      [p.data.action, String(p.data.value ?? ""), id]
    );
    if (reqRow) {
      if (p.data.action === "approved") {
        await query("update orders set payment_status='refunded' where id=?", [
          reqRow.order_id,
        ]);
        await query("update payments set status='refunded' where order_id=?", [
          reqRow.order_id,
        ]);
      }
      await query(
        "insert into notifications(id,user_id,type,title,body) values(?,?,?,?,?)",
        [
          crypto.randomUUID(),
          reqRow.customer_id,
          "refund",
          `Refund ${p.data.action}`,
          `Your refund request for ${reqRow.order_no} was ${p.data.action}.`,
        ]
      );
    }
  } else if (p.data.kind === "support") {
    await query("update support_cases set status=?,admin_note=? where id=?", [
      p.data.action,
      String(p.data.value ?? ""),
      id,
    ]);
  } else if (p.data.kind === "product") {
    await query("update products set is_active=? where id=?", [
      Number(p.data.action === "activate"),
      id,
    ]);
  } else if (p.data.kind === "setting") {
    await query(
      "insert into platform_settings(key,value) values(?,?) on conflict(key) do update set value=excluded.value,updated_at=CURRENT_TIMESTAMP",
      [id, String(p.data.value ?? "")]
    );
  } else if (p.data.kind === "coupon") {
    if (p.data.action === "toggle") {
      await query("update coupons set active=case when active=1 then 0 else 1 end where id=?", [id]);
    } else {
      await query(
        "insert into coupons(id,code,discount_type,discount_value) values(?,?,?,?)",
        [crypto.randomUUID(), id.toUpperCase(), p.data.action, Number(p.data.value)]
      );
    }
  } else if (p.data.kind === "category") {
    const name = p.data.action.trim();
    if (!name)
      return NextResponse.json({ error: "Enter a category name" }, { status: 400 });
    await query("insert or ignore into categories(id,name) values(?,?)", [
      crypto.randomUUID(),
      name,
    ]);
  }

  await audit(a.id, `admin.${p.data.kind}.${p.data.action}`, p.data.kind, id);
  return NextResponse.json({ ok: true });
}