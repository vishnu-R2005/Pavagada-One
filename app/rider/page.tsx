"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Star,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { ProductImage } from "@/components/product-image";
import {
  RiderMoreView,
  RiderNotificationsView,
  RiderProfileView,
  RiderSupportView,
} from "@/components/rider/rider-account";
import {
  RiderEarningsView,
  RiderOrderHistoryView,
} from "@/components/rider/rider-earnings";
import { RiderLogin } from "@/components/rider/rider-login";
import {
  RiderBottomNav,
  RiderHeader,
} from "@/components/rider/rider-nav";
import {
  RiderDeliverHandoverView,
  RiderDeliverMapView,
  RiderOrderDetailsView,
  RiderOrdersQueue,
  RiderPickupView,
} from "@/components/rider/rider-orders";
import type {
  RiderDashboardData,
  RiderDelivery,
  RiderNotification,
  RiderOrderItem,
  RiderPage,
} from "@/components/rider/types";
import { apiFetch } from "@/lib/client-session";
import {
  calculateCompletionRate,
  calculateRiderIncentive,
  estimateRouteEta,
  formatRupees,
} from "@/lib/rider-ui";

export default function RiderApp() {
  const [dashboard, setDashboard] = useState<RiderDashboardData | null>(null);
  const [notifications, setNotifications] = useState<RiderNotification[]>([]);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState<RiderPage>("home");
  const [selected, setSelected] = useState<RiderDelivery | null>(null);
  const [orderItems, setOrderItems] = useState<RiderOrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [pickedChecked, setPickedChecked] = useState(false);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<RiderDashboardData | null> => {
    setError("");
    try {
      const sessionRes = await apiFetch("/api/auth/session", {
        cache: "no-store",
      });
      const sessionBody = await sessionRes.json().catch(() => ({}));
      const sessionUser = sessionBody.user as
        | { id: string; role: string; fullName: string }
        | null
        | undefined;

      if (!sessionUser) {
        setAuthRequired(true);
        return null;
      }

      if (sessionUser.role !== "rider") {
        setError(
          `Delivery Partner access is required. Currently signed in as ${sessionUser.role}.`
        );
        setAuthRequired(true);
        return null;
      }

      const [dashRes, notifRes] = await Promise.all([
        apiFetch("/api/rider/dashboard", { cache: "no-store" }),
        apiFetch("/api/notifications", { cache: "no-store" }),
      ]);

      if (dashRes.status === 401 || dashRes.status === 403) {
        setAuthRequired(true);
        return null;
      }

      const dashBody = await dashRes.json().catch(() => ({}));
      if (!dashRes.ok) {
        throw new Error(dashBody.error || "Unable to load rider dashboard.");
      }

      const notifBody = await notifRes.json().catch(() => ({}));
      setDashboard(dashBody as RiderDashboardData);
      setNotifications(notifBody.notifications ?? []);
      setAuthRequired(false);
      return dashBody as RiderDashboardData;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load delivery partner app."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fetchOrderItems = useCallback(async (orderId: string) => {
    setLoadingItems(true);
    try {
      const res = await apiFetch(`/api/rider/orders/${orderId}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(body.items)) {
        setOrderItems(body.items as RiderOrderItem[]);
        if (body.order) {
          setSelected(body.order as RiderDelivery);
        }
      }
    } catch {
      // Keep fallback count on failure
    } finally {
      setLoadingItems(false);
    }
  }, []);

  function openOrderDetails(order: RiderDelivery) {
    setSelected(order);
    setOrderItems([]);
    setPage("order-detail");
    void fetchOrderItems(order.id);
  }

  function openContinueFlow(order: RiderDelivery) {
    setSelected(order);
    setOrderItems([]);
    setPickedChecked(false);
    void fetchOrderItems(order.id);
    setPage(order.assignment_status === "picked_up" ? "map" : "pickup");
  }

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability() {
    if (!dashboard) return;
    await run(async () => {
      const online = !Boolean(dashboard.profile.rider_available);
      const res = await apiFetch("/api/rider/availability", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ available: online }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to update status.");
      await load();
      setNotice(
        online
          ? "You are now Online and ready for deliveries."
          : "You are Offline. New order alerts are paused."
      );
    });
  }

  async function acceptOrder(order: RiderDelivery) {
    await run(async () => {
      const res = await apiFetch(`/api/rider/orders/${order.id}/accept`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Unable to accept this delivery.");
      }
      const fresh = await load();
      const refreshed = fresh?.active.find((item) => item.id === order.id);
      setSelected(
        refreshed ?? {
          ...order,
          assignment_status: "assigned",
          status: "assigned",
        }
      );
      setPickedChecked(false);
      setNotice("Order accepted. Head to the shop for pickup.");
      setPage("pickup");
      await fetchOrderItems(order.id);
    });
  }

  async function confirmPickup() {
    if (!selected) return;
    await run(async () => {
      const res = await apiFetch(`/api/rider/orders/${selected.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "picked_up" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Unable to confirm pickup.");
      }
      await load();
      setSelected({
        ...selected,
        assignment_status: "picked_up",
        status: "out_for_delivery",
      });
      setNotice("Pickup confirmed. Follow the route to deliver to customer.");
      setPage("map");
    });
  }

  async function markDelivered() {
    if (!selected) return;
    await run(async () => {
      const orderNo = selected.order_no;
      const res = await apiFetch(`/api/rider/orders/${selected.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Unable to complete delivery.");
      }
      await load();
      setSelected(null);
      setNotice(`Order #${orderNo} delivered! Earnings updated.`);
      setPage("home");
    });
  }

  async function saveProfile(fullName: string, phone: string) {
    await run(async () => {
      const res = await apiFetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, phone: phone || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to update profile.");
      await load();
      setNotice("Partner profile saved.");
    });
  }

  async function markAllNotificationsRead() {
    await apiFetch("/api/notifications", { method: "PATCH" });
    await load();
  }

  async function submitSupportTicket(subject: string, detail: string) {
    await run(async () => {
      const res = await apiFetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "support", subject, detail }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to submit request.");
      setNotice("Support request sent to Pavagada One operations.");
    });
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setDashboard(null);
    setAuthRequired(true);
    setPage("home");
  }

  function handleBack() {
    if (page === "deliver") setPage("map");
    else if (page === "map") setPage("order-detail");
    else if (page === "pickup") setPage("order-detail");
    else if (page === "order-detail") setPage("orders");
    else if (page === "support") setPage("profile");
    else if (page === "history") setPage("orders");
    else if (page === "notifications" || page === "more") setPage("home");
    else setPage("home");
  }

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAFAFA] p-6 text-center">
        <div className="space-y-3">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
            <Truck className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold text-stone-600">
            Loading Delivery Partner workspace…
          </p>
        </div>
      </main>
    );
  }

  if (authRequired || !dashboard) {
    return (
      <RiderLogin
        errorMessage={error}
        onSignedIn={() => {
          setLoading(true);
          void load();
        }}
        onSwitchAccount={() => void logout()}
      />
    );
  }

  const online = Boolean(dashboard.profile.rider_available);
  const deliveriesToday = Number(dashboard.earnings.today?.deliveries ?? 0);
  const earningsToday = Number(dashboard.earnings.today?.earnings ?? 0);
  const incentive = calculateRiderIncentive(deliveriesToday);
  const completionRate = calculateCompletionRate(
    dashboard.earnings.allTime?.deliveries ?? dashboard.history.length,
    dashboard.stats?.cancelled ?? 0
  );
  const queueCount = dashboard.available.length + dashboard.active.length;

  const activeMain: "home" | "orders" | "earnings" | "profile" =
    page === "home"
      ? "home"
      : page === "orders" ||
          page === "order-detail" ||
          page === "pickup" ||
          page === "map" ||
          page === "deliver" ||
          page === "history"
        ? "orders"
        : page === "earnings"
          ? "earnings"
          : "profile";

  const riderInitial =
    dashboard.profile.full_name.trim().charAt(0).toUpperCase() || "R";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-24 md:pb-12">
      <RiderHeader
        page={page}
        activeMain={activeMain}
        online={online}
        busy={busy}
        queueCount={queueCount}
        unreadCount={unreadCount}
        onNavigate={(next) => setPage(next)}
        onBack={handleBack}
        onToggleAvailability={() => void toggleAvailability()}
      />

      <main className="mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-7">
        {notice && (
          <div
            role="status"
            className="mb-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-[#EAF7EE] px-4 py-3 text-left text-xs font-semibold text-[#15803D]"
          >
            <span>{notice}</span>
            <button
              type="button"
              aria-label="Dismiss notice"
              onClick={() => setNotice("")}
              className="grid h-6 w-6 place-items-center rounded-lg hover:bg-emerald-100 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-xs font-semibold text-rose-800"
          >
            <span>{error}</span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
              className="grid h-6 w-6 place-items-center rounded-lg hover:bg-rose-100 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SCREEN 3: HOME DASHBOARD */}
        {page === "home" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left / Primary Column */}
            <div className="space-y-4 lg:col-span-7">
              {/* Rider Identity + Online Switch */}
              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#FFF3EE] text-base font-extrabold text-[#FF5A1F] shrink-0">
                      {riderInitial}
                    </span>
                    <div className="min-w-0">
                      <h1 className="truncate text-base font-extrabold text-stone-900">
                        {dashboard.profile.full_name}
                      </h1>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>
                          Verified Partner ·{" "}
                          {dashboard.earnings.allTime?.deliveries ??
                            dashboard.history.length}{" "}
                          {(dashboard.earnings.allTime?.deliveries ??
                            dashboard.history.length) === 1
                            ? "trip"
                            : "trips"}{" "}
                          completed
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage("profile")}
                    className="text-xs font-bold text-[#FF5A1F] hover:underline shrink-0"
                  >
                    Profile
                  </button>
                </div>

                {/* Online Status Toggle Bar (Screen 3) */}
                <div
                  className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
                    online
                      ? "border-emerald-200 bg-[#EAF7EE]"
                      : "border-stone-200 bg-[#FAFAFA]"
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${
                      online ? "text-[#15803D]" : "text-stone-600"
                    }`}
                  >
                    {online ? "Online · Accepting Orders" : "Offline · Paused"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={online}
                    aria-label="Toggle delivery availability"
                    disabled={busy}
                    onClick={() => void toggleAvailability()}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      online ? "bg-[#15803D]" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                        online ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </section>

              {/* 2x2 Color-Tinted KPI Grid (Screen 3) */}
              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#EFF6FF] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#2563EB] shadow-xs shrink-0">
                      <Package className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="tabular-nums text-xl font-extrabold text-stone-900">
                        {deliveriesToday}
                      </p>
                      <p className="text-[11px] font-medium text-stone-600">
                        Deliveries Today
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#EAF7EE] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#15803D] shadow-xs shrink-0">
                      <Wallet className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="tabular-nums text-xl font-extrabold text-stone-900">
                        {formatRupees(earningsToday)}
                      </p>
                      <p className="text-[11px] font-medium text-stone-600">
                        Today&apos;s Earnings
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#FFF3EE] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#FF5A1F] shadow-xs shrink-0">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="tabular-nums text-xl font-extrabold text-stone-900">
                        {dashboard.available.length}
                      </p>
                      <p className="text-[11px] font-medium text-stone-600">
                        Ready Pickups
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#FEF9EC] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#D97706] shadow-xs shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="tabular-nums text-xl font-extrabold text-stone-900">
                        {completionRate}%
                      </p>
                      <p className="text-[11px] font-medium text-stone-600">
                        Completion Rate
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Primary Availability CTA (Screen 3) */}
              <button
                type="button"
                disabled={busy}
                onClick={() => void toggleAvailability()}
                className={`min-h-[48px] w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm transition disabled:opacity-60 ${
                  online
                    ? "bg-[#FF5A1F] shadow-[#FF5A1F]/25 hover:bg-[#E54910]"
                    : "bg-[#15803D] shadow-[#15803D]/20 hover:bg-[#166534]"
                }`}
              >
                {online ? "Go Offline" : "Go Online Now"}
              </button>

              {/* Today's Incentives Card (Screen 3) */}
              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-stone-900">
                    Today&apos;s Incentives
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPage("earnings")}
                    className="text-xs font-bold text-[#FF5A1F] hover:underline"
                  >
                    View Earnings
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3.5 rounded-xl bg-[#FAFAFA] p-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF7EE] text-[#15803D] shrink-0">
                    <Award className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-stone-900 tabular-nums">
                        {incentive.completed}/{incentive.target} deliveries
                      </span>
                      <span className="text-[#15803D] tabular-nums">
                        {formatRupees(incentive.bonusPaise)} Bonus
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-[#15803D] transition-all"
                        style={{ width: `${incentive.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Active Delivery + Ready Pickups */}
            <div className="space-y-4 lg:col-span-5">
              {dashboard.active.length > 0 && (
                <section className="rounded-2xl border border-[#15803D]/35 bg-[#EAF7EE] p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold text-[#15803D]">
                      Active Delivery in Progress
                    </p>
                    <span className="text-xs font-bold text-[#15803D] tabular-nums">
                      {formatRupees(dashboard.active[0].delivery_fee_paise)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-extrabold text-stone-900">
                    #{dashboard.active[0].order_no} ·{" "}
                    {dashboard.active[0].shop_name}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-600">
                    Deliver to {dashboard.active[0].customer_name} ·{" "}
                    {dashboard.active[0].address_line}
                  </p>
                  <button
                    type="button"
                    onClick={() => openContinueFlow(dashboard.active[0])}
                    className="mt-3 min-h-[44px] w-full rounded-xl bg-[#15803D] py-2.5 text-xs font-bold text-white hover:bg-[#166534]"
                  >
                    {dashboard.active[0].assignment_status === "picked_up"
                      ? "Continue to Delivery Map"
                      : "Continue Pickup"}
                  </button>
                </section>
              )}

              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-stone-900">
                    Ready for Pickup ({dashboard.available.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPage("orders")}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-[#FF5A1F] hover:underline"
                  >
                    <span>All Orders</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 divide-y divide-stone-100">
                  {dashboard.available.slice(0, 4).map((order) => {
                    const route = estimateRouteEta(
                      order.shop_address,
                      order.address_line
                    );
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => openOrderDetails(order)}
                        className="flex w-full items-center gap-3 py-3 text-left hover:bg-[#FAFAFA] rounded-xl px-1 transition"
                      >
                        <ProductImage
                          src={order.shop_image || "/images/hero-market.jpg"}
                          name={order.shop_name}
                          className="h-11 w-11 rounded-xl object-cover shrink-0 bg-[#FFF3EE]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-extrabold text-stone-900 tabular-nums">
                              #{order.order_no} · {order.shop_name}
                            </p>
                            <span className="tabular-nums text-xs font-extrabold text-[#15803D] shrink-0">
                              {formatRupees(order.delivery_fee_paise)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-stone-500">
                            {order.address_line} · {order.item_count} item
                            {order.item_count === 1 ? "" : "s"} ·{" "}
                            {route.distanceLabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  {!dashboard.available.length && (
                    <div className="py-8 text-center">
                      <p className="text-xs font-semibold text-stone-500">
                        No ready orders awaiting pickup right now.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPage("history")}
                        className="mt-2 text-xs font-bold text-[#FF5A1F] hover:underline"
                      >
                        View completed trip history
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* SCREEN 4: NEW ORDERS QUEUE */}
        {page === "orders" && (
          <RiderOrdersQueue
            available={dashboard.available}
            active={dashboard.active}
            online={online}
            busy={busy}
            onSelectOrder={openOrderDetails}
            onAcceptOrder={(order) => void acceptOrder(order)}
            onContinueOrder={openContinueFlow}
            onGoOnline={() => void toggleAvailability()}
          />
        )}

        {/* SCREEN 5: ORDER DETAILS */}
        {page === "order-detail" && selected && (
          <RiderOrderDetailsView
            order={selected}
            items={orderItems}
            loadingItems={loadingItems}
            online={online}
            busy={busy}
            onAcceptOrder={() => void acceptOrder(selected)}
            onStartPickup={() => {
              setPickedChecked(false);
              setPage("pickup");
            }}
            onOpenMap={() => setPage("map")}
          />
        )}

        {/* SCREEN 6: PICKUP ORDER */}
        {page === "pickup" && selected && (
          <RiderPickupView
            order={selected}
            items={orderItems}
            pickedChecked={pickedChecked}
            busy={busy}
            onToggleChecked={setPickedChecked}
            onConfirmPickup={() => void confirmPickup()}
          />
        )}

        {/* SCREEN 7: DELIVER TO CUSTOMER (MAP) */}
        {page === "map" && selected && (
          <RiderDeliverMapView
            order={selected}
            onProceedHandover={() => setPage("deliver")}
          />
        )}

        {/* SCREEN 8: DELIVER ORDER (HANDOVER) */}
        {page === "deliver" && selected && (
          <RiderDeliverHandoverView
            order={selected}
            busy={busy}
            onMarkDelivered={() => void markDelivered()}
            onBackToMap={() => setPage("map")}
          />
        )}

        {/* SCREEN 9: EARNINGS */}
        {page === "earnings" && <RiderEarningsView dashboard={dashboard} />}

        {/* SCREEN 10: MY ORDERS HISTORY */}
        {page === "history" && (
          <RiderOrderHistoryView
            active={dashboard.active}
            history={dashboard.history}
            onSelectOrder={openOrderDetails}
          />
        )}

        {/* SCREEN 11: MY PROFILE */}
        {page === "profile" && (
          <RiderProfileView
            profile={dashboard.profile}
            deliveriesToday={deliveriesToday}
            online={online}
            busy={busy}
            onSaveProfile={saveProfile}
            onToggleOnline={() => void toggleAvailability()}
            onNavigate={(next) => setPage(next)}
            onLogout={() => void logout()}
          />
        )}

        {/* SCREEN 12: MORE HUB */}
        {page === "more" && (
          <RiderMoreView
            unreadCount={unreadCount}
            deliveriesToday={deliveriesToday}
            onNavigate={(next) => setPage(next)}
          />
        )}

        {page === "notifications" && (
          <RiderNotificationsView
            notifications={notifications}
            onMarkAllRead={() => void markAllNotificationsRead()}
          />
        )}

        {page === "support" && (
          <RiderSupportView
            busy={busy}
            onSubmitTicket={submitSupportTicket}
          />
        )}
      </main>

      <RiderBottomNav
        activeMain={activeMain}
        queueCount={queueCount}
        onNavigate={(next) => setPage(next)}
      />
    </div>
  );
}
