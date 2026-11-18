import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const createSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("support"),
    orderId: z.string().optional(),
    subject: z.string().trim().min(3).max(120),
    detail: z.string().trim().min(5).max(800),
  }),
  z.object({
    kind: z.literal("refund"),
    orderId: z.string().min(1),
    reason: z.string().trim().min(5).max(400),
  }),
  z.object({
    kind: z.literal("merchant_apply"),
    shopName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(20),
    address: z.string().trim().min(6).max(300),
  }),
]);

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const [cases, refunds, coupons, applications] = await Promise.all([
    query(
      "select sc.id,sc.subject,sc.detail,sc.status,sc.admin_note,sc.created_at,o.order_no from support_cases sc left join orders o on o.id=sc.order_id where sc.customer_id=? order by sc.created_at desc",
      [u.id]
    ),
    query(
      "select rr.id,rr.order_id,rr.reason,rr.status,rr.admin_note,rr.created_at,o.order_no from refund_requests rr join orders o on o.id=rr.order_id where rr.customer_id=? order by rr.created_at desc",
      [u.id]
    ),
    query(
      "select id,code,discount_type,discount_value from coupons where active=1 order by code"
    ),
    query(
      "select id,shop_name,status,admin_note,created_at from merchant_applications where user_id=? order by created_at desc",
      [u.id]
    ),
  ]);

  return NextResponse.json({
    cases: cases.rows,
    refunds: refunds.rows,
    coupons: coupons.rows,
    applications: applications.rows,
  });
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please complete all required fields." },
      { status: 400 }
    );

  const data = parsed.data;
  if (data.kind === "support") {
    const id = crypto.randomUUID();
    await query(
      "insert into support_cases(id,customer_id,order_id,subject,detail) values(?,?,?,?,?)",
      [id, u.id, data.orderId || null, data.subject, data.detail]
    );
    return NextResponse.json({ id }, { status: 201 });
  }

  if (data.kind === "refund") {
    const order = (
      await query(
        "select id from orders where id=? and customer_id=?",
        [data.orderId, u.id]
      )
    ).rows[0];
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const existing = (
      await query(
        "select id from refund_requests where order_id=? and customer_id=?",
        [data.orderId, u.id]
      )
    ).rows[0];
    if (existing)
      return NextResponse.json(
        { error: "A refund request already exists for this order." },
        { status: 409 }
      );
    const id = crypto.randomUUID();
    await query(
      "insert into refund_requests(id,order_id,customer_id,reason) values(?,?,?,?)",
      [id, data.orderId, u.id, data.reason]
    );
    return NextResponse.json({ id }, { status: 201 });
  }

  const id = crypto.randomUUID();
  await query(
    "insert into merchant_applications(id,user_id,shop_name,phone,address) values(?,?,?,?,?)",
    [id, u.id, data.shopName, data.phone, data.address]
  );
  return NextResponse.json({ id }, { status: 201 });
}
