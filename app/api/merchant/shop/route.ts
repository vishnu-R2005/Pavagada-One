import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, audit } from "@/lib/auth";
import { query } from "@/lib/db";

const imageUrlSchema = z
  .string()
  .trim()
  .max(1_000)
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/images/"),
    "Enter a valid image URL"
  );

const S = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(500),
  phone: z.string().trim().min(8).max(25),
  isOpen: z.boolean(),
  openingHours: z.string().trim().max(120).optional(),
  deliveryAvailable: z.boolean().optional(),
  imageUrl: imageUrlSchema.nullable().optional(),
});

export async function GET() {
  const u = await currentUser();
  if (!u || u.role !== "merchant")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const r = await query("select * from shops where owner_id=?", [u.id]);
  return NextResponse.json({ shop: r.rows[0] ?? null });
}

export async function PUT(q: Request) {
  const u = await currentUser();
  if (!u || u.role !== "merchant")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = S.safeParse(await q.json());
  if (!p.success)
    return NextResponse.json(
      { error: "Enter a valid shop name, phone number, and address." },
      { status: 400 }
    );
  const shop = (
    await query("select id from shops where owner_id=?", [u.id])
  ).rows[0] as unknown as { id: string } | undefined;
  if (!shop)
    return NextResponse.json({ error: "Merchant shop not found" }, { status: 404 });
  await query(
    "update shops set name=?,address=?,phone=?,is_open=?,opening_hours=?,delivery_available=?,image_url=? where id=?",
    [
      p.data.name,
      p.data.address,
      p.data.phone,
      Number(p.data.isOpen),
      p.data.openingHours || null,
      Number(p.data.deliveryAvailable ?? true),
      p.data.imageUrl || null,
      shop.id,
    ]
  );
  await audit(u.id, "shop.updated", "shop", shop.id);
  return NextResponse.json({ ok: true });
}
