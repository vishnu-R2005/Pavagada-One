import { NextResponse } from "next/server";
import { currentUser, audit } from "@/lib/auth";
import { requireDb, query } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import {
  DELIVERY_FEE_PAISE,
  evaluateCouponDiscount,
  FREE_DELIVERY_THRESHOLD_PAISE,
} from "@/lib/customer-ui";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const p = checkoutSchema.safeParse(await req.json());
  if (!p.success)
    return NextResponse.json(
      { error: "Invalid checkout details" },
      { status: 400 }
    );

  try {
    const address = await query(
      "select id from addresses where id=? and user_id=?",
      [p.data.addressId, user.id]
    );
    if (!address.rows[0])
      return NextResponse.json(
        { error: "Delivery address not found" },
        { status: 404 }
      );

    const items = (
      await query(
        `select c.id cart_id,c.shop_id,s.name shop_name,s.owner_id,s.is_open,s.is_approved,s.delivery_available,
                ci.product_id,ci.quantity,p.name,p.price_paise,p.is_active
         from carts c
         join shops s on s.id=c.shop_id
         join cart_items ci on ci.cart_id=c.id
         join products p on p.id=ci.product_id
         where c.user_id=?`,
        [user.id]
      )
    ).rows as unknown as Array<{
      cart_id: string;
      shop_id: string;
      shop_name: string;
      owner_id: string;
      is_open: number;
      is_approved: number;
      delivery_available: number;
      product_id: string;
      quantity: number;
      name: string;
      price_paise: number;
      is_active: number;
    }>;

    if (!items.length)
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );

    const first = items[0];
    if (!first.is_approved || !first.is_open) {
      return NextResponse.json(
        { error: `${first.shop_name} is currently closed and not accepting orders.` },
        { status: 409 }
      );
    }
    if (!first.delivery_available) {
      return NextResponse.json(
        { error: `${first.shop_name} has temporarily paused delivery.` },
        { status: 409 }
      );
    }
    const inactiveItem = items.find((i) => !i.is_active);
    if (inactiveItem) {
      return NextResponse.json(
        { error: `${inactiveItem.name} is no longer available.` },
        { status: 409 }
      );
    }

    const subtotal = items.reduce(
      (n, x) => n + Number(x.price_paise) * Number(x.quantity),
      0
    );

    let discount = 0;
    let appliedCoupon: string | null = null;
    if (p.data.couponCode) {
      const code = p.data.couponCode.trim().toUpperCase();
      const couponRow = (
        await query(
          "select code,discount_type,discount_value from coupons where upper(code)=? and active=1",
          [code]
        )
      ).rows[0] as unknown as
        | { code: string; discount_type: string; discount_value: number }
        | undefined;
      if (!couponRow) {
        return NextResponse.json(
          { error: `Coupon "${code}" is invalid or expired.` },
          { status: 400 }
        );
      }
      appliedCoupon = couponRow.code;
      discount = evaluateCouponDiscount(subtotal, couponRow);
    }

    const settingsRows = (
      await query(
        "select key,value from platform_settings where key in ('delivery_fee_paise','free_delivery_threshold_paise')"
      )
    ).rows as unknown as Array<{ key: string; value: string }>;
    const settingsMap = new Map(settingsRows.map((r) => [r.key, Number(r.value)]));
    const feeSetting = settingsMap.get("delivery_fee_paise");
    const threshSetting = settingsMap.get("free_delivery_threshold_paise");
    const deliveryFeePaise =
      feeSetting !== undefined && Number.isFinite(feeSetting)
        ? Math.max(0, feeSetting)
        : DELIVERY_FEE_PAISE;
    const freeThreshold =
      threshSetting !== undefined && Number.isFinite(threshSetting)
        ? Math.max(0, threshSetting)
        : FREE_DELIVERY_THRESHOLD_PAISE;

    const fee = subtotal >= freeThreshold ? 0 : deliveryFeePaise;
    const total = Math.max(0, subtotal - discount) + fee;
    const orderId = crypto.randomUUID();
    const orderNo = `PO-${Date.now().toString().slice(-6)}${crypto.randomUUID().slice(0, 2).toUpperCase()}`;

    const tx = await requireDb().transaction("write");
    try {
      for (const x of items) {
        const u = await tx.execute({
          sql: "update inventory set quantity=quantity-?,updated_at=CURRENT_TIMESTAMP where product_id=? and quantity>=?",
          args: [x.quantity, x.product_id, x.quantity],
        });
        if (Number(u.rowsAffected) !== 1)
          throw new Error(`${x.name} is no longer available in that quantity`);
      }

      const noteWithCoupon = appliedCoupon
        ? [p.data.deliveryInstructions?.trim(), `Coupon applied: ${appliedCoupon}`]
            .filter(Boolean)
            .join(" · ")
        : p.data.deliveryInstructions?.trim() || null;

      await tx.execute({
        sql: "insert into orders(id,order_no,customer_id,shop_id,address_id,subtotal_paise,delivery_fee_paise,total_paise,payment_method,payment_status,delivery_instructions) values(?,?,?,?,?,?,?,?,?,?,?)",
        args: [
          orderId,
          orderNo,
          user.id,
          first.shop_id,
          p.data.addressId,
          subtotal,
          fee,
          total,
          p.data.paymentMethod,
          "pending",
          noteWithCoupon,
        ],
      });

      for (const x of items) {
        await tx.execute({
          sql: "insert into order_items(id,order_id,product_id,product_name,unit_price_paise,quantity,total_paise) values(?,?,?,?,?,?,?)",
          args: [
            crypto.randomUUID(),
            orderId,
            x.product_id,
            x.name,
            x.price_paise,
            x.quantity,
            Number(x.price_paise) * Number(x.quantity),
          ],
        });
      }

      await tx.execute({
        sql: "insert into order_status_history(id,order_id,status,changed_by,note) values(?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          orderId,
          "placed",
          user.id,
          "Order placed by customer",
        ],
      });

      await tx.execute({
        sql: "insert into payments(id,order_id,provider,amount_paise,status) values(?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          orderId,
          p.data.paymentMethod === "online"
            ? "pending_gateway"
            : "cash_on_delivery",
          total,
          "pending",
        ],
      });

      await tx.execute({
        sql: "delete from cart_items where cart_id=?",
        args: [first.cart_id],
      });
      await tx.execute({
        sql: "delete from carts where id=?",
        args: [first.cart_id],
      });

      await tx.execute({
        sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          user.id,
          "order_status",
          "Order placed",
          `Your order ${orderNo} has been sent to ${first.shop_name}.`,
          JSON.stringify({ orderId, status: "placed" }),
        ],
      });

      await tx.execute({
        sql: "insert into notifications(id,user_id,type,title,body,data_json) values(?,?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          first.owner_id,
          "new_order",
          "New order received",
          `Order ${orderNo} from ${user.fullName} (₹${(total / 100).toFixed(0)}).`,
          JSON.stringify({ orderId, status: "placed" }),
        ],
      });

      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

    await audit(user.id, "order.created", "order", orderId);
    return NextResponse.json(
      { orderId, orderNo, totalPaise: total, discountPaise: discount },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 409 }
    );
  }
}