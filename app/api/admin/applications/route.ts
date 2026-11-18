import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  note: z.string().max(300).optional(),
});

export async function PATCH(r: Request) {
  const a = await currentUser();
  if (!a) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (a.role !== "admin")
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const parsed = schema.safeParse(await r.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const b = parsed.data;
  await query(
    "update merchant_applications set status=?,admin_note=?,reviewed_at=CURRENT_TIMESTAMP where id=?",
    [b.status, b.note ?? null, b.id]
  );

  if (b.status === "approved") {
    const x = (
      await query(
        "select user_id,shop_name,phone,address from merchant_applications where id=?",
        [b.id]
      )
    ).rows[0] as unknown as
      | { user_id: string; shop_name: string; phone: string; address: string }
      | undefined;

    if (x) {
      await query("update users set role='merchant' where id=?", [x.user_id]);
      const existingShop = await query(
        "select id from shops where owner_id=?",
        [x.user_id]
      );
      if (!existingShop.rows.length) {
        await query(
          "insert into shops(id,owner_id,name,slug,phone,address,is_approved,is_open) values(?,?,?,?,?,?,1,1)",
          [
            crypto.randomUUID(),
            x.user_id,
            x.shop_name,
            `${x.shop_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
            x.phone,
            x.address,
          ]
        );
      } else {
        await query("update shops set is_approved=1 where owner_id=?", [
          x.user_id,
        ]);
      }
      await query(
        "insert into notifications(id,user_id,type,title,body) values(?,?,?,?,?)",
        [
          crypto.randomUUID(),
          x.user_id,
          "merchant_application",
          "Shop application approved",
          `Your shop "${x.shop_name}" is approved and ready to manage.`,
        ]
      );
    }
  }

  await audit(
    a.id,
    `merchant_application.${b.status}`,
    "merchant_application",
    b.id
  );
  return NextResponse.json({ ok: true });
}