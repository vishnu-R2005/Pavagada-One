import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

const schema = z.object({ quantity: z.number().int().min(1).max(50) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const p = schema.safeParse(await req.json());
  if (!p.success)
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  const { id } = await params;
  const f = await query(
    "select ci.id,i.quantity available from cart_items ci join carts c on c.id=ci.cart_id join inventory i on i.product_id=ci.product_id where ci.id=? and c.user_id=?",
    [id, u.id]
  );
  const row = f.rows[0] as Record<string, unknown> | undefined;
  if (!row)
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  if (p.data.quantity > Number(row.available))
    return NextResponse.json(
      { error: "Requested quantity is unavailable" },
      { status: 409 }
    );
  await query("update cart_items set quantity=? where id=?", [
    p.data.quantity,
    id,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  const cartRow = (
    await query(
      "select ci.cart_id from cart_items ci join carts c on c.id=ci.cart_id where ci.id=? and c.user_id=?",
      [id, u.id]
    )
  ).rows[0] as Record<string, unknown> | undefined;

  await query(
    "delete from cart_items where id=? and cart_id in (select id from carts where user_id=?)",
    [id, u.id]
  );

  if (cartRow?.cart_id) {
    const remaining = (
      await query("select count(*) count from cart_items where cart_id=?", [
        String(cartRow.cart_id),
      ])
    ).rows[0] as Record<string, unknown> | undefined;
    if (Number(remaining?.count ?? 0) === 0) {
      await query("delete from carts where id=?", [String(cartRow.cart_id)]);
    }
  }
  return NextResponse.json({ ok: true });
}