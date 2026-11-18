"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
  Package,
  Phone,
  Store,
  User,
} from "lucide-react";
import {
  PavagadaMap,
  resolveAreaCoordinates,
} from "@/components/pavagada-map";
import { ProductImage } from "@/components/product-image";
import type { RiderDelivery, RiderOrderItem } from "@/components/rider/types";
import {
  estimateRouteEta,
  formatRiderTimeAgo,
  formatRupees,
  getRiderStepIndex,
  RIDER_STEPS,
} from "@/lib/rider-ui";

function RiderStepTracker({
  assignmentStatus,
  orderStatus,
  stepOverride,
}: {
  assignmentStatus?: string | null;
  orderStatus?: string | null;
  stepOverride?: number;
}) {
  const activeStep =
    typeof stepOverride === "number"
      ? stepOverride
      : getRiderStepIndex(assignmentStatus, orderStatus);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-xs">
      <div className="grid grid-cols-4 items-center">
        {RIDER_STEPS.map((label, idx) => {
          const done = idx < activeStep;
          const current = idx === activeStep;
          return (
            <div key={label} className="relative flex flex-col items-center">
              {idx < RIDER_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-3.5 h-0.5 w-full ${
                    idx < activeStep ? "bg-[#15803D]" : "bg-stone-200"
                  }`}
                />
              )}
              <span
                className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold ${
                  done
                    ? "border-[#15803D] bg-[#15803D] text-white"
                    : current
                      ? "border-[#FF5A1F] bg-[#FF5A1F] text-white"
                      : "border-stone-200 bg-white text-stone-400"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current" />
                )}
              </span>
              <span
                className={`mt-1.5 text-[11px] font-semibold whitespace-nowrap ${
                  done
                    ? "text-[#15803D]"
                    : current
                      ? "text-[#FF5A1F]"
                      : "text-stone-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RiderOrdersQueue({
  available,
  active,
  online,
  busy,
  onSelectOrder,
  onAcceptOrder,
  onContinueOrder,
  onGoOnline,
}: {
  available: RiderDelivery[];
  active: RiderDelivery[];
  online: boolean;
  busy: boolean;
  onSelectOrder: (order: RiderDelivery) => void;
  onAcceptOrder: (order: RiderDelivery) => void;
  onContinueOrder: (order: RiderDelivery) => void;
  onGoOnline: () => void;
}) {
  const [tab, setTab] = useState<"available" | "progress">(
    active.length > 0 && available.length === 0 ? "progress" : "available"
  );
  const list = tab === "available" ? available : active;

  return (
    <div className="space-y-4">
      {!online && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-[#FEF9EC] px-4 py-3">
          <p className="text-xs font-semibold text-amber-900">
            You are currently Offline. Go online to accept ready pickups.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={onGoOnline}
            className="min-h-[38px] rounded-xl bg-[#15803D] px-3.5 py-1.5 text-xs font-bold text-white whitespace-nowrap"
          >
            Go Online
          </button>
        </div>
      )}

      {/* Segmented Filter Tabs (Screen 4) */}
      <div className="flex max-w-md gap-2 rounded-2xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setTab("available")}
          className={`flex-1 min-h-[42px] rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            tab === "available"
              ? "bg-[#FF5A1F] text-white shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Available ({available.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("progress")}
          className={`flex-1 min-h-[42px] rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            tab === "progress"
              ? "bg-[#FF5A1F] text-white shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          In Progress ({active.length})
        </button>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((order) => {
          const route = estimateRouteEta(order.shop_address, order.address_line);
          const previews = order.items_preview ?? [];
          const isAssigned = Boolean(order.assignment_status);

          return (
            <article
              key={order.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-xs transition hover:border-[#FF5A1F]/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectOrder(order)}
                    className="text-left text-sm font-extrabold text-stone-900 hover:text-[#FF5A1F] tabular-nums"
                  >
                    #{order.order_no}
                  </button>
                  <span className="tabular-nums text-base font-extrabold text-[#15803D]">
                    {formatRupees(order.delivery_fee_paise)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  className="mt-3 flex w-full items-center gap-3 text-left"
                >
                  <ProductImage
                    src={order.shop_image || "/images/hero-market.jpg"}
                    name={order.shop_name}
                    className="h-12 w-12 rounded-xl object-cover shrink-0 bg-[#FFF3EE]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-900">
                      {order.shop_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {route.distanceLabel} · {order.shop_address}
                    </p>
                  </div>
                </button>

                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FAFAFA] px-3 py-2.5 text-xs text-stone-600">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#FF5A1F] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-800">
                      {order.customer_name} · {order.address_line}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {order.item_count} item{order.item_count === 1 ? "" : "s"} ·{" "}
                      {route.etaLabel} · {formatRiderTimeAgo(order.created_at)}
                    </p>
                  </div>
                </div>

                {previews.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    {previews.slice(0, 3).map((item, i) => (
                      <ProductImage
                        key={`${order.id}-p-${i}`}
                        src={item.image_url}
                        name={item.product_name}
                        className="h-10 w-10 rounded-lg border border-stone-100 object-cover bg-[#F7F4F0]"
                      />
                    ))}
                    {order.item_count > 3 && (
                      <span className="text-[11px] font-semibold text-stone-500">
                        +{order.item_count - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  className="min-h-[44px] rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Details
                </button>
                {isAssigned ? (
                  <button
                    type="button"
                    onClick={() => onContinueOrder(order)}
                    className="min-h-[44px] flex-1 rounded-xl bg-[#15803D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534]"
                  >
                    {order.assignment_status === "picked_up"
                      ? "Continue Delivery"
                      : "Start Pickup"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy || !online}
                    onClick={() => onAcceptOrder(order)}
                    className="min-h-[44px] flex-1 rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#FF5A1F]/20 hover:bg-[#E54910] disabled:opacity-50"
                  >
                    {busy
                      ? "Accepting…"
                      : online
                        ? "Accept Order"
                        : "Go Online to Accept"}
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {!list.length && (
          <div className="col-span-full rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
              <Package className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-stone-900">
              {tab === "available"
                ? "No new orders waiting right now"
                : "No active deliveries in progress"}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {tab === "available"
                ? "New pickups appear automatically as soon as Pavagada shops mark orders ready."
                : "Accept an available order to start your next delivery."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function RiderOrderDetailsView({
  order,
  items,
  loadingItems,
  online,
  busy,
  onAcceptOrder,
  onStartPickup,
  onOpenMap,
}: {
  order: RiderDelivery;
  items: RiderOrderItem[];
  loadingItems: boolean;
  online: boolean;
  busy: boolean;
  onAcceptOrder: () => void;
  onStartPickup: () => void;
  onOpenMap: () => void;
}) {
  const isAssigned = Boolean(order.assignment_status);
  const isPickedUp = order.assignment_status === "picked_up";
  const isDelivered =
    order.assignment_status === "delivered" || order.status === "delivered";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header Summary Card (Screen 5) */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-stone-900 tabular-nums">
              #{order.order_no}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              {order.payment_method === "cash_on_delivery"
                ? `Cash on Delivery · Collect ${formatRupees(order.total_paise)}`
                : "Prepaid Online Order"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-[#15803D] tabular-nums">
              {formatRupees(order.delivery_fee_paise)}
            </p>
            <p className="text-[11px] font-medium text-stone-500">
              Delivery Fee
            </p>
          </div>
        </div>
      </section>

      {/* Shop Card */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ProductImage
              src={order.shop_image || "/images/hero-market.jpg"}
              name={order.shop_name}
              className="h-12 w-12 rounded-xl object-cover shrink-0 bg-[#FFF3EE]"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-stone-900">
                {order.shop_name}
              </p>
              <p className="mt-0.5 truncate text-xs text-stone-500">
                {order.shop_address}
              </p>
            </div>
          </div>

          {order.shop_phone && (
            <a
              href={`tel:${order.shop_phone}`}
              aria-label={`Call ${order.shop_name}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF7EE] text-[#15803D] shrink-0 hover:bg-[#dcf2e3]"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>
      </section>

      {/* Customer Details Card */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-stone-500">Customer Details</h2>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-stone-700 shrink-0">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-stone-900">
                {order.customer_name}
              </p>
              <p className="text-xs text-stone-500">
                {order.customer_phone || "Customer contact available on order"}
              </p>
            </div>
          </div>

          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              aria-label={`Call ${order.customer_name}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF7EE] text-[#15803D] shrink-0 hover:bg-[#dcf2e3]"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="flex items-start gap-2.5 border-t border-stone-100 pt-3 text-xs text-stone-600">
          <MapPin className="mt-0.5 h-4 w-4 text-[#FF5A1F] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-stone-800">
              {order.address_line}
              {order.landmark ? `, ${order.landmark}` : ""}
            </p>
            {order.delivery_instructions && (
              <p className="mt-1.5 rounded-xl bg-[#FFF3EE] px-3 py-2 text-xs font-medium text-[#9A3412]">
                Delivery note: {order.delivery_instructions}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMap}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#2563EB]/25 bg-[#EFF6FF] py-2.5 text-xs font-bold text-[#2563EB] hover:bg-blue-100/70"
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>View on Map</span>
        </button>
      </section>

      {/* Items List Card */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900">
            Items ({items.length || order.item_count})
          </h2>
          <span className="text-xs font-semibold text-stone-500 tabular-nums">
            Order Total {formatRupees(order.total_paise)}
          </span>
        </div>

        {loadingItems ? (
          <p className="py-5 text-center text-xs text-stone-500">
            Loading order items…
          </p>
        ) : items.length > 0 ? (
          <div className="mt-3 divide-y divide-stone-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProductImage
                    src={item.image_url}
                    name={item.product_name}
                    className="h-11 w-11 rounded-xl object-cover shrink-0 bg-[#F7F4F0]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-stone-900">
                      {item.product_name}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {item.unit || formatRupees(item.unit_price_paise)}
                    </p>
                  </div>
                </div>
                <span className="tabular-nums text-xs font-bold text-stone-800 shrink-0">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-xs text-stone-500">
            {order.item_count} packed item{order.item_count === 1 ? "" : "s"} ready at{" "}
            {order.shop_name}.
          </p>
        )}
      </section>

      {/* Primary Action CTA */}
      {!isDelivered && (
        <div className="pt-1">
          {isPickedUp ? (
            <button
              type="button"
              onClick={onOpenMap}
              className="min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-md shadow-[#FF5A1F]/25 hover:bg-[#E54910]"
            >
              Continue to Customer Map
            </button>
          ) : isAssigned ? (
            <button
              type="button"
              onClick={onStartPickup}
              className="min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-md shadow-[#FF5A1F]/25 hover:bg-[#E54910]"
            >
              Go to Shop Pickup
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !online}
              onClick={onAcceptOrder}
              className="min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-md shadow-[#FF5A1F]/25 hover:bg-[#E54910] disabled:opacity-50"
            >
              {busy
                ? "Accepting…"
                : online
                  ? "Accept & Start Pickup"
                  : "Go Online to Accept Order"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function RiderPickupView({
  order,
  items,
  pickedChecked,
  busy,
  onToggleChecked,
  onConfirmPickup,
}: {
  order: RiderDelivery;
  items: RiderOrderItem[];
  pickedChecked: boolean;
  busy: boolean;
  onToggleChecked: (checked: boolean) => void;
  onConfirmPickup: () => void;
}) {
  const [showItems, setShowItems] = useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <RiderStepTracker
        assignmentStatus={order.assignment_status || "assigned"}
        orderStatus={order.status}
      />

      {/* Shop Header Card (Screen 6) */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <div className="relative h-44 w-full bg-[#F7F4F0]">
          <img
            src={order.shop_image || "/images/hero-market.jpg"}
            alt={order.shop_name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <p className="text-xs font-medium text-white/85">
                Pickup Order #{order.order_no}
              </p>
              <h2 className="text-lg font-extrabold">{order.shop_name}</h2>
            </div>
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-[#15803D] tabular-nums">
              {formatRupees(order.delivery_fee_paise)}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <Store className="mt-0.5 h-4 w-4 text-[#FF5A1F] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900">
                  Shop Location
                </p>
                <p className="text-xs text-stone-500">{order.shop_address}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {order.shop_phone && (
                <a
                  href={`tel:${order.shop_phone}`}
                  aria-label="Call shop"
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF7EE] text-[#15803D]"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  order.shop_address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Navigate to shop"
                className="grid h-10 w-10 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]"
              >
                <Navigation className="h-4 w-4" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowItems((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-left"
          >
            <div>
              <p className="text-xs font-bold text-stone-900">
                Items to pickup
              </p>
              <p className="text-[11px] text-stone-500">
                {items.length || order.item_count} item
                {(items.length || order.item_count) === 1 ? "" : "s"} packed
              </p>
            </div>
            {showItems ? (
              <ChevronUp className="h-4 w-4 text-stone-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-500" />
            )}
          </button>

          {showItems && (items.length > 0 || (order.items_preview?.length ?? 0) > 0) && (
            <div className="divide-y divide-stone-100 rounded-xl border border-stone-100 px-3">
              {(items.length > 0
                ? items.map((item) => ({
                    key: item.id,
                    name: item.product_name,
                    qty: item.quantity,
                  }))
                : (order.items_preview ?? []).map((item, idx) => ({
                    key: `prev-${idx}`,
                    name: item.product_name,
                    qty: item.quantity,
                  }))
              ).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 py-2.5 text-xs"
                >
                  <span className="truncate font-semibold text-stone-800">
                    {item.name}
                  </span>
                  <span className="tabular-nums font-bold text-[#FF5A1F] shrink-0">
                    x{item.qty}
                  </span>
                </div>
              ))}
            </div>
          )}

          <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-[#FFF9F6] px-3.5 py-3 text-xs font-bold text-stone-900">
            <input
              type="checkbox"
              checked={pickedChecked}
              onChange={(e) => onToggleChecked(e.target.checked)}
              className="h-5 w-5 accent-[#FF5A1F]"
            />
            <span>I have picked up all items</span>
          </label>
        </div>
      </section>

      <button
        type="button"
        disabled={!pickedChecked || busy}
        onClick={onConfirmPickup}
        className="min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-md shadow-[#FF5A1F]/25 hover:bg-[#E54910] disabled:opacity-45"
      >
        {busy ? "Starting Delivery…" : "Start Delivery"}
      </button>
    </div>
  );
}

export function RiderDeliverMapView({
  order,
  onProceedHandover,
}: {
  order: RiderDelivery;
  onProceedHandover: () => void;
}) {
  const shopPt = resolveAreaCoordinates(order.shop_address);
  const destPt = resolveAreaCoordinates(order.address_line);
  const adjustedDest =
    shopPt.lat === destPt.lat && shopPt.lng === destPt.lng
      ? { lat: destPt.lat + 0.004, lng: destPt.lng + 0.004 }
      : destPt;
  const route = estimateRouteEta(order.shop_address, order.address_line);
  const initial = order.customer_name.trim().charAt(0).toUpperCase() || "C";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xs">
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
              id: "dropoff",
              label: order.customer_name,
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
          heightClass="h-[320px] md:h-[380px]"
        />

        {/* Floating ETA badge (Screen 7) */}
        <div className="pointer-events-none absolute right-4 top-4 rounded-xl border border-stone-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-xs">
          <p className="text-xs font-extrabold text-stone-900">
            {route.etaLabel}
          </p>
          <p className="text-[11px] font-medium text-stone-500">
            {route.distanceLabel}
          </p>
        </div>
      </div>

      {/* Customer Sheet Card (Screen 7) */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F5F3FF] text-sm font-extrabold text-[#7C3AED] shrink-0">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-stone-900">
                {order.customer_name}
              </p>
              <p className="text-xs text-stone-500">
                {order.customer_phone || "Customer contact"}
              </p>
            </div>
          </div>

          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              aria-label={`Call ${order.customer_name}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF7EE] text-[#15803D] shrink-0"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="flex items-start gap-2.5 border-t border-stone-100 pt-3 text-xs text-stone-600">
          <MapPin className="mt-0.5 h-4 w-4 text-[#FF5A1F] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-stone-800">
              {order.address_line}
              {order.landmark ? `, ${order.landmark}` : ""}
            </p>
            {order.delivery_instructions && (
              <p className="mt-1.5 rounded-xl bg-[#FFF3EE] px-3 py-2 text-xs font-medium text-[#9A3412]">
                Note: {order.delivery_instructions}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
              order.shop_address
            )}&destination=${encodeURIComponent(order.address_line)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 hover:bg-[#E54910]"
          >
            <Navigation className="h-4 w-4" />
            <span>Navigate</span>
          </a>

          <button
            type="button"
            onClick={onProceedHandover}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#15803D] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#166534]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Arrived · Deliver Order</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export function RiderDeliverHandoverView({
  order,
  busy,
  onMarkDelivered,
  onBackToMap,
}: {
  order: RiderDelivery;
  busy: boolean;
  onMarkDelivered: () => void;
  onBackToMap: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <RiderStepTracker
        assignmentStatus={order.assignment_status || "picked_up"}
        orderStatus={order.status}
        stepOverride={3}
      />

      {/* Handover Card (Screen 8) */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <div className="bg-[#FFF6EE]">
          <img
            src="/images/rider-handover.jpg"
            alt="Delivery partner handing order to customer"
            referrerPolicy="no-referrer"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-stone-900 tabular-nums">
                #{order.order_no}
              </p>
              <p className="text-xs font-semibold text-stone-500">
                {order.payment_method === "cash_on_delivery"
                  ? `Collect ${formatRupees(order.total_paise)} (Cash / UPI on Delivery)`
                  : "Prepaid Online · No cash collection"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-[#15803D] tabular-nums">
                {formatRupees(order.delivery_fee_paise)}
              </p>
              <p className="text-[11px] font-medium text-stone-500">
                Delivery Fee
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-stone-100 pt-3 text-xs">
            <div className="flex items-center gap-2.5 text-stone-800">
              <User className="h-4 w-4 text-stone-400 shrink-0" />
              <span className="font-bold">{order.customer_name}</span>
              {order.customer_phone && (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="ml-auto font-semibold text-[#15803D] hover:underline"
                >
                  {order.customer_phone}
                </a>
              )}
            </div>
            <div className="flex items-start gap-2.5 text-stone-600">
              <MapPin className="mt-0.5 h-4 w-4 text-[#FF5A1F] shrink-0" />
              <span>
                {order.address_line}
                {order.landmark ? `, ${order.landmark}` : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={onMarkDelivered}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] py-3.5 text-base font-bold text-white shadow-md shadow-[#15803D]/20 hover:bg-[#166534] disabled:opacity-60"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span>{busy ? "Completing…" : "Mark as Delivered"}</span>
        </button>

        <button
          type="button"
          onClick={onBackToMap}
          className="min-h-[44px] w-full rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
        >
          Open Route Map
        </button>
      </div>
    </div>
  );
}
