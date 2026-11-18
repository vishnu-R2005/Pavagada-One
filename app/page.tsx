import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { BrandLogo, BrandPinMark } from "@/components/brand-logo";
import { ProductImage } from "@/components/product-image";
import { formatRupees } from "@/lib/customer-ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser().catch(() => null);
  let featuredProducts: Array<{
    id: string;
    name: string;
    unit: string | null;
    price_paise: number;
    image_url: string | null;
    shop_name: string;
  }> = [];

  try {
    const res = await query(
      `select p.id,p.name,p.unit,p.price_paise,p.image_url,s.name shop_name
       from products p
       join shops s on s.id=p.shop_id
       join inventory i on i.product_id=p.id
       where p.is_active=1 and s.is_approved=1 and s.is_open=1 and i.quantity>0
       order by p.created_at desc limit 4`
    );
    featuredProducts = res.rows as unknown as typeof featuredProducts;
  } catch {
    featuredProducts = [];
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900">
      {/* Desktop Header (hidden on mobile splash to preserve clean Screen 1 layout) */}
      <header className="sticky top-0 z-30 hidden border-b border-stone-200/80 bg-white/95 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-8 py-3.5">
          <BrandLogo href="/" size="md" />

          <nav className="flex items-center gap-7 text-sm font-semibold text-stone-600">
            <Link
              href="/customer"
              className="whitespace-nowrap shrink-0 hover:text-[#FF5A1F] transition-colors"
            >
              Storefront
            </Link>
            <Link
              href="/customer/shops"
              className="whitespace-nowrap shrink-0 hover:text-[#FF5A1F] transition-colors"
            >
              Local Shops
            </Link>
            <a
              href="#workflow"
              className="whitespace-nowrap shrink-0 hover:text-[#FF5A1F] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#portals"
              className="whitespace-nowrap shrink-0 hover:text-[#FF5A1F] transition-colors"
            >
              Partner Portals
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={user ? `/${user.role}` : "/sign-in"}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#FF5A1F] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#E54910] whitespace-nowrap shrink-0 shadow-sm shadow-[#FF5A1F]/25"
            >
              <span>{user ? "Open Dashboard" : "Sign in"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Mobile-First Welcome Screen (Screen 1) + Desktop Split Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#FFE7D1] via-[#FFF6EE] to-[#FFFFFF] md:border-b md:border-stone-200/80">
          {/* Subtle warm Pavagada horizon backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-10"
            style={{
              backgroundImage: "url('/images/hero-market.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              maskImage: "linear-gradient(to bottom, black 20%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 20%, transparent 100%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-12 md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-8 md:py-16">
            {/* Screen 1 Core Stack */}
            <div className="mx-auto flex max-w-md flex-col items-center text-center md:col-span-6 md:mx-0 md:max-w-none md:items-start md:text-left">
              <BrandPinMark size="xl" />

              <h1 className="mt-4 text-[42px] font-extrabold leading-[1.04] tracking-tight sm:text-5xl [text-wrap:balance]">
                <span className="block text-[#FF5A1F]">Pavagada</span>
                <span className="block text-[#15803D]">One</span>
              </h1>

              <p className="mt-3 text-base font-medium text-stone-700 sm:text-lg">
                Your Village. Everything Delivered.
              </p>

              {/* 3 Feature Tiles */}
              <div className="mt-9 grid w-full max-w-sm grid-cols-3 gap-3 md:max-w-md">
                <Link
                  href="/customer/shops"
                  className="flex flex-col items-center rounded-2xl bg-white/90 px-2 py-4 shadow-xs ring-1 ring-[#FF5A1F]/10 transition hover:ring-[#FF5A1F]/40"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF0E6] text-[#FF5A1F]">
                    <Store className="h-6 w-6" />
                  </span>
                  <span className="mt-2.5 text-xs font-semibold text-stone-800 whitespace-nowrap">
                    Local Shops
                  </span>
                </Link>

                <Link
                  href="/customer"
                  className="flex flex-col items-center rounded-2xl bg-white/90 px-2 py-4 shadow-xs ring-1 ring-[#FF5A1F]/10 transition hover:ring-[#FF5A1F]/40"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF0E6] text-[#FF5A1F]">
                    <ShoppingBag className="h-6 w-6" />
                  </span>
                  <span className="mt-2.5 text-xs font-semibold text-stone-800 whitespace-nowrap">
                    Fresh Products
                  </span>
                </Link>

                <Link
                  href="/customer/orders"
                  className="flex flex-col items-center rounded-2xl bg-white/90 px-2 py-4 shadow-xs ring-1 ring-[#FF5A1F]/10 transition hover:ring-[#FF5A1F]/40"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF0E6] text-[#FF5A1F]">
                    <Truck className="h-6 w-6" />
                  </span>
                  <span className="mt-2.5 text-xs font-semibold text-stone-800 whitespace-nowrap">
                    Fast Delivery
                  </span>
                </Link>
              </div>

              <div className="mt-9 w-full max-w-sm md:flex md:max-w-md md:items-center md:gap-3">
                <Link
                  href="/customer"
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5A1F] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-[#FF5A1F]/25 transition hover:bg-[#E54910] active:scale-[0.99]"
                >
                  <span>Get Started</span>
                </Link>
              </div>

              <p className="mt-4 text-sm font-medium text-stone-600">
                ನಮ್ಮ ಊರು, ನಮ್ಮ ಸೇವೆ
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-stone-600 md:justify-start">
                <Link
                  href={user ? `/${user.role}` : "/sign-in"}
                  className="text-[#FF5A1F] hover:underline"
                >
                  {user ? "Go to My Dashboard" : "Sign in to your account"}
                </Link>
                <span aria-hidden="true" className="text-stone-300">
                  ·
                </span>
                <Link href="/customer/location" className="hover:text-stone-900">
                  Select Delivery Area
                </Link>
              </div>
            </div>

            {/* Desktop Showcase Card */}
            <div className="mt-10 hidden md:col-span-6 md:mt-0 md:block">
              <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-3 shadow-sm">
                <img
                  src="/images/hero-market.jpg"
                  alt="Fresh groceries and produce delivered in Pavagada"
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
                <div className="mt-3 flex items-center justify-between px-2 pb-1">
                  <div>
                    <p className="text-sm font-bold text-stone-900">
                      Sri Lakshmi Super Mart & Neighbourhood Stores
                    </p>
                    <p className="text-xs text-stone-500">
                      Pavagada Town · Hirehalli · Kudligi Road · Nellikayannahatti
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#15803D] whitespace-nowrap">
                    20–30 mins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Storefront Preview (Desktop / Scrollable below splash) */}
        {featuredProducts.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-10 md:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                  Popular Essentials
                </h2>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                  Fresh local groceries ready for quick delivery across Pavagada.
                </p>
              </div>
              <Link
                href="/customer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5A1F] hover:underline whitespace-nowrap"
              >
                <span>Open Storefront</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/customer/products/${product.id}`}
                  className="group rounded-2xl border border-stone-200/80 bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#FF5A1F]/40 hover:shadow-sm"
                >
                  <ProductImage
                    src={product.image_url}
                    name={product.name}
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                  <div className="mt-2.5">
                    <p className="truncate text-[11px] font-medium text-stone-500">
                      {product.shop_name}
                    </p>
                    <h3 className="mt-0.5 truncate text-sm font-bold text-stone-900 group-hover:text-[#FF5A1F]">
                      {product.name}
                    </h3>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="tabular-nums font-mono text-sm font-bold text-stone-900">
                        {formatRupees(product.price_paise)}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {product.unit || "Standard"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Workflow & Partner Portals (Desktop / Scrolled Overview) */}
        <section
          id="workflow"
          className="border-t border-stone-200/80 bg-white py-12"
        >
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              One connected delivery workflow
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs text-stone-500 sm:text-sm">
              Customer orders, merchant packing, rider dispatch, and platform operations work in real time.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "01. Customer Orders",
                  "Browse local shops, lock stock atomically, and pay Cash on Delivery.",
                ],
                [
                  "02. Merchant Packs",
                  "Shops confirm incoming orders, pack fresh stock, and notify riders.",
                ],
                [
                  "03. Rider Delivers",
                  "Delivery partners claim ready pickups and confirm doorstep drop-off.",
                ],
                [
                  "04. Admin Oversees",
                  "Control tower manages shops, riders, promos, and refund requests.",
                ],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-stone-200/80 bg-[#FAFAFA] p-4"
                >
                  <h3 className="text-sm font-bold text-[#15803D]">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="portals"
          className="mx-auto max-w-6xl px-5 py-12 md:px-8"
        >
          <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            Portals by role
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Link
              href="/customer"
              className="rounded-2xl border border-stone-200/80 bg-white p-5 transition hover:border-[#FF5A1F]/40"
            >
              <ShoppingBag className="h-6 w-6 text-[#FF5A1F]" />
              <h3 className="mt-3 text-base font-bold">Customer Storefront</h3>
              <p className="mt-1.5 text-xs text-stone-500">
                Shop local groceries, select your Pavagada neighbourhood, and track orders live.
              </p>
            </Link>
            <Link
              href="/sign-in"
              className="rounded-2xl border border-stone-200/80 bg-white p-5 transition hover:border-[#FF5A1F]/40"
            >
              <Store className="h-6 w-6 text-[#FF5A1F]" />
              <h3 className="mt-3 text-base font-bold">Merchant Centre</h3>
              <p className="mt-1.5 text-xs text-stone-500">
                Accept orders, manage product catalog stock, and track daily shop revenue.
              </p>
            </Link>
            <Link
              href="/sign-in"
              className="rounded-2xl border border-stone-200/80 bg-white p-5 transition hover:border-[#FF5A1F]/40"
            >
              <Truck className="h-6 w-6 text-[#FF5A1F]" />
              <h3 className="mt-3 text-base font-bold">Rider & Operations</h3>
              <p className="mt-1.5 text-xs text-stone-500">
                Rider dispatch portal for pickups and deliveries plus Admin control tower.
              </p>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/80 bg-white py-7">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 sm:flex-row sm:items-center md:px-8">
          <BrandLogo href="/" size="sm" />
          <p className="text-xs text-stone-500">
            Pavagada One · ನಿಮ್ಮ ಊರು, ನಮ್ಮ ಸೇವೆ · Pavagada, Karnataka
          </p>
        </div>
      </footer>
    </div>
  );
}