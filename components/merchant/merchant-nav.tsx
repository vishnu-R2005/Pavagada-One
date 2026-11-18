"use client";

import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Home,
  MoreHorizontal,
  Package,
  Store,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import type { MerchantPage, Shop } from "@/components/merchant/types";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "products", label: "Products", icon: Package },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "more", label: "More", icon: MoreHorizontal },
] as const;

const SUBPAGE_TITLES: Partial<Record<MerchantPage, string>> = {
  orders: "Orders",
  "order-detail": "Order Details",
  "order-status": "Update Order Status",
  products: "Products",
  "product-form": "Product",
  analytics: "Earnings",
  more: "More",
  profile: "Shop Profile",
  "edit-profile": "Edit Shop Profile",
  settings: "Shop Settings",
  notifications: "Notifications",
  support: "Help & Support",
};

export function MerchantHeader({
  shop,
  page,
  activeMain,
  newOrderCount,
  unreadNotifications,
  isEditingProduct,
  onNavigate,
  onBack,
  onToggleShopStatus,
}: {
  shop: Shop;
  page: MerchantPage;
  activeMain: "home" | "orders" | "products" | "analytics" | "more";
  newOrderCount: number;
  unreadNotifications: number;
  isEditingProduct: boolean;
  onNavigate: (next: MerchantPage) => void;
  onBack: () => void;
  onToggleShopStatus: () => void;
}) {
  const pageTitle =
    page === "product-form"
      ? isEditingProduct
        ? "Edit Product"
        : "Add Product"
      : SUBPAGE_TITLES[page] || shop.name;

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      {/* Mobile Header (Screen 2 Home vs Screens 3-11 Subpages) */}
      <div className="flex h-14 items-center justify-between gap-2 px-4 md:hidden">
        {page === "home" ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="flex min-w-0 items-center gap-2.5 text-left"
            >
              {shop.image_url ? (
                <img
                  src={shop.image_url}
                  alt={shop.name}
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 rounded-full object-cover border border-stone-200 shrink-0"
                />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
                  <Store className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="max-w-[165px] truncate text-sm font-bold text-stone-900">
                    {shop.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                </div>
                <span
                  className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    shop.is_open
                      ? "bg-[#EAF7EE] text-[#15803D]"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {shop.is_open ? "Open" : "Paused"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("notifications")}
              aria-label="Notifications"
              className="relative grid h-11 w-11 place-items-center rounded-xl text-stone-800 hover:bg-stone-100 shrink-0"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-bold text-white tabular-nums">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={
                page === "orders" ||
                page === "products" ||
                page === "analytics" ||
                page === "more"
                  ? () => onNavigate("home")
                  : onBack
              }
              aria-label="Go back"
              className="grid h-11 w-11 -ml-2 place-items-center rounded-xl text-stone-800 hover:bg-stone-100 shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <h1 className="flex-1 truncate text-center text-base font-bold text-stone-900">
              {pageTitle}
            </h1>

            <div className="flex min-w-[44px] items-center justify-end shrink-0">
              {page === "orders" && (
                <button
                  type="button"
                  onClick={() => onNavigate("notifications")}
                  aria-label="Notifications"
                  className="relative grid h-10 w-10 place-items-center rounded-xl text-stone-800 hover:bg-stone-100"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#FF5A1F]" />
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop 3-Zone Top Bar */}
      <div className="mx-auto hidden max-w-6xl items-center justify-between gap-8 px-8 py-3.5 md:flex">
        <BrandLogo href="/merchant" size="sm" />

        <nav className="flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const active = activeMain === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap shrink-0 text-sm font-semibold transition-colors ${
                  active
                    ? "text-[#FF5A1F] underline underline-offset-8 decoration-2"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {item.id === "orders" && newOrderCount > 0
                  ? `Orders (${newOrderCount})`
                  : item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate("notifications")}
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:border-[#FF5A1F]/40 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-bold text-white tabular-nums">
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleShopStatus}
            className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 ${
              shop.is_open
                ? "bg-[#15803D] text-white hover:bg-[#166534]"
                : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {shop.is_open ? "Shop Open" : "Shop Paused"}
          </button>
        </div>
      </div>
    </header>
  );
}

export function MerchantBottomNav({
  activeMain,
  newOrderCount,
  onNavigate,
}: {
  activeMain: "home" | "orders" | "products" | "analytics" | "more";
  newOrderCount: number;
  onNavigate: (next: MerchantPage) => void;
}) {
  return (
    <nav
      aria-label="Merchant navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 px-1 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-[60px] max-w-md grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = activeMain === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold ${
                active
                  ? "text-[#FF5A1F]"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 1.75} />
                {item.id === "orders" && newOrderCount > 0 && (
                  <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[9px] font-bold text-white tabular-nums">
                    {newOrderCount}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
