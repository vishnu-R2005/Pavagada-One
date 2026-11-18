"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChefHat,
  Info,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { PavagadaMap, resolveAreaCoordinates } from "@/components/pavagada-map";
import type { MerchantOrder, OrderDetail, Shop } from "@/components/merchant/types";
import {
  MERCHANT_STATUS_STEPS,
  calculateMerchantEarnings,
  formatRupees,
  getMerchantOrderLabel,
  getMerchantStepIndex,
} from "@/lib/merchant-ui";

export type OrderTabFilter = "new" | "preparing" | "ready" | "completed" | "all";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "placed":
      return "bg-[#FFF3EE] text-[#FF5A1F]";
    case "accepted":
    case "preparing":
      return "bg-[#EFF6FF] text-[#2563EB]";
    case "ready":
      return "bg-[#EAF7EE] text-[#15803D]";
    case "assigned":
    case "out_for_delivery":
      return "bg-[#F5F3FF] text-[#6D28D9]";
    case "delivered":
      return "bg-[#DCFCE7] text-[#15803D]";
    case "cancelled":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function formatOrderTimestamp(raw: string): string {
  const trimmed = String(raw || "").trim();
  const normalized =
    !trimmed.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(trimmed)
      ? `${trimmed.replace(" ", "T")}Z`
      : trimmed;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MerchantOrdersList({
  orders,
  busyId,
  onSelectOrder,
  onStatusChange,
  onAcceptAndTrack,
}: {
  orders: MerchantOrder[];
  busyId: string | null;
  onSelectOrder: (orderId: string, view?: "detail" | "status") => void;
  onStatusChange: (orderId: string, status: string) => void;
  onAcceptAndTrack: (orderId: string) => void;
}) {
  const [tab, setTab] = useState<OrderTabFilter>("new");
  const [queryText, setQueryText] = useState("");

  const counts = useMemo(() => {
    let placed = 0;
    let preparing = 0;
    let ready = 0;
    let completed = 0;
    for (const o of orders) {
      if (o.status === "placed") placed++;
      else if (o.status === "accepted" || o.status === "preparing") preparing++;
      else if (
        o.status === "ready" ||
        o.status === "assigned" ||
        o.status === "out_for_delivery"
      )
        ready++;
      else completed++;
    }
    return {
      placed,
      preparing,
      ready,
      completed,
      all: orders.length,
    };
  }, [orders]);

  const effectiveTab: OrderTabFilter =
    tab === "new" && counts.placed === 0 && orders.length > 0 && !queryText
      ? "all"
      : tab;

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return orders.filter((o) => {
      if (effectiveTab === "new" && o.status !== "placed") return false;
      if (
        effectiveTab === "preparing" &&
        o.status !== "accepted" &&
        o.status !== "preparing"
      )
        return false;
      if (
        effectiveTab === "ready" &&
        o.status !== "ready" &&
        o.status !== "assigned" &&
        o.status !== "out_for_delivery"
      )
        return false;
      if (
        effectiveTab === "completed" &&
        o.status !== "delivered" &&
        o.status !== "cancelled"
      )
        return false;

      if (!q) return true;
      return (
        o.order_no.toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_phone || "").toLowerCase().includes(q) ||
        (o.address_line || "").toLowerCase().includes(q)
      );
    });
  }, [orders, effectiveTab, queryText]);

  const pills: Array<{ id: OrderTabFilter; label: string }> = [
    { id: "new", label: `New (${counts.placed})` },
    { id: "preparing", label: `Preparing (${counts.preparing})` },
    { id: "ready", label: `Ready (${counts.ready})` },
    { id: "completed", label: `Completed (${counts.completed})` },
    { id: "all", label: `All (${counts.all})` },
  ];

  return (
    <div className="space-y-4">
      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Orders
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Accept incoming customer orders, pack items, and hand off to local riders
          </p>
        </div>
      </div>

      {/* Horizontal Status Filter Pills (Screen 3) */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        {pills.map((pill) => {
          const active = effectiveTab === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setTab(pill.id)}
              className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-[#FF5A1F] text-white shadow-xs"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Search by order ID or customer name..."
          className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#FF5A1F]"
        />
      </div>

      {/* Order Cards */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((order) => {
            const items = order.items ?? [];
            const isBusy = busyId === order.id;

            return (
              <article
                key={order.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-xs transition hover:border-stone-300"
              >
                <div>
                  {/* Order No + Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectOrder(order.id, "detail")}
                      className="text-left text-base font-extrabold text-stone-900 hover:text-[#FF5A1F] transition-colors"
                    >
                      #{order.order_no}
                    </button>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass(
                        order.status
                      )}`}
                    >
                      {getMerchantOrderLabel(order.status)}
                    </span>
                  </div>

                  {/* Customer Contact & Address */}
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="truncate font-semibold text-stone-900">
                          {order.customer_name || "Customer"}
                        </span>
                      </div>
                      {order.customer_phone && (
                        <p className="pl-5.5 text-[11px] font-medium text-stone-500">
                          {order.customer_phone}
                        </p>
                      )}
                      <div className="flex items-start gap-2 text-[11px] text-stone-500">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="line-clamp-2">
                          {order.address_line || "Pavagada Town"}
                          {order.landmark ? ` · ${order.landmark}` : ""}
                        </span>
                      </div>
                    </div>

                    {order.customer_phone && (
                      <a
                        href={`tel:${order.customer_phone}`}
                        aria-label={`Call ${order.customer_name || "customer"}`}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Item Preview List */}
                  {items.length > 0 && (
                    <div className="mt-3.5 space-y-2 border-t border-stone-100 pt-3">
                      {items.slice(0, 3).map((item, idx) => (
                        <div
                          key={`${order.id}-item-${idx}`}
                          className="flex items-center justify-between gap-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <ProductImage
                              src={item.image_url}
                              name={item.product_name}
                              className="h-8 w-8 rounded-lg object-cover border border-stone-100 shrink-0"
                            />
                            <p className="truncate text-xs font-medium text-stone-700">
                              {item.product_name}
                              {item.unit ? (
                                <span className="text-stone-400">
                                  {" "}
                                  ({item.unit})
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-stone-500 tabular-nums">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[11px] font-medium text-stone-400">
                          +{items.length - 3} more items
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Total + Action Row */}
                <div className="mt-3.5 border-t border-stone-100 pt-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      {formatOrderTimestamp(order.created_at)}
                    </span>
                    <span className="tabular-nums text-sm font-extrabold text-stone-900">
                      {formatRupees(order.total_paise)}
                    </span>
                  </div>

                  {order.status === "placed" ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onStatusChange(order.id, "cancelled")}
                        className="min-h-[42px] rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onAcceptAndTrack(order.id)}
                        className="min-h-[42px] rounded-xl bg-[#FF5A1F] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#E54910] disabled:opacity-50"
                      >
                        {isBusy ? "Updating…" : "Accept Order"}
                      </button>
                    </div>
                  ) : order.status === "accepted" ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectOrder(order.id, "detail")}
                        className="min-h-[42px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50"
                      >
                        Order Details
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onStatusChange(order.id, "preparing")}
                        className="min-h-[42px] rounded-xl bg-[#FF5A1F] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#E54910] disabled:opacity-50"
                      >
                        {isBusy ? "Updating…" : "Start Preparing"}
                      </button>
                    </div>
                  ) : order.status === "preparing" ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectOrder(order.id, "detail")}
                        className="min-h-[42px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50"
                      >
                        Order Details
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onStatusChange(order.id, "ready")}
                        className="min-h-[42px] rounded-xl bg-[#15803D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#166534] disabled:opacity-50"
                      >
                        {isBusy ? "Updating…" : "Mark as Ready"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectOrder(order.id, "detail")}
                      className="min-h-[42px] w-full rounded-xl border border-[#FF5A1F]/40 bg-[#FFF8F5] px-3 py-2 text-xs font-bold text-[#FF5A1F] transition hover:bg-[#FFF3EE]"
                    >
                      View Order Details
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center shadow-xs">
          <ShoppingBag className="mx-auto h-9 w-9 text-stone-300" />
          <p className="mt-3 text-sm font-bold text-stone-800">
            No orders match this view
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Try switching order status tabs or clearing your search query.
          </p>
        </div>
      )}
    </div>
  );
}

export function MerchantOrderDetailView({
  detail,
  shop,
  busyId,
  onAcceptAndTrack,
  onStatusChange,
  onOpenStatusFlow,
}: {
  detail: OrderDetail;
  shop: Shop;
  busyId: string | null;
  onAcceptAndTrack: (orderId: string) => void;
  onStatusChange: (orderId: string, status: string) => void;
  onOpenStatusFlow: () => void;
}) {
  const [showMap, setShowMap] = useState(false);
  const { order, items } = detail;
  const isBusy = busyId === order.id;

  const { gross, platformFee, netEarnings } = calculateMerchantEarnings(
    Number(order.total_paise)
  );
  const shopCoords = resolveAreaCoordinates(shop.address);
  const customerCoords = resolveAreaCoordinates(order.address_line);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header Summary Card */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900">
              #{order.order_no}
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              {formatOrderTimestamp(order.created_at)} ·{" "}
              <span className="uppercase">{order.payment_method}</span> (
              {order.payment_status})
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(
              order.status
            )}`}
          >
            {getMerchantOrderLabel(order.status)}
          </span>
        </div>

        {/* Customer Details */}
        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Customer Details
          </p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-stone-400 shrink-0" />
                <span className="text-sm font-bold text-stone-900">
                  {order.customer_name || "Customer"}
                </span>
              </div>
              {order.customer_phone && (
                <p className="pl-6 text-xs font-medium text-stone-500">
                  {order.customer_phone}
                </p>
              )}
              <div className="flex items-start gap-2 text-xs text-stone-600">
                <MapPin className="mt-0.5 h-4 w-4 text-stone-400 shrink-0" />
                <span>
                  {order.address_line}
                  {order.landmark ? `, ${order.landmark}` : ""}
                </span>
              </div>
              {order.delivery_instructions && (
                <p className="ml-6 rounded-xl bg-[#FFF8F5] px-3 py-2 text-xs text-stone-700">
                  Note: {order.delivery_instructions}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                className="ml-6 inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                {showMap ? "Hide Map" : "View on Map"}
              </button>
            </div>

            {order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                aria-label={`Call ${order.customer_name || "customer"}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>

          {showMap && (
            <div className="mt-4">
              <PavagadaMap
                heightClass="h-[230px]"
                center={customerCoords}
                markers={[
                  {
                    id: "shop-pin",
                    label: shop.name,
                    subtitle: shop.address,
                    lat: shopCoords.lat,
                    lng: shopCoords.lng,
                    tone: "shop",
                  },
                  {
                    id: "customer-pin",
                    label: order.customer_name || "Customer Drop",
                    subtitle: order.address_line,
                    lat: customerCoords.lat,
                    lng: customerCoords.lng,
                    tone: "customer",
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Items ({items.length})
          </p>
          <div className="mt-3 space-y-3">
            {items.map((item, idx) => (
              <div
                key={`${order.id}-detail-${idx}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProductImage
                    src={item.image_url}
                    name={item.product_name}
                    className="h-11 w-11 rounded-xl object-cover border border-stone-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <span className="text-xs font-medium text-stone-400">
                    x{item.quantity}
                  </span>
                  <span className="tabular-nums font-bold text-stone-900">
                    {formatRupees(item.total_paise)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill & Earnings Breakdown */}
        <div className="mt-5 space-y-2 border-t border-stone-100 pt-4 text-sm">
          <div className="flex items-center justify-between text-stone-600">
            <span>Order Total</span>
            <span className="tabular-nums font-semibold text-stone-900">
              {formatRupees(gross)}
            </span>
          </div>
          <div className="flex items-center justify-between text-stone-600">
            <span>Platform Fee (5%)</span>
            <span className="tabular-nums font-semibold text-rose-600">
              -{formatRupees(platformFee)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-stone-200 pt-2.5 text-base font-extrabold text-[#15803D]">
            <span>Your Earnings</span>
            <span className="tabular-nums">{formatRupees(netEarnings)}</span>
          </div>
        </div>
      </section>

      {/* Bottom Sticky-feeling Actions */}
      {order.status === "placed" ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onStatusChange(order.id, "cancelled")}
            className="min-h-[48px] rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onAcceptAndTrack(order.id)}
            className="min-h-[48px] rounded-2xl bg-[#FF5A1F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#E54910] disabled:opacity-50"
          >
            {isBusy ? "Updating…" : "Accept Order"}
          </button>
        </div>
      ) : order.status === "accepted" || order.status === "preparing" ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onStatusChange(order.id, "cancelled")}
            className="min-h-[48px] rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
          >
            Cancel Order
          </button>
          <button
            type="button"
            onClick={onOpenStatusFlow}
            className="min-h-[48px] rounded-2xl bg-[#FF5A1F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#E54910]"
          >
            Update Order Status
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenStatusFlow}
          className="min-h-[48px] w-full rounded-2xl border border-[#FF5A1F] bg-white px-4 py-3 text-sm font-bold text-[#FF5A1F] transition hover:bg-[#FFF8F5]"
        >
          Track Order Progress
        </button>
      )}
    </div>
  );
}

export function MerchantOrderStatusView({
  detail,
  busyId,
  onStatusChange,
  onViewDetails,
}: {
  detail: OrderDetail;
  busyId: string | null;
  onStatusChange: (orderId: string, status: string) => void;
  onViewDetails: () => void;
}) {
  const { order } = detail;
  const activeIndex = getMerchantStepIndex(order.status);
  const isBusy = busyId === order.id;
  const isCancelled = order.status === "cancelled";

  const statusMeta = (() => {
    switch (order.status) {
      case "placed":
        return {
          title: "Confirm Incoming Order",
          desc: "Review items and accept the order to begin packing for the customer.",
          ctaLabel: "Accept Order",
          nextStatus: "accepted",
          Icon: ShoppingBag,
        };
      case "accepted":
        return {
          title: "Start Preparing Order",
          desc: "Gather all items from your shelves and begin packing neatly.",
          ctaLabel: "Start Preparing",
          nextStatus: "preparing",
          Icon: ChefHat,
        };
      case "preparing":
        return {
          title: "Prepare the Order",
          desc: "Pack all items and mark as ready when the order is ready for pickup.",
          ctaLabel: "Mark as Ready",
          nextStatus: "ready",
          Icon: ShoppingBag,
        };
      case "ready":
        return {
          title: "Ready for Rider Pickup",
          desc: "Local riders nearby have been notified to collect this order.",
          ctaLabel: null,
          nextStatus: null,
          Icon: PackageCheck,
        };
      case "assigned":
      case "out_for_delivery":
        return {
          title: "Picked Up by Rider",
          desc: "Your order has been picked up and is on the way to the customer.",
          ctaLabel: null,
          nextStatus: null,
          Icon: Truck,
        };
      case "delivered":
        return {
          title: "Order Delivered",
          desc: "Delivery completed. Earnings are added to your daily report.",
          ctaLabel: null,
          nextStatus: null,
          Icon: CheckCircle2,
        };
      default:
        return {
          title: "Order Cancelled",
          desc: "This order was cancelled and inventory has been restored.",
          ctaLabel: null,
          nextStatus: null,
          Icon: Info,
        };
    }
  })();

  const HeroIcon = statusMeta.Icon;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* 5-Step Progress Timeline (Screen 5) */}
      {!isCancelled && (
        <section className="rounded-2xl border border-stone-200 bg-white px-4 py-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between text-xs font-bold text-stone-500">
            <span>#{order.order_no}</span>
            <span className="text-[#FF5A1F]">
              {getMerchantOrderLabel(order.status)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-1">
            {MERCHANT_STATUS_STEPS.map((step, idx) => {
              const completed = idx < activeIndex || order.status === "delivered";
              const current = idx === activeIndex && order.status !== "delivered";
              return (
                <div
                  key={step.key}
                  className="relative flex flex-1 flex-col items-center text-center"
                >
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 right-1/2 top-3.5 h-0.5 -translate-y-1/2 ${
                        completed || current ? "bg-[#15803D]" : "bg-stone-200"
                      }`}
                    />
                  )}
                  {idx < MERCHANT_STATUS_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-1/2 right-0 top-3.5 h-0.5 -translate-y-1/2 ${
                        idx < activeIndex ? "bg-[#15803D]" : "bg-stone-200"
                      }`}
                    />
                  )}

                  <span
                    className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold ${
                      completed
                        ? "border-[#15803D] bg-[#15803D] text-white"
                        : current
                          ? "border-[#FF5A1F] bg-[#FFF3EE] text-[#FF5A1F]"
                          : "border-stone-200 bg-white text-stone-300"
                    }`}
                  >
                    {completed ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : current ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5A1F]" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-stone-200" />
                    )}
                  </span>
                  <span
                    className={`mt-1.5 text-[10px] font-bold ${
                      completed
                        ? "text-[#15803D]"
                        : current
                          ? "text-[#FF5A1F]"
                          : "text-stone-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Center Illustrated Status Hero Card */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-xs">
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] text-[#FF5A1F] shadow-inner">
          <HeroIcon className="h-12 w-12" strokeWidth={1.75} />
        </div>

        <h2 className="mt-5 font-display text-2xl font-bold text-stone-900">
          {statusMeta.title}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
          {statusMeta.desc}
        </p>

        {statusMeta.nextStatus && statusMeta.ctaLabel && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onStatusChange(order.id, statusMeta.nextStatus!)}
            className="mt-6 min-h-[48px] w-full rounded-xl bg-[#FF5A1F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#E54910] disabled:opacity-50"
          >
            {isBusy ? "Updating Status…" : statusMeta.ctaLabel}
          </button>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-xs font-semibold text-stone-700">
          <Info className="h-4 w-4 text-[#FF5A1F] shrink-0" />
          <span>Customer will be notified.</span>
        </div>
      </section>

      <button
        type="button"
        onClick={onViewDetails}
        className="min-h-[48px] w-full rounded-xl border border-[#FF5A1F] bg-white px-5 py-3 text-sm font-bold text-[#FF5A1F] transition hover:bg-[#FFF8F5]"
      >
        View Order Details
      </button>
    </div>
  );
}
