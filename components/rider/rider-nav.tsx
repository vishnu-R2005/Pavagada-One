"use client";

import {
  Bell,
  ChevronLeft,
  ClipboardList,
  Home,
  Menu,
  User,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import type { RiderPage } from "@/components/rider/types";

const BOTTOM_NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "earnings", label: "Earnings", icon: Wallet },
  { id: "profile", label: "Profile", icon: User },
] as const;

const DESKTOP_NAV = [
  { id: "home", label: "Home" },
  { id: "orders", label: "Orders" },
  { id: "earnings", label: "Earnings" },
  { id: "profile", label: "Profile" },
  { id: "more", label: "More" },
] as const;

const PAGE_TITLES: Partial<Record<RiderPage, string>> = {
  orders: "New Orders",
  "order-detail": "Order Details",
  pickup: "Pickup Order",
  map: "Deliver to Customer",
  deliver: "Deliver Order",
  earnings: "Earnings",
  history: "My Orders",
  profile: "My Profile",
  more: "More",
  notifications: "Notifications",
  support: "Help & Support",
};

export function RiderHeader({
  page,
  activeMain,
  online,
  busy,
  queueCount,
  unreadCount,
  onNavigate,
  onBack,
  onToggleAvailability,
}: {
  page: RiderPage;
  activeMain: "home" | "orders" | "earnings" | "profile";
  online: boolean;
  busy: boolean;
  queueCount: number;
  unreadCount: number;
  onNavigate: (next: RiderPage) => void;
  onBack: () => void;
  onToggleAvailability: () => void;
}) {
  const title = PAGE_TITLES[page] || "Pavagada One";

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      {/* Mobile Header (Screen 2 Home vs Screens 4-12 Subpages) */}
      <div className="flex h-14 items-center justify-between gap-2 px-4 md:hidden">
        {page === "home" ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate("more")}
              aria-label="Open menu"
              className="grid h-11 w-11 -ml-2 place-items-center rounded-xl text-stone-800 hover:bg-stone-100 shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <BrandLogo href="/rider" size="sm" />

            <button
              type="button"
              onClick={() => onNavigate("notifications")}
              aria-label="Notifications"
              className="relative grid h-11 w-11 -mr-1 place-items-center rounded-xl text-stone-800 hover:bg-stone-100 shrink-0"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-bold text-white tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="grid h-11 w-11 -ml-2 place-items-center rounded-xl text-stone-800 hover:bg-stone-100 shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <h1 className="flex-1 truncate text-center text-base font-bold text-stone-900">
              {title}
            </h1>

            <div className="flex min-w-[44px] items-center justify-end shrink-0">
              {page === "orders" && (
                <button
                  type="button"
                  onClick={() => onNavigate("history")}
                  className="text-xs font-bold text-[#FF5A1F] whitespace-nowrap px-1"
                >
                  History
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop 3-Zone Top Bar */}
      <div className="mx-auto hidden max-w-6xl items-center justify-between gap-8 px-8 py-3.5 md:flex">
        <BrandLogo href="/rider" size="sm" />

        <nav className="flex items-center gap-7" aria-label="Rider navigation">
          {DESKTOP_NAV.map((item) => {
            const active =
              item.id === "more"
                ? page === "more" || page === "support" || page === "notifications"
                : activeMain === item.id && page !== "more";
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
                {item.id === "orders" && queueCount > 0
                  ? `Orders (${queueCount})`
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
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-bold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onToggleAvailability}
            className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 disabled:opacity-60 ${
              online
                ? "bg-[#15803D] text-white hover:bg-[#166534]"
                : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {online ? "Online" : "Offline"}
          </button>
        </div>
      </div>
    </header>
  );
}

export function RiderBottomNav({
  activeMain,
  queueCount,
  onNavigate,
}: {
  activeMain: "home" | "orders" | "earnings" | "profile";
  queueCount: number;
  onNavigate: (next: RiderPage) => void;
}) {
  return (
    <nav
      aria-label="Rider bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 px-2 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-[60px] max-w-md grid-cols-4">
        {BOTTOM_NAV.map((item) => {
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
                {item.id === "orders" && queueCount > 0 && (
                  <span className="absolute -right-2.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[9px] font-bold text-white tabular-nums">
                    {queueCount}
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
