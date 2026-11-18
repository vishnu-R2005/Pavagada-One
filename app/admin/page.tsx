"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  Store,
  Truck,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProductImage } from "@/components/product-image";
import { apiFetch } from "@/lib/client-session";

type Tab = "orders" | "shops" | "catalog" | "users" | "support";

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

export default function Admin() {
  const router = useRouter();
  const [data, setData] = useState<any>();
  const [tab, setTab] = useState<Tab>("orders");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderDatePreset, setOrderDatePreset] = useState("all");
  const [orderCustomDate, setOrderCustomDate] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponValue, setCouponValue] = useState("5000");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await apiFetch("/api/admin/dashboard");
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.replace("/sign-in");
        return;
      }
      if (!response.ok)
        throw new Error(body.error || "Unable to load admin operations.");
      setData(body);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load admin operations."
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(
    kind: string,
    id: string,
    action: string,
    value?: unknown
  ) {
    const response = await apiFetch("/api/admin/manage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, id, action, value }),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Changes saved." : body.error || "Unable to save.");
    await load();
  }

  async function decideApplication(
    id: string,
    status: "approved" | "rejected"
  ) {
    const response = await apiFetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setMessage(
      response.ok
        ? `Application ${status}.`
        : "Unable to process application."
    );
    await load();
  }

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    await act("category", "", categoryName.trim());
    setCategoryName("");
  }

  async function addCoupon(e: FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await act("coupon", couponCode.trim().toUpperCase(), "flat", Number(couponValue));
    setCouponCode("");
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.replace("/sign-in");
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAF8F5] p-6 text-center">
        <div className="max-w-sm rounded-3xl border border-[#14221B]/10 bg-white p-8">
          <Shield className="mx-auto h-10 w-10 text-[#0F5132]" />
          <h1 className="mt-4 font-display text-xl font-semibold">
            Admin Operations
          </h1>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-5 min-h-[44px] rounded-xl bg-[#0F5132] px-5 py-2.5 text-xs font-semibold text-white"
          >
            Sign out and switch account
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAF8F5] text-sm text-[#14221B]/60">
        Loading platform operations…
      </main>
    );
  }

  const riders: any[] = data.riders ?? [];
  const allOrders: any[] = data.orders ?? [];
  const filteredOrders = allOrders.filter((order: any) => {
    if (orderStatusFilter !== "all" && order.status !== orderStatusFilter) {
      return false;
    }

    const q = orderSearch.trim().toLowerCase();
    if (q) {
      const hay = `${order.order_no ?? ""} ${order.shop ?? ""} ${order.customer ?? ""} ${order.rider_name ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (orderDatePreset !== "all" && order.created_at) {
      const raw = String(order.created_at).trim();
      const normalized =
        !raw.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(raw)
          ? `${raw.replace(" ", "T")}Z`
          : raw;
      const parsed = new Date(normalized);
      if (!Number.isNaN(parsed.getTime())) {
        const toLocalDay = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const orderDay = toLocalDay(parsed);
        const todayDay = toLocalDay(new Date());

        if (orderDatePreset === "today" && orderDay !== todayDay) {
          return false;
        }
        if (orderDatePreset === "7d") {
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          if (parsed.getTime() < cutoff) return false;
        }
        if (orderDatePreset === "30d") {
          const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
          if (parsed.getTime() < cutoff) return false;
        }
        if (
          orderDatePreset === "custom" &&
          orderCustomDate &&
          orderDay !== orderCustomDate
        ) {
          return false;
        }
      }
    }

    return true;
  });

  const hasOrderFilters =
    orderSearch.trim() !== "" ||
    orderStatusFilter !== "all" ||
    orderDatePreset !== "all";

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14221B] pb-16">
      <header className="sticky top-0 z-30 border-b border-[#14221B]/10 bg-[#14221B] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5">
          <BrandLogo href="/admin" variant="light" size="sm" />

          <nav className="hidden items-center gap-6 md:flex text-xs font-medium text-white/75">
            {(
              [
                ["orders", "Orders & Dispatch"],
                ["shops", "Shops & Applications"],
                ["catalog", "Catalog & Promos"],
                ["users", "Users & Riders"],
                ["support", "Refunds & Support"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`whitespace-nowrap transition ${
                  tab === key
                    ? "text-white font-semibold underline underline-offset-8 decoration-2"
                    : "hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Refresh dashboard"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0F5132]">
              Platform Operations Console
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Pavagada One Control Tower
            </h1>
          </div>

          <div className="scrollbar-none flex gap-2 overflow-x-auto md:hidden">
            {(
              [
                ["orders", "Orders"],
                ["shops", "Shops"],
                ["catalog", "Catalog"],
                ["users", "Users"],
                ["support", "Support"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-h-[38px] whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold ${
                  tab === key
                    ? "bg-[#0F5132] text-white"
                    : "border border-[#14221B]/12 bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <button
            type="button"
            onClick={() => setMessage("")}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-xs font-semibold text-emerald-900"
          >
            <span>{message}</span>
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Executive KPI Strip */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric
            label="Gross Sales"
            value={money(data.sales?.gross_sales || 0)}
            icon={ShoppingBag}
          />
          <Metric
            label="Total Orders"
            value={String(data.sales?.order_count || 0)}
            icon={Package}
          />
          <Metric
            label="Open Shops"
            value={String(
              (data.shops ?? []).filter((s: any) => s.is_open && s.is_approved)
                .length
            )}
            icon={Store}
          />
          <Metric
            label="Online Riders"
            value={String(
              riders.filter((r: any) => Number(r.rider_available) === 1).length
            )}
            icon={Truck}
          />
        </section>

        {/* Tab 1: Orders & Dispatch */}
        {tab === "orders" && (
          <section className="mt-6 rounded-2xl border border-[#14221B]/10 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  Live Orders & Rider Dispatch
                </h2>
                <p className="text-xs text-[#14221B]/55">
                  Showing {filteredOrders.length} of {allOrders.length} orders
                </p>
              </div>
              {hasOrderFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderSearch("");
                    setOrderStatusFilter("all");
                    setOrderDatePreset("all");
                    setOrderCustomDate("");
                  }}
                  className="text-xs font-semibold text-[#0F5132] hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Search & Filter Controls */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex items-center gap-2 rounded-xl border border-[#14221B]/15 bg-[#FAF8F5] px-3.5 py-2 sm:col-span-2">
                <Search className="h-4 w-4 text-[#14221B]/45 shrink-0" />
                <input
                  type="search"
                  aria-label="Search orders"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order #, shop, customer, or rider…"
                  className="w-full bg-transparent text-xs outline-none"
                />
              </label>

              <select
                aria-label="Filter orders by status"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="rounded-xl border border-[#14221B]/15 bg-[#FAF8F5] px-3.5 py-2 text-xs font-medium outline-none focus:border-[#0F5132]"
              >
                <option value="all">All statuses</option>
                <option value="placed">Placed</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="assigned">Assigned</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div className="flex gap-2">
                <select
                  aria-label="Filter orders by date"
                  value={orderDatePreset}
                  onChange={(e) => setOrderDatePreset(e.target.value)}
                  className="w-full rounded-xl border border-[#14221B]/15 bg-[#FAF8F5] px-3.5 py-2 text-xs font-medium outline-none focus:border-[#0F5132]"
                >
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="custom">Specific date…</option>
                </select>
                {orderDatePreset === "custom" && (
                  <input
                    type="date"
                    aria-label="Select specific order date"
                    value={orderCustomDate}
                    onChange={(e) => setOrderCustomDate(e.target.value)}
                    className="rounded-xl border border-[#14221B]/15 bg-[#FAF8F5] px-2.5 py-2 text-xs outline-none focus:border-[#0F5132]"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 divide-y divide-[#14221B]/8">
              {filteredOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex flex-col justify-between gap-3 py-3.5 lg:flex-row lg:items-center"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold">
                      {order.order_no} · {money(order.total_paise)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#14221B]/60">
                      {order.shop} → {order.customer} ·{" "}
                      {order.rider_name
                        ? `Rider: ${order.rider_name}`
                        : "No rider assigned"}{" "}
                      ·{" "}
                      {order.created_at
                        ? new Date(
                            String(order.created_at).endsWith("Z")
                              ? order.created_at
                              : `${order.created_at}Z`
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      aria-label={`Assign rider for ${order.order_no}`}
                      value={order.rider_id ?? ""}
                      onChange={(e) => {
                        if (e.target.value)
                          void act("delivery", order.id, "assign", e.target.value);
                      }}
                      className="rounded-xl border border-[#14221B]/15 bg-[#FAF8F5] px-3 py-2 text-xs font-medium outline-none focus:border-[#0F5132]"
                    >
                      <option value="">Assign rider…</option>
                      {riders.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.full_name} {r.rider_available ? "(Online)" : "(Offline)"}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label={`Order status for ${order.order_no}`}
                      value={order.status}
                      onChange={(e) =>
                        void act("order", order.id, e.target.value)
                      }
                      className="rounded-xl border border-[#14221B]/15 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#0F5132]"
                    >
                      <option value="placed">placed</option>
                      <option value="accepted">accepted</option>
                      <option value="preparing">preparing</option>
                      <option value="ready">ready</option>
                      <option value="assigned">assigned</option>
                      <option value="out_for_delivery">out_for_delivery</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
              {!filteredOrders.length && (
                <p className="py-8 text-center text-xs text-[#14221B]/55">
                  {allOrders.length
                    ? "No orders match your current search or filter selection."
                    : "No orders placed yet."}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Tab 2: Shops & Applications */}
        {tab === "shops" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
              <h2 className="text-base font-semibold">Registered Shops</h2>
              <div className="mt-4 divide-y divide-[#14221B]/8">
                {(data.shops ?? []).map((shop: any) => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{shop.name}</p>
                      <p className="text-xs text-[#14221B]/60">
                        {shop.address} ·{" "}
                        {shop.is_approved ? "Approved" : "Suspended"} ·{" "}
                        {shop.is_open ? "Open" : "Closed"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void act(
                            "shop",
                            shop.id,
                            shop.is_approved ? "suspend" : "approve"
                          )
                        }
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                          shop.is_approved
                            ? "border border-rose-200 text-rose-700"
                            : "bg-[#0F5132] text-white"
                        }`}
                      >
                        {shop.is_approved ? "Suspend" : "Approve"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
              <h2 className="text-base font-semibold">
                Merchant Applications
              </h2>
              <div className="mt-4 divide-y divide-[#14221B]/8">
                {(data.applications ?? []).map((app: any) => (
                  <div key={app.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{app.shop_name}</p>
                        <p className="text-xs text-[#14221B]/60">
                          {app.applicant_name} ({app.applicant_email}) · {app.phone}
                        </p>
                        <p className="text-xs text-[#14221B]/55">{app.address}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#0F5132]">
                        {app.status}
                      </span>
                    </div>
                    {app.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void decideApplication(app.id, "approved")}
                          className="rounded-lg bg-[#0F5132] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Approve Shop
                        </button>
                        <button
                          type="button"
                          onClick={() => void decideApplication(app.id, "rejected")}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!(data.applications ?? []).length && (
                  <p className="py-6 text-xs text-[#14221B]/55">
                    No merchant applications yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Tab 3: Catalog, Categories & Promos */}
        {tab === "catalog" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5 lg:col-span-7">
              <h2 className="text-base font-semibold">
                Product Moderation
              </h2>
              <div className="mt-4 divide-y divide-[#14221B]/8">
                {(data.products ?? []).map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <ProductImage
                      src={product.image_url}
                      name={product.name}
                      className="h-12 w-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#14221B]/55">
                        {product.shop} · {money(product.price_paise)} ·{" "}
                        {product.quantity} in stock
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void act(
                          "product",
                          product.id,
                          product.is_active ? "deactivate" : "activate"
                        )
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                        product.is_active
                          ? "border border-[#14221B]/15 text-[#14221B]"
                          : "bg-[#0F5132] text-white"
                      }`}
                    >
                      {product.is_active ? "Hide" : "Activate"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-6 lg:col-span-5">
              <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
                <h2 className="text-base font-semibold">Categories</h2>
                <div className="mt-3 divide-y divide-[#14221B]/8">
                  {(data.categories ?? []).map((c: any) => (
                    <p key={c.id} className="py-2 text-xs font-medium">
                      {c.name}
                    </p>
                  ))}
                </div>
                <form onSubmit={addCategory} className="mt-4 flex gap-2">
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 rounded-xl border border-[#14221B]/15 px-3 py-2 text-xs outline-none focus:border-[#0F5132]"
                  />
                  <button className="inline-flex items-center gap-1 rounded-xl bg-[#0F5132] px-3.5 py-2 text-xs font-semibold text-white">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
                <h2 className="text-base font-semibold">Promo Coupons</h2>
                <div className="mt-3 divide-y divide-[#14221B]/8">
                  {(data.coupons ?? []).map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-2 text-xs"
                    >
                      <span className="font-mono font-semibold">{c.code}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#14221B]/60">
                          ₹{(Number(c.discount_value) / 100).toFixed(0)} off
                        </span>
                        <button
                          type="button"
                          onClick={() => void act("coupon", c.id, "toggle")}
                          className="text-[#0F5132] font-semibold hover:underline"
                        >
                          {c.active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={addCoupon} className="mt-4 flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="CODE (e.g. SAVE40)"
                    className="flex-1 rounded-xl border border-[#14221B]/15 px-3 py-2 text-xs uppercase outline-none focus:border-[#0F5132]"
                  />
                  <input
                    type="number"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    placeholder="Paise"
                    className="w-24 rounded-xl border border-[#14221B]/15 px-3 py-2 text-xs outline-none focus:border-[#0F5132]"
                  />
                  <button className="rounded-xl bg-[#0F5132] px-3.5 py-2 text-xs font-semibold text-white">
                    Create
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}

        {/* Tab 4: Users & Riders */}
        {tab === "users" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
              <h2 className="text-base font-semibold">Users & Roles</h2>
              <div className="mt-4 divide-y divide-[#14221B]/8">
                {(data.users ?? []).map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.full_name}
                      </p>
                      <p className="truncate text-xs text-[#14221B]/55">
                        {user.email}
                      </p>
                    </div>
                    <select
                      aria-label={`Role for ${user.full_name}`}
                      value={user.role}
                      onChange={(e) =>
                        void act("user", user.id, "role", e.target.value)
                      }
                      className="rounded-xl border border-[#14221B]/15 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#0F5132]"
                    >
                      <option value="customer">customer</option>
                      <option value="merchant">merchant</option>
                      <option value="rider">rider</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
              <h2 className="text-base font-semibold">Delivery Fleet</h2>
              <div className="mt-4 divide-y divide-[#14221B]/8">
                {riders.map((rider: any) => (
                  <div
                    key={rider.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{rider.full_name}</p>
                      <p className="text-xs text-[#14221B]/55">
                        {rider.phone || "No phone"} ·{" "}
                        {rider.rider_available ? "Online" : "Offline"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void act(
                          "rider",
                          rider.id,
                          rider.rider_available ? "unavailable" : "available"
                        )
                      }
                      className="rounded-xl border border-[#14221B]/15 px-3 py-1.5 text-xs font-semibold hover:border-[#0F5132]"
                    >
                      {rider.rider_available ? "Set Offline" : "Set Online"}
                    </button>
                  </div>
                ))}
                {!riders.length && (
                  <p className="py-6 text-xs text-[#14221B]/55">
                    No active riders found.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Tab 5: Refunds & Support */}
        {tab === "support" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
              <h2 className="text-base font-semibold">Refund Requests</h2>
              <div className="mt-4 divide-y divide-[#14221B]/8">
                {(data.refunds ?? []).map((refund: any) => (
                  <div
                    key={refund.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold">
                        {refund.order_no} · {refund.customer_name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#14221B]/65">
                        {refund.reason} ·{" "}
                        <span className="font-semibold text-[#0F5132]">
                          {refund.status}
                        </span>
                      </p>
                    </div>
                    {refund.status === "requested" && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void act("refund", refund.id, "approved")}
                          className="rounded-lg bg-[#0F5132] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void act("refund", refund.id, "rejected")}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!(data.refunds ?? []).length && (
                  <p className="py-6 text-xs text-[#14221B]/55">
                    No refund requests.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#14221B]/10 bg-white p-5">
              <h2 className="text-base font-semibold">Customer Support Cases</h2>
              <div className="mt-4 divide-y divide-[#14221B]/8">
                {(data.supportCases ?? []).map((c: any) => (
                  <div key={c.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{c.subject}</p>
                        <p className="text-xs text-[#14221B]/60">
                          {c.customer_name} · {c.status}
                        </p>
                      </div>
                      {c.status === "open" && (
                        <button
                          type="button"
                          onClick={() => void act("support", c.id, "resolved")}
                          className="rounded-lg bg-[#0F5132] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#14221B]/70">{c.detail}</p>
                  </div>
                ))}
                {!(data.supportCases ?? []).length && (
                  <p className="py-6 text-xs text-[#14221B]/55">
                    No support cases open.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[#14221B]/10 bg-white p-4">
      <div className="flex items-center justify-between text-xs text-[#14221B]/60">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-[#0F5132]" />
      </div>
      <b className="mt-2 block tabular-nums font-mono text-2xl font-semibold">
        {value}
      </b>
    </div>
  );
}
