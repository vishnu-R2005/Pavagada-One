import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  DELIVERY_FEE_PAISE,
  evaluateCouponDiscount,
  FREE_DELIVERY_THRESHOLD_PAISE,
} from "@/lib/customer-ui";

export const dynamic = "force-dynamic";

const schema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

async function getDeliverySettings() {
  const rows = (
    await query(
      "select key,value from platform_settings where key in ('delivery_fee_paise','free_delivery_threshold_paise')"
    )
  ).rows as unknown as Array<{ key: string; value: string }>;
  const map = new Map(rows.map((r) => [r.key, Number(r.value)]));
  const feeRaw = map.get("delivery_fee_paise");
  const threshRaw = map.get("free_delivery_threshold_paise");
  return {
    deliveryFeePaise:
      feeRaw !== undefined && Number.isFinite(feeRaw)
        ? Math.max(0, feeRaw)
        : DELIVERY_FEE_PAISE,
    freeDeliveryThresholdPaise:
      threshRaw !== undefined && Number.isFinite(threshRaw)
        ? Math.max(0, threshRaw)
        : FREE_DELIVERY_THRESHOLD_PAISE,
  };
}

export async function GET(req: Request) {
  const u = await currentUser();
  const url = new URL(req.url);
  if (!u) {
    const optional = url.searchParams.get("optional") === "1";
    if (optional) {
      return NextResponse.json({ items: [], authenticated: false });
    }
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const [r, settings] = await Promise.all([
    query(
      "select c.id cart_id,c.shop_id,s.name shop_name,ci.id item_id,ci.quantity,p.id product_id,p.name,p.price_paise,p.image_url,p.unit,i.quantity available from carts c join shops s on s.id=c.shop_id left join cart_items ci on ci.cart_id=c.id left join products p on p.id=ci.product_id left join inventory i on i.product_id=p.id where c.user_id=?",
      [u.id]
    ),
    getDeliverySettings(),
  ]);

  const items = r.rows.filter((x) => x.item_id);
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.price_paise || 0) * Number(item.quantity || 0),
    0
  );

  let coupon:
    | {
        valid: boolean;
        code: string;
        discountPaise: number;
        error?: string;
      }
    | undefined;
  const rawCoupon = url.searchParams.get("coupon")?.trim().toUpperCase();
  if (rawCoupon) {
    const row = (
      await query(
        "select code,discount_type,discount_value from coupons where upper(code)=? and active=1",
        [rawCoupon]
      )
    ).rows[0] as unknown as
      | { code: string; discount_type: string; discount_value: number }
      | undefined;
    if (row) {
      coupon = {
        valid: true,
        code: row.code,
        discountPaise: evaluateCouponDiscount(subtotal, row),
      };
    } else {
      coupon = {
        valid: false,
        code: rawCoupon,
        discountPaise: 0,
        error: `Coupon "${rawCoupon}" is invalid or expired.`,
      };
    }
  }

  return NextResponse.json({ items, settings, coupon });
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const p = schema.safeParse(await req.json());
  if (!p.success)
    return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });

  const product = (
    await query(
      "select p.id,p.shop_id,i.quantity from products p join inventory i on i.product_id=p.id join shops s on s.id=p.shop_id where p.id=? and p.is_active=1 and s.is_approved=1 and s.is_open=1",
      [p.data.productId]
    )
  ).rows[0] as Record<string, unknown> | undefined;

  if (!product || Number(product.quantity) < p.data.quantity) {
    return NextResponse.json(
      { error: "Product is unavailable in that quantity" },
      { status: 409 }
    );
  }

  let cart = (
    await query("select id,shop_id from carts where user_id=?", [u.id])
  ).rows[0] as Record<string, unknown> | undefined;

  if (cart && cart.shop_id !== product.shop_id) {
    const itemCountRow = (
      await query("select count(*) count from cart_items where cart_id=?", [
        String(cart.id),
      ])
    ).rows[0] as Record<string, unknown> | undefined;
    if (Number(itemCountRow?.count ?? 0) === 0) {
      await query("delete from carts where id=?", [String(cart.id)]);
      cart = undefined;
    } else {
      return NextResponse.json(
        { error: "Your cart can contain products from one shop only." },
        { status: 409 }
      );
    }
  }

  if (!cart) {
    cart = { id: crypto.randomUUID(), shop_id: product.shop_id };
    await query("insert into carts(id,user_id,shop_id) values(?,?,?)", [
      String(cart.id),
      u.id,
      String(cart.shop_id),
    ]);
  }

  const found = (
    await query(
      "select id,quantity from cart_items where cart_id=? and product_id=?",
      [String(cart.id), p.data.productId]
    )
  ).rows[0] as Record<string, unknown> | undefined;

  if (found) {
    const nextQty = Number(found.quantity) + p.data.quantity;
    if (nextQty > Number(product.quantity)) {
      return NextResponse.json(
        { error: "Only " + String(product.quantity) + " available in stock." },
        { status: 409 }
      );
    }
    await query("update cart_items set quantity=? where id=?", [
      nextQty,
      String(found.id),
    ]);
  } else {
    await query(
      "insert into cart_items(id,cart_id,product_id,quantity) values(?,?,?,?)",
      [crypto.randomUUID(), String(cart.id), p.data.productId, p.data.quantity]
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  await query("delete from carts where user_id=?", [u.id]);
  return NextResponse.json({ ok: true });
}
