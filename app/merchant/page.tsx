"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { MerchantLogin } from "@/components/merchant/merchant-login";
import {
  MerchantBottomNav,
  MerchantHeader,
} from "@/components/merchant/merchant-nav";
import { MerchantAnalytics } from "@/components/merchant/merchant-analytics";
import {
  MerchantOrderDetailView,
  MerchantOrderStatusView,
  MerchantOrdersList,
} from "@/components/merchant/merchant-orders";
import {
  MerchantProductForm,
  MerchantProductsList,
} from "@/components/merchant/merchant-products";
import {
  MerchantEditShopForm,
  MerchantMoreView,
  MerchantNotificationsView,
  MerchantProfileView,
  MerchantSettingsView,
  MerchantSupportView,
} from "@/components/merchant/merchant-account";
import type {
  Category,
  Dashboard,
  MerchantNotification,
  MerchantOrder,
  MerchantPage,
  OrderDetail,
  Product,
  Shop,
} from "@/components/merchant/types";
import {
  calculateMerchantEarnings,
  formatRupees,
  getMerchantOrderLabel,
} from "@/lib/merchant-ui";
import { apiFetch } from "@/lib/client-session";

export default function MerchantPageView() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<MerchantNotification[]>(
    []
  );

  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<MerchantPage>("home");
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<
    "today" | "week" | "month"
  >("today");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setError("");
    try {
      const sessionRes = await apiFetch("/api/auth/session");
      const sessionBody = await sessionRes.json().catch(() => ({}));
      const sessionUser = sessionBody.user as
        | { id: string; fullName: string; role: string }
        | null
        | undefined;

      if (!sessionUser) {
        setAuthRequired(true);
        return;
      }

      if (sessionUser.role !== "merchant") {
        setError(
          `Forbidden: currently signed in as ${sessionUser.role}. Sign in with a Shop Partner account.`
        );
        setAuthRequired(true);
        return;
      }

      setOwnerName(sessionUser.fullName || "");

      const [shopRes, prodRes, ordersRes, dashRes, catRes, notifRes] =
        await Promise.all([
          apiFetch("/api/merchant/shop"),
          apiFetch("/api/merchant/products"),
          apiFetch("/api/merchant/orders"),
          apiFetch("/api/merchant/dashboard"),
          apiFetch("/api/catalog"),
          apiFetch("/api/notifications"),
        ]);

      if (shopRes.status === 401 || shopRes.status === 403) {
        setAuthRequired(true);
        return;
      }

      if (!shopRes.ok) {
        const body = await shopRes.json().catch(() => ({}));
        throw new Error(body.error || "Unable to load shop data.");
      }

      setAuthRequired(false);

      const [
        shopBody,
        prodBody,
        ordersBody,
        dashBody,
        catBody,
        notifBody,
      ] = await Promise.all([
        shopRes.json().catch(() => ({})),
        prodRes.json().catch(() => ({})),
        ordersRes.json().catch(() => ({})),
        dashRes.json().catch(() => ({})),
        catRes.json().catch(() => ({})),
        notifRes.json().catch(() => ({})),
      ]);

      setShop(shopBody.shop ?? null);
      setProducts(prodBody.products ?? []);
      setOrders(ordersBody.orders ?? []);
      setDashboard(dashBody.sales ? dashBody : null);
      setCategories(catBody.categories ?? []);
      setNotifications(notifBody.notifications ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load merchant portal."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const activeMain: "home" | "orders" | "products" | "analytics" | "more" =
    useMemo(() => {
      if (page === "orders" || page === "order-detail" || page === "order-status")
        return "orders";
      if (page === "products" || page === "product-form") return "products";
      if (page === "analytics") return "analytics";
      if (
        page === "more" ||
        page === "profile" ||
        page === "edit-profile" ||
        page === "settings" ||
        page === "notifications" ||
        page === "support"
      )
        return "more";
      return "home";
    }, [page]);

  const newOrderCount = useMemo(
    () => orders.filter((o) => o.status === "placed").length,
    [orders]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  function flash(msg: string) {
    setError("");
    setNotice(msg);
  }

  async function toggleShopOpen() {
    if (!shop) return;
    setBusyId("shop-open");
    try {
      const nextOpen = !Boolean(shop.is_open);
      const res = await apiFetch("/api/merchant/shop", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: shop.name,
          phone: shop.phone,
          address: shop.address,
          isOpen: nextOpen,
          openingHours: shop.opening_hours || undefined,
          deliveryAvailable: shop.delivery_available !== 0,
          imageUrl: shop.image_url || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to update shop status.");
      flash(nextOpen ? "Shop is now Open for orders." : "Shop is paused.");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update shop.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleDelivery() {
    if (!shop) return;
    setBusyId("shop-delivery");
    try {
      const nextDelivery = shop.delivery_available === 0;
      const res = await apiFetch("/api/merchant/shop", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: shop.name,
          phone: shop.phone,
          address: shop.address,
          isOpen: Boolean(shop.is_open),
          openingHours: shop.opening_hours || undefined,
          deliveryAvailable: nextDelivery,
          imageUrl: shop.image_url || undefined,
        }),
      });
      if (!res.ok) throw new Error("Unable to update delivery setting.");
      flash(
        nextDelivery
          ? "Local rider delivery enabled."
          : "Switched to pickup only."
      );
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update delivery."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function saveShopProfile(payload: {
    name: string;
    phone: string;
    address: string;
    openingHours?: string;
    isOpen: boolean;
    deliveryAvailable: boolean;
    imageUrl?: string | null;
  }) {
    setSavingForm(true);
    setError("");
    try {
      const res = await apiFetch("/api/merchant/shop", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to save shop profile.");
      flash("Shop profile saved.");
      setPage("profile");
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save shop profile."
      );
    } finally {
      setSavingForm(false);
    }
  }

  async function openOrder(
    orderId: string,
    target: "detail" | "status" = "detail"
  ) {
    setBusyId(orderId);
    setError("");
    try {
      const res = await apiFetch(`/api/merchant/orders/${orderId}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to load order.");
      setDetail(body);
      setPage(target === "status" ? "order-status" : "order-detail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateOrderStatus(
    orderId: string,
    nextStatus: string,
    stayOnStatusView = false
  ) {
    setBusyId(orderId);
    setError("");
    try {
      const res = await apiFetch(`/api/merchant/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to update order.");
      flash(`Order updated to ${getMerchantOrderLabel(nextStatus)}.`);
      await loadAll();
      if (detail?.order.id === orderId || stayOnStatusView) {
        const refreshed = await apiFetch(`/api/merchant/orders/${orderId}`);
        if (refreshed.ok) {
          setDetail(await refreshed.json());
          if (stayOnStatusView) setPage("order-status");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAcceptAndTrack(orderId: string) {
    await updateOrderStatus(orderId, "accepted", true);
  }

  async function toggleProductActive(product: Product) {
    setBusyId(product.id);
    setError("");
    try {
      const res = await apiFetch(`/api/merchant/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          categoryId: product.category_id ?? null,
          description: product.description ?? undefined,
          pricePaise: product.price_paise,
          stock: product.quantity,
          lowStockThreshold: product.low_stock_threshold ?? 5,
          unit: product.unit ?? null,
          imageUrl: product.image_url ?? null,
          isActive: !product.is_active,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to update product.");
      flash(
        product.is_active
          ? `${product.name} marked out of stock.`
          : `${product.name} is now in stock.`
      );
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveProduct(payload: {
    name: string;
    categoryId: string | null;
    pricePaise: number;
    stock: number;
    lowStockThreshold: number;
    unit: string | null;
    description?: string;
    imageUrl?: string | null;
    isActive: boolean;
  }) {
    setSavingForm(true);
    setError("");
    try {
      const targetUrl = editingProduct
        ? `/api/merchant/products/${editingProduct.id}`
        : "/api/merchant/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await apiFetch(targetUrl, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to save product.");

      if (!editingProduct && !payload.isActive && body.id) {
        await apiFetch(`/api/merchant/products/${body.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      flash(
        editingProduct
          ? "Product updated successfully."
          : "New product added to your storefront."
      );
      setEditingProduct(null);
      setPage("products");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setSavingForm(false);
    }
  }

  async function markAllNotificationsRead() {
    await apiFetch("/api/notifications", { method: "PATCH" });
    await loadAll();
  }

  async function submitSupportTicket(subject: string, detailText: string) {
    setSavingForm(true);
    setError("");
    try {
      const res = await apiFetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "support",
          subject,
          detail: detailText,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to send ticket.");
      flash("Support ticket submitted to Pavagada One operations.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit support ticket."
      );
    } finally {
      setSavingForm(false);
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setShop(null);
    setAuthRequired(true);
    setPage("home");
  }

  function handleBack() {
    if (page === "order-status") setPage("order-detail");
    else if (page === "order-detail") setPage("orders");
    else if (page === "product-form") setPage("products");
    else if (page === "edit-profile") setPage("profile");
    else if (
      page === "profile" ||
      page === "settings" ||
      page === "notifications" ||
      page === "support"
    )
      setPage("more");
    else setPage("home");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAFAFA] p-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-[#FFF3EE]" />
          <p className="text-sm font-semibold text-stone-500">
            Loading Shop Partner Portal…
          </p>
        </div>
      </main>
    );
  }

  if (authRequired) {
    return (
      <MerchantLogin
        errorMessage={error || undefined}
        onSignedIn={() => {
          setLoading(true);
          void loadAll();
        }}
        onSwitchAccount={() => void logout()}
      />
    );
  }

  if (!shop) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAFAFA] p-6">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm space-y-4">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="font-display text-xl font-bold text-stone-900">
            No Shop Assigned Yet
          </h1>
          <p className="text-xs leading-relaxed text-stone-500">
            Your merchant account is active, but no storefront is linked yet.
            Contact Pavagada One Admin or switch to the demo Shop Partner account.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="min-h-[46px] w-full rounded-xl bg-[#FF5A1F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#E54910]"
          >
            Sign Out &amp; Switch Account
          </button>
        </div>
      </main>
    );
  }

  const todayStats = dashboard?.sales.today ?? { orders: 0, revenue: 0 };
  const todayEarnings = calculateMerchantEarnings(Number(todayStats.revenue));
  const todayDateString = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 text-stone-900 md:pb-12">
      <MerchantHeader
        shop={shop}
        page={page}
        activeMain={activeMain}
        newOrderCount={newOrderCount}
        unreadNotifications={unreadNotifications}
        isEditingProduct={Boolean(editingProduct)}
        onNavigate={(next) => {
          setNotice("");
          setPage(next);
        }}
        onBack={handleBack}
        onToggleShopStatus={() => void toggleShopOpen()}
      />

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-7">
        {/* Feedback Banners */}
        {notice && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#BBF7D0] bg-[#EAF7EE] px-4 py-2.5 text-xs font-semibold text-[#15803D]">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="ml-3 text-[11px] font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-3 text-[11px] font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SCREEN 2: MERCHANT HOME */}
        {page === "home" && (
          <div className="space-y-5">
            {/* Mint-Green Shop Open Switch Banner (Screen 2) */}
            <section
              className={`flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-xs transition-colors ${
                shop.is_open
                  ? "border-[#BBF7D0] bg-[#DCFCE7]"
                  : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl shrink-0 ${
                    shop.is_open
                      ? "bg-[#15803D] text-white"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <p
                    className={`text-sm font-extrabold ${
                      shop.is_open ? "text-[#14532D]" : "text-stone-900"
                    }`}
                  >
                    {shop.is_open ? "Shop is Open" : "Shop is Paused"}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      shop.is_open ? "text-[#166534]" : "text-stone-500"
                    }`}
                  >
                    {shop.is_open
                      ? "You will receive new orders"
                      : "Customers see your shop as temporarily closed"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={Boolean(shop.is_open)}
                aria-label="Toggle Shop Open Status"
                disabled={busyId === "shop-open"}
                onClick={() => void toggleShopOpen()}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${
                  shop.is_open ? "bg-[#15803D]" : "bg-stone-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                    shop.is_open ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </section>

            {/* Date + View Analytics Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-600">
                Today, {todayDateString}
              </span>
              <button
                type="button"
                onClick={() => setPage("analytics")}
                className="inline-flex items-center gap-0.5 font-bold text-[#FF5A1F] hover:underline"
              >
                View Analytics
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 2x2 Pastel Metric Tiles (4-column on lg desktop) */}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setPage("orders")}
                className="flex items-center gap-3 rounded-2xl border border-[#FED7AA] bg-[#FFF4EC] p-4 text-left shadow-xs transition hover:border-[#FF5A1F]/40"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FF5A1F] text-white shrink-0">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="tabular-nums text-xl font-extrabold text-stone-900">
                    {newOrderCount}
                  </p>
                  <p className="truncate text-xs font-semibold text-stone-600">
                    New Orders
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPage("orders")}
                className="flex items-center gap-3 rounded-2xl border border-[#BBF7D0] bg-[#ECFDF3] p-4 text-left shadow-xs transition hover:border-[#15803D]/40"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#15803D] text-white shrink-0">
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="tabular-nums text-xl font-extrabold text-stone-900">
                    {todayStats.orders}
                  </p>
                  <p className="truncate text-xs font-semibold text-stone-600">
                    Today&apos;s Orders
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPage("analytics")}
                className="flex items-center gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-left shadow-xs transition hover:border-blue-400"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563EB] text-white shrink-0">
                  <IndianRupee className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="tabular-nums text-xl font-extrabold text-stone-900">
                    {formatRupees(Number(todayStats.revenue))}
                  </p>
                  <p className="truncate text-xs font-semibold text-stone-600">
                    Today&apos;s Sales
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPage("analytics")}
                className="flex items-center gap-3 rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] p-4 text-left shadow-xs transition hover:border-purple-400"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#7C3AED] text-white shrink-0">
                  <Wallet className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="tabular-nums text-xl font-extrabold text-stone-900">
                    {formatRupees(todayEarnings.netEarnings)}
                  </p>
                  <p className="truncate text-xs font-semibold text-stone-600">
                    Your Earnings
                  </p>
                </div>
              </button>
            </section>

            {/* 4 Quick Action Tiles */}
            <section className="grid grid-cols-4 gap-2.5 sm:gap-4">
              {(
                [
                  {
                    label: "Products",
                    icon: Package,
                    bg: "bg-[#FFF3EE] text-[#FF5A1F]",
                    onClick: () => setPage("products"),
                  },
                  {
                    label: "Orders",
                    icon: ClipboardList,
                    bg: "bg-[#EFF6FF] text-[#2563EB]",
                    onClick: () => setPage("orders"),
                  },
                  {
                    label: "Earnings",
                    icon: TrendingUp,
                    bg: "bg-[#ECFDF3] text-[#15803D]",
                    onClick: () => setPage("analytics"),
                  },
                  {
                    label: "Edit Shop",
                    icon: Store,
                    bg: "bg-[#F5F3FF] text-[#7C3AED]",
                    onClick: () => setPage("profile"),
                  },
                ] as const
              ).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-3.5 text-center shadow-xs transition hover:border-[#FF5A1F]/40"
                  >
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-xl ${action.bg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-bold text-stone-700 sm:text-xs">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </section>

            {/* Recent Orders + Low-Stock Alerts */}
            <div className="grid gap-5 lg:grid-cols-12">
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs lg:col-span-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-stone-900">
                    Recent Orders
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPage("orders")}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-[#FF5A1F] hover:underline"
                  >
                    View All
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 divide-y divide-stone-100">
                  {orders.slice(0, 5).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => void openOrder(o.id, "detail")}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-stone-50/70 rounded-xl px-2 -mx-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-stone-900">
                          #{o.order_no}
                        </p>
                        <p className="truncate text-[11px] text-stone-500">
                          {o.customer_name || "Customer"} ·{" "}
                          {o.items?.length
                            ? `${o.items.length} ${
                                o.items.length === 1 ? "item" : "items"
                              }`
                            : "Order"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tabular-nums text-xs font-extrabold text-stone-900">
                          {formatRupees(o.total_paise)}
                        </p>
                        <span
                          className={`mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            o.status === "placed"
                              ? "bg-[#FFF3EE] text-[#FF5A1F]"
                              : o.status === "ready" || o.status === "delivered"
                                ? "bg-[#EAF7EE] text-[#15803D]"
                                : o.status === "cancelled"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-[#EFF6FF] text-[#2563EB]"
                          }`}
                        >
                          {getMerchantOrderLabel(o.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                  {orders.length === 0 && (
                    <p className="py-6 text-center text-xs text-stone-500">
                      No orders yet. Keep your shop Open to start receiving
                      orders.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs lg:col-span-5">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Low-Stock Alerts
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPage("products")}
                    className="text-xs font-bold text-[#FF5A1F] hover:underline"
                  >
                    Catalog
                  </button>
                </div>

                <div className="mt-3 divide-y divide-stone-100">
                  {dashboard?.lowStock?.length ? (
                    dashboard.lowStock.map((low) => {
                      const match = products.find((p) => p.id === low.id);
                      return (
                        <div
                          key={low.id}
                          className="flex items-center justify-between gap-2 py-2.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-stone-900">
                              {low.name}
                            </p>
                            <p className="text-[11px] text-amber-700">
                              {low.quantity} left (alert at{" "}
                              {low.low_stock_threshold ?? 5})
                            </p>
                          </div>
                          {match && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(match);
                                setPage("product-form");
                              }}
                              className="rounded-lg border border-[#FF5A1F]/40 bg-[#FFF8F5] px-2.5 py-1.5 text-[11px] font-bold text-[#FF5A1F] hover:bg-[#FFF3EE]"
                            >
                              Restock
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-6 text-center text-xs text-[#15803D] font-medium">
                      All storefront items are well stocked.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* SCREEN 3: ORDERS LIST */}
        {page === "orders" && (
          <MerchantOrdersList
            orders={orders}
            busyId={busyId}
            onSelectOrder={(orderId, view) => void openOrder(orderId, view)}
            onStatusChange={(orderId, nextStatus) =>
              void updateOrderStatus(orderId, nextStatus)
            }
            onAcceptAndTrack={(orderId) => void handleAcceptAndTrack(orderId)}
          />
        )}

        {/* SCREEN 4: ORDER DETAILS */}
        {page === "order-detail" && detail && (
          <MerchantOrderDetailView
            detail={detail}
            shop={shop}
            busyId={busyId}
            onAcceptAndTrack={(orderId) => void handleAcceptAndTrack(orderId)}
            onStatusChange={(orderId, nextStatus) =>
              void updateOrderStatus(orderId, nextStatus)
            }
            onOpenStatusFlow={() => setPage("order-status")}
          />
        )}

        {/* SCREEN 5: UPDATE ORDER STATUS */}
        {page === "order-status" && detail && (
          <MerchantOrderStatusView
            detail={detail}
            busyId={busyId}
            onStatusChange={(orderId, nextStatus) =>
              void updateOrderStatus(orderId, nextStatus, true)
            }
            onViewDetails={() => setPage("order-detail")}
          />
        )}

        {/* SCREEN 6: PRODUCTS LIST */}
        {page === "products" && (
          <MerchantProductsList
            products={products}
            onAddNew={() => {
              setEditingProduct(null);
              setPage("product-form");
            }}
            onEdit={(prod) => {
              setEditingProduct(prod);
              setPage("product-form");
            }}
            onToggleActive={(prod) => void toggleProductActive(prod)}
          />
        )}

        {/* SCREEN 7: ADD / EDIT PRODUCT */}
        {page === "product-form" && (
          <MerchantProductForm
            editingProduct={editingProduct}
            categories={categories}
            busy={savingForm}
            onSave={saveProduct}
            onCancel={() => {
              setEditingProduct(null);
              setPage("products");
            }}
          />
        )}

        {/* SCREEN 9: EARNINGS & ANALYTICS */}
        {page === "analytics" && (
          <MerchantAnalytics
            dashboard={dashboard}
            orders={orders}
            range={analyticsRange}
            onChangeRange={setAnalyticsRange}
          />
        )}

        {/* SCREEN 8: SHOP PROFILE */}
        {page === "profile" && (
          <MerchantProfileView
            shop={shop}
            ownerName={ownerName}
            onEdit={() => setPage("edit-profile")}
          />
        )}

        {page === "edit-profile" && (
          <MerchantEditShopForm
            shop={shop}
            busy={savingForm}
            onSave={saveShopProfile}
            onCancel={() => setPage("profile")}
          />
        )}

        {/* SCREEN 10: SHOP SETTINGS */}
        {page === "settings" && (
          <MerchantSettingsView
            shop={shop}
            onNavigate={setPage}
            onToggleDelivery={() => void toggleDelivery()}
          />
        )}

        {/* SCREEN 11: MORE MENU */}
        {page === "more" && (
          <MerchantMoreView
            shop={shop}
            onNavigate={setPage}
            onLogout={() => void logout()}
          />
        )}

        {page === "notifications" && (
          <MerchantNotificationsView
            notifications={notifications}
            onMarkAllRead={() => void markAllNotificationsRead()}
          />
        )}

        {page === "support" && (
          <MerchantSupportView
            busy={savingForm}
            onSubmitTicket={submitSupportTicket}
          />
        )}
      </main>

      <MerchantBottomNav
        activeMain={activeMain}
        newOrderCount={newOrderCount}
        onNavigate={(next) => {
          setNotice("");
          setPage(next);
        }}
      />
    </div>
  );
}
