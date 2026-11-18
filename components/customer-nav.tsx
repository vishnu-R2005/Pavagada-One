"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Home,
  MapPin,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const navItems = [
  { href: "/customer", label: "Home", icon: Home },
  { href: "/customer/shops", label: "Shops", icon: Store },
  { href: "/customer/orders", label: "Orders", icon: ClipboardList },
  { href: "/customer/account", label: "Profile", icon: User },
];

export function CustomerHeader({
  locationName = "Pavagada Town",
  cartCount = 0,
  title,
  backHref,
  onBack,
  rightSlot,
}: {
  locationName?: string;
  cartCount?: number;
  title?: string;
  backHref?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const isHome = path === "/customer" && !title;

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      {/* Mobile Header */}
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:hidden">
        {isHome ? (
          <>
            <Link
              href="/customer/location"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-stone-900 whitespace-nowrap"
            >
              <MapPin className="h-4 w-4 text-[#FF5A1F] shrink-0" />
              <span className="max-w-[190px] truncate">{locationName}</span>
              <ChevronDown className="h-4 w-4 text-stone-500 shrink-0" />
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/customer/notifications"
                aria-label="Notifications"
                className="grid h-11 w-11 place-items-center rounded-xl text-stone-800 hover:bg-stone-100"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                href="/customer/cart"
                aria-label="View Cart"
                className="relative grid h-11 w-11 place-items-center rounded-xl text-stone-800 hover:bg-stone-100"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-bold text-white tabular-nums">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </>
        ) : (
          <>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="grid h-11 w-11 -ml-2 place-items-center rounded-xl text-stone-800 hover:bg-stone-100 shrink-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : (
              <Link
                href={backHref || "/customer"}
                onClick={(e) => {
                  if (!backHref) {
                    e.preventDefault();
                    router.back();
                  }
                }}
                aria-label="Go back"
                className="grid h-11 w-11 -ml-2 place-items-center rounded-xl text-stone-800 hover:bg-stone-100 shrink-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </Link>
            )}

            <h1 className="flex-1 truncate text-center text-base font-bold text-stone-900">
              {title || "Pavagada One"}
            </h1>

            <div className="flex min-w-[44px] items-center justify-end shrink-0">
              {rightSlot || (
                <Link
                  href="/customer/cart"
                  aria-label="View Cart"
                  className="relative grid h-11 w-11 place-items-center rounded-xl text-stone-800 hover:bg-stone-100"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-bold text-white tabular-nums">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop 3-Zone Top Bar */}
      <div className="mx-auto hidden max-w-6xl items-center justify-between gap-8 px-8 py-3.5 md:flex">
        <BrandLogo href="/customer" size="sm" />

        <nav className="flex items-center gap-7">
          {navItems.map((item) => {
            const active =
              item.href === "/customer"
                ? path === "/customer"
                : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap shrink-0 text-sm font-semibold transition-colors ${
                  active
                    ? "text-[#FF5A1F] underline underline-offset-8 decoration-2"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/customer/location"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:border-[#FF5A1F]/40 transition-colors whitespace-nowrap shrink-0 max-w-[175px]"
          >
            <MapPin className="h-3.5 w-3.5 text-[#FF5A1F] shrink-0" />
            <span className="truncate">{locationName}</span>
          </Link>

          <Link
            href="/customer/notifications"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:border-[#FF5A1F]/40 transition-colors shrink-0"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <Link
            href="/customer/cart"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-white hover:bg-[#E54910] transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-[#FF5A1F]/20"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="tabular-nums font-mono text-[11px] opacity-95">
                ({cartCount})
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function CustomerNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Customer navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 px-2 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-[60px] max-w-md grid-cols-4">
        {navItems.map((item) => {
          const active =
            item.href === "/customer"
              ? path === "/customer"
              : path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold transition-colors ${
                active ? "text-[#FF5A1F]" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 1.75} />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
