"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Bike,
  Check,
  HelpCircle,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";
import { CustomerHeader } from "@/components/customer-nav";
import {
  PavagadaMap,
  resolveAreaCoordinates,
} from "@/components/pavagada-map";
import { ProductImage } from "@/components/product-image";
import { apiFetch } from "@/lib/client-session";
import {
  formatRupees,
  formatUtcDateTime,
  getOrderTimelineIndex,
  ORDER_STEPS,
} from "@/lib/customer-ui";

export default function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [orderId, setOrderId] = useState("");
  const [data, setData] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadOrder = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/orders/${id}`);
    const body = await res
      .json()
      .catch(() => ({ error: "Unable to load order." }));
    setData(body);
  }, []);

  useEffect(() => {
    params.then((value) => {
      setOrderId(value.id);
      void loadOrder(value.id);
    });
  }, [params, loadOrder]);

  useEffect(() => {
    if (!orderId || !data?.order) return;
    if (["delivered", "cancelled"].includes(data.order.status)) return;
    const timer = setInterval(() => {
      void loadOrder(orderId);
    }, 15000);
    return () => clearInterval(timer);
  }, [orderId, data?.order?.status, loadOrder]);

  async function cancelOrder() {
    if (!orderId) return;
    setBusy(true);
    const res = await apiFetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setNotice(body.error || "Unable to cancel order.");
      return;
    }
    setNotice("Order cancelled and stock restored.");
    await loadOrder(orderId);
  }

  async function submitHelp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orderId) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const reason = String(form.get("reason") || "");
    const payload =
      data?.order?.status === "delivered"
        ? { kind: "refund", orderId, reason }
        : {
            kind: "support",
            subject: `Help with ${data?.order?.order_no}`,
            detail: reason,
          };

    const res = await apiFetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setNotice(body.error || "Unable to submit request.");
      return;
    }
    setShowHelp(false);
    setNotice("Your request has been sent to Pavagada One support.");
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-stone-900">
        <CustomerHeader title="Order Tracking" backHref="/customer/orders" />
        <main className="grid min-h-[60vh] place-items-center text-sm text-stone-500">
          Loading order…
        </main>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-stone-900">
        <CustomerHeader title="Order Details" backHref="/customer/orders" />
        <main className="grid min-h-[60vh] place-items-center px-5 text-center text-sm text-rose-700">
          {data.error}
        </main>
      </div>
    );
  }

  const order = data.order;
  const history = data.history ?? [];
  const current = getOrderTimelineIndex(order.status);
  const cancelEntry = history.find((h: any) => h.status === "cancelled");
  const statusDisplay = order.status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (v: string) => v.toUpperCase());

  const heroTitle =
    order.status === "out_for_delivery"
      ? "Your order is on the way!"
      : order.status === "delivered"
        ? "Delivered to your doorstep!"
        : order.status === "ready"
          ? "Packed & awaiting rider pickup"
          : "Your order is being prepared";

  const heroEta =
    order.status === "out_for_delivery"
      ? "Arriving in 10 minutes"
      : order.status === "delivered"
        ? "Delivered safely"
        : "Arriving in 20–30 minutes";

  const shopPt = resolveAreaCoordinates(order.shop_address);
  const destPt = resolveAreaCoordinates(order.address_line);
  const adjustedDest =
    shopPt.lat === destPt.lat && shopPt.lng === destPt.lng
      ? { lat: destPt.lat + 0.004, lng: destPt.lng + 0.004 }
      : destPt;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-14">
      <CustomerHeader
        title="Order Tracking"
        backHref="/customer/orders"
        rightSlot={
          <button
            type="button"
            onClick={() => orderId && void loadOrder(orderId)}
            aria-label="Refresh status"
            className="grid h-10 w-10 place-items-center rounded-xl text-stone-700 hover:bg-stone-100"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      <main className="mx-auto max-w-5xl px-4 pt-4 md:px-8 md:pt-8">
        {notice && (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-[#EAF7EE] px-4 py-3 text-xs font-semibold text-[#15803D]">
            {notice}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Screen 10 (Order Tracking Hero + Vertical Timeline) */}
          <div className="space-y-5 lg:col-span-6">
            {order.status === "cancelled" ? (
              <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <h2 className="text-sm font-bold">Order Cancelled</h2>
                  <p className="mt-1 text-xs text-rose-800/80">
                    {cancelEntry?.note || "This order was cancelled."}
                  </p>
                </div>
              </section>
            ) : (
              <section className="overflow-hidden rounded-3xl border border-[#FFE0CC] bg-white shadow-xs">
                {/* Warm Rider Illustration Header */}
                <div className="relative overflow-hidden bg-gradient-to-b from-[#FFE1CB] via-[#FFF0E5] to-white px-5 pt-7 pb-5 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-8 ring-[#FF5A1F]/10">
                    <div className="relative flex items-center justify-center text-[#FF5A1F]">
                      <Bike className="h-10 w-10" strokeWidth={2} />
                      <ShoppingBag className="absolute -right-2 -top-1.5 h-4 w-4 rounded-full bg-[#15803D] p-0.5 text-white" />
                    </div>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-extrabold text-stone-900">
                    {heroTitle}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-stone-600">
                    {heroEta}
                  </p>
                </div>

                {/* Vertical Green Checkmark Timeline */}
                <div className="px-5 pb-6 pt-2">
                  {ORDER_STEPS.map((step, index) => {
                    const reached = index <= current;
                    const log = history.find((e: any) => e.status === step.key);
                    return (
                      <div
                        className="relative flex gap-3.5 pb-5 last:pb-0"
                        key={step.key}
                      >
                        {index < ORDER_STEPS.length - 1 && (
                          <i
                            className={`absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5 ${
                              index < current ? "bg-[#15803D]" : "bg-stone-200"
                            }`}
                          />
                        )}
                        <span
                          className={`z-10 grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold shrink-0 ${
                            reached
                              ? "bg-[#15803D] text-white"
                              : "border border-stone-300 bg-white text-stone-400"
                          }`}
                        >
                          {reached ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <b
                            className={`block text-xs font-bold ${
                              reached ? "text-stone-900" : "text-stone-400"
                            }`}
                          >
                            {step.label}
                          </b>
                          {log && (
                            <p className="mt-0.5 text-[11px] text-stone-500">
                              {formatUtcDateTime(log.created_at, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {log.note ? ` · ${log.note}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Live Route Map & Rider */}
            <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 text-xs">
                  <p className="flex items-center gap-2 font-bold text-stone-900">
                    <Store className="h-4 w-4 text-[#15803D] shrink-0" />
                    <span>{order.shop_name}</span>
                  </p>
                  <p className="flex items-start gap-2 text-stone-600">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#FF5A1F] shrink-0" />
                    <span>
                      <b className="text-stone-800">
                        {order.address_label || "Delivery"}:
                      </b>{" "}
                      {order.address_line}
                      {order.landmark ? `, ${order.landmark}` : ""}
                    </span>
                  </p>
                </div>
              </div>

              <PavagadaMap
                markers={[
                  {
                    id: "shop",
                    label: order.shop_name,
                    subtitle: order.shop_address,
                    lat: shopPt.lat,
                    lng: shopPt.lng,
                    tone: "shop",
                  },
                  {
                    id: "customer",
                    label: order.address_label || "Delivery Address",
                    subtitle: order.address_line,
                    lat: adjustedDest.lat,
                    lng: adjustedDest.lng,
                    tone: "customer",
                  },
                ]}
                center={shopPt}
                zoom={14}
                routeOrigin={shopPt}
                routeDestination={adjustedDest}
                heightClass="h-[210px]"
              />

              {order.rider_name && (
                <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4 text-[#FF5A1F]" />
                    <span>
                      Rider: <b className="text-stone-900">{order.rider_name}</b>
                    </span>
                  </div>
                  {order.rider_phone && (
                    <a
                      href={`tel:${order.rider_phone}`}
                      className="inline-flex items-center gap-1 font-bold text-[#15803D] hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{order.rider_phone}</span>
                    </a>
                  )}
                </div>
              )}

              {order.delivery_instructions && (
                <p className="rounded-xl bg-[#FAFAFA] p-3 text-xs text-stone-600">
                  Note: {order.delivery_instructions}
                </p>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Screen 11 (Order Details Receipt + Need Help?) */}
          <div className="space-y-4 lg:col-span-6">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="border-b border-stone-100 pb-4">
                <h2 className="text-lg font-extrabold text-stone-900">
                  Order #{order.order_no}
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  {formatUtcDateTime(order.created_at)}
                </p>
                <span className="mt-2.5 inline-block rounded-lg bg-[#EAF7EE] px-2.5 py-1 text-xs font-bold text-[#15803D]">
                  {statusDisplay}
                </span>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-bold text-stone-900">
                  Items ({data.items.length})
                </h3>
                <div className="mt-3 divide-y divide-stone-100">
                  {data.items.map((item: any) => (
                    <div
                      className="flex items-center justify-between gap-3 py-3 text-xs"
                      key={item.product_name}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ProductImage
                          src={item.image_url}
                          name={item.product_name}
                          className="h-10 w-10 rounded-lg object-cover bg-[#F7F4F0] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-stone-900">
                            {item.product_name}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            x{item.quantity}
                          </p>
                        </div>
                      </div>
                      <b className="tabular-nums text-sm font-bold text-stone-900 shrink-0">
                        {formatRupees(item.total_paise)}
                      </b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2 border-t border-stone-100 pt-3.5 text-xs">
                <p className="flex justify-between text-stone-600">
                  <span>Item Total</span>
                  <span className="tabular-nums font-semibold text-stone-900">
                    {formatRupees(order.subtotal_paise)}
                  </span>
                </p>
                <p className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums font-semibold text-stone-900">
                    {order.delivery_fee_paise
                      ? formatRupees(order.delivery_fee_paise)
                      : "Free"}
                  </span>
                </p>
                {Number(order.subtotal_paise) +
                  Number(order.delivery_fee_paise) -
                  Number(order.total_paise) >
                  0 && (
                  <p className="flex justify-between font-semibold text-[#15803D]">
                    <span>Promo Discount</span>
                    <span className="tabular-nums">
                      -
                      {formatRupees(
                        Number(order.subtotal_paise) +
                          Number(order.delivery_fee_paise) -
                          Number(order.total_paise)
                      )}
                    </span>
                  </p>
                )}
                <p className="flex justify-between border-t border-stone-100 pt-2.5 text-sm font-extrabold text-stone-900">
                  <span>Total Payable</span>
                  <span className="tabular-nums">
                    {formatRupees(order.total_paise)}
                  </span>
                </p>
              </div>
            </section>

            {/* Need Help? CTA (Screen 11 bottom blue pill) */}
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#EFF6FF] px-4 py-3 text-sm font-bold text-[#2563EB] transition hover:bg-[#DBEAFE]"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Need Help?</span>
            </button>

            {showHelp && (
              <form
                onSubmit={submitHelp}
                className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3 shadow-xs"
              >
                <h4 className="text-xs font-bold text-stone-900">
                  {order.status === "delivered"
                    ? "Request Refund or Report an Issue"
                    : "Contact Pavagada One Support"}
                </h4>
                <textarea
                  name="reason"
                  required
                  minLength={5}
                  placeholder="Describe your question or missing item…"
                  className="min-h-20 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] p-3 text-xs outline-none focus:border-[#FF5A1F]"
                />
                <div className="flex items-center gap-2">
                  <button
                    disabled={busy}
                    className="min-h-[42px] flex-1 rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-white"
                  >
                    {busy ? "Sending…" : "Submit Request"}
                  </button>
                  <Link
                    href="/customer/notifications"
                    className="min-h-[42px] grid place-items-center rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-700"
                  >
                    Updates
                  </Link>
                </div>
              </form>
            )}

            {order.status === "placed" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void cancelOrder()}
                className="min-h-[46px] w-full rounded-xl border border-rose-200 bg-[#FEF2F2] px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
