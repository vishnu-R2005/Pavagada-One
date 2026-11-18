"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Apple,
  ArrowRight,
  Clock,
  Cookie,
  Croissant,
  Cross,
  Drumstick,
  LayoutGrid,
  Milk,
  Plus,
  Search,
  ShoppingBag,
  ShoppingBasket,
  Star,
  Store,
  X,
} from "lucide-react";
import { CustomerHeader, CustomerNav } from "@/components/customer-nav";
import { ProductImage } from "@/components/product-image";
import { apiFetch } from "@/lib/client-session";
import { formatRupees, matchQuickCategoryId } from "@/lib/customer-ui";

type Category = { id: string; name: string; image_url?: string | null };
type Shop = {
  id: string;
  name: string;
  address: string;
  image_url?: string | null;
  opening_hours?: string | null;
  is_open?: number;
};
type Product = {
  id: string;
  shop_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price_paise: number;
  quantity: number;
  image_url?: string | null;
  unit?: string | null;
};
type Cart = { item_id: string; product_id: string; quantity: number };

const QUICK_CATEGORIES = [
  {
    key: "groceries",
    label: "Groceries",
    keywords: ["grocer", "staple", "atta", "oil"],
    icon: ShoppingBasket,
    bg: "bg-[#ECFDF5]",
    tint: "text-[#15803D]",
  },
  {
    key: "fruits",
    label: "Fruits & Vegetables",
    keywords: ["fruit", "veget", "fresh", "produce"],
    icon: Apple,
    bg: "bg-[#FFF1F2]",
    tint: "text-[#E11D48]",
  },
  {
    key: "dairy",
    label: "Milk & Dairy",
    keywords: ["milk", "dairy", "egg", "curd"],
    icon: Milk,
    bg: "bg-[#EFF6FF]",
    tint: "text-[#2563EB]",
  },
  {
    key: "snacks",
    label: "Snacks",
    keywords: ["snack", "noodle", "biscuit", "tea"],
    icon: Cookie,
    bg: "bg-[#FEFCE8]",
    tint: "text-[#CA8A04]",
  },
  {
    key: "bakery",
    label: "Bakery",
    keywords: ["bak", "cake", "bread"],
    icon: Croissant,
    bg: "bg-[#FFF7ED]",
    tint: "text-[#EA580C]",
  },
  {
    key: "meat",
    label: "Meat & Eggs",
    keywords: ["meat", "egg", "chicken"],
    icon: Drumstick,
    bg: "bg-[#FEF2F2]",
    tint: "text-[#DC2626]",
  },
  {
    key: "pharmacy",
    label: "Pharmacy",
    keywords: ["pharm", "med", "health", "care"],
    icon: Cross,
    bg: "bg-[#F0FDFA]",
    tint: "text-[#0D9488]",
  },
  {
    key: "more",
    label: "More",
    keywords: [],
    icon: LayoutGrid,
    bg: "bg-[#F5F5F4]",
    tint: "text-stone-700",
  },
] as const;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  const body = await response
    .json()
    .catch(() => ({ error: "Unable to read the server response." }));
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

export default function CustomerHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeQuickKey, setActiveQuickKey] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(
    null
  );
  const [conflictProductId, setConflictProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("Pavagada Town");

  async function load() {
    setLoading(true);
    try {
      const [catalog, basket] = await Promise.all([
        api<{ categories: Category[]; shops: Shop[]; products: Product[] }>(
          "/api/catalog"
        ),
        api<{ items: Cart[] }>("/api/cart?optional=1").catch(() => ({ items: [] })),
      ]);
      setCategories(catalog.categories ?? []);
      setShops(catalog.shops ?? []);
      setProducts(catalog.products ?? []);
      setCart(basket.items ?? []);
    } catch (error) {
      setNotice({
        text:
          error instanceof Error
            ? error.message
            : "Unable to load shops right now.",
        tone: "err",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLocationName(
      window.localStorage.getItem("pavagada_delivery_area") || "Pavagada Town"
    );
    void load();
  }, []);

  async function add(productId: string) {
    setConflictProductId(null);
    try {
      await api("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setNotice({ text: "Added to your cart.", tone: "ok" });
      await load();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Unable to update your cart.";
      if (msg.toLowerCase().includes("one shop")) {
        setConflictProductId(productId);
      }
      setNotice({ text: msg, tone: "err" });
    }
  }

  async function switchShopAndAdd() {
    if (!conflictProductId) return;
    await api("/api/cart", { method: "DELETE" });
    const id = conflictProductId;
    setConflictProductId(null);
    await add(id);
  }

  function handleQuickCategory(item: (typeof QUICK_CATEGORIES)[number]) {
    if (item.key === "more" || activeQuickKey === item.key) {
      setActiveQuickKey("");
      setActiveCategory("");
      return;
    }
    setActiveQuickKey(item.key);
    const matchedId = matchQuickCategoryId([...item.keywords], categories);
    setActiveCategory(matchedId);
    if (!matchedId) {
      setSearch(item.label.split("&")[0].trim());
    } else {
      setSearch("");
    }
  }

  const shopMap = useMemo(
    () => new Map(shops.map((s) => [s.id, s])),
    [shops]
  );

  const filteredShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
  }, [shops, search]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchCat = !activeCategory || product.category_id === activeCategory;
        const q = search.trim().toLowerCase();
        const shop = shopMap.get(product.shop_id);
        const matchQuery =
          !q ||
          product.name.toLowerCase().includes(q) ||
          (product.description ?? "").toLowerCase().includes(q) ||
          (shop?.name ?? "").toLowerCase().includes(q);
        return matchCat && matchQuery;
      }),
    [products, activeCategory, search, shopMap]
  );

  const cartItems = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-24 md:pb-12">
      <CustomerHeader locationName={locationName} cartCount={cartItems} />

      <main className="mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-6 space-y-6">
        {/* Search Bar */}
        <label className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-[#F4F4F5] px-4 py-3 focus-within:border-[#FF5A1F] focus-within:bg-white transition-colors">
          <Search className="h-4 w-4 text-stone-400 shrink-0" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              if (!event.target.value) setActiveQuickKey("");
            }}
            placeholder="Search for shops or products…"
            className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
          {(search || activeCategory || activeQuickKey) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("");
                setActiveQuickKey("");
              }}
              aria-label="Clear search and filters"
              className="text-stone-400 hover:text-stone-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        {notice && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${
              notice.tone === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <span>{notice.text}</span>
            <div className="flex items-center gap-3">
              {notice.text.toLowerCase().includes("unauthenticated") && (
                <Link
                  href="/sign-in"
                  className="rounded-xl bg-[#FF5A1F] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Sign in to add
                </Link>
              )}
              {conflictProductId && (
                <button
                  type="button"
                  onClick={() => void switchShopAndAdd()}
                  className="rounded-xl bg-[#FF5A1F] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Clear cart & switch shop
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setConflictProductId(null);
                }}
                aria-label="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Promo Hero Banner (Screen 3) */}
        <section className="overflow-hidden rounded-3xl border border-[#15803D]/10 bg-gradient-to-r from-[#DCECD4] via-[#ECF4E3] to-[#FDF5EA]">
          <div className="grid grid-cols-12 items-center">
            <div className="col-span-7 p-5 sm:p-7 md:col-span-8">
              <h1 className="text-xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-3xl [text-wrap:balance]">
                Fresh Groceries to your Home
              </h1>
              <p className="mt-1.5 text-xs font-medium text-stone-700 sm:text-sm">
                From local shops in Pavagada · Code{" "}
                <span className="font-mono font-bold text-[#15803D]">
                  PAVAGADA50
                </span>
              </p>
              <div className="mt-4">
                <Link
                  href="/customer/shops"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#FF5A1F]/25 transition hover:bg-[#E54910]"
                >
                  <span>Order Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="col-span-5 h-full md:col-span-4">
              <img
                src="/images/hero-market.jpg"
                alt="Fresh produce basket from Pavagada local markets"
                referrerPolicy="no-referrer"
                className="h-36 w-full object-cover sm:h-48 md:h-56"
              />
            </div>
          </div>
        </section>

        {/* 4x2 Quick Category Grid (Screen 3) */}
        <section aria-label="Quick categories">
          <div className="grid grid-cols-4 gap-3 sm:gap-4 md:grid-cols-8">
            {QUICK_CATEGORIES.map((item) => {
              const Icon = item.icon;
              const isSelected = activeQuickKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleQuickCategory(item)}
                  className="group flex flex-col items-center text-center"
                >
                  <span
                    className={`grid h-16 w-full max-w-[74px] place-items-center rounded-2xl transition ${
                      item.bg
                    } ${
                      isSelected
                        ? "ring-2 ring-[#FF5A1F]"
                        : "ring-1 ring-black/[0.04] group-hover:ring-[#FF5A1F]/40"
                    }`}
                  >
                    <Icon className={`h-7 w-7 ${item.tint}`} strokeWidth={2} />
                  </span>
                  <span
                    className={`mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight ${
                      isSelected ? "text-[#FF5A1F]" : "text-stone-700"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Popular Shops (Screen 3) */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-stone-900">
              Popular Shops
            </h2>
            <Link
              href="/customer/shops"
              className="text-xs font-bold text-[#FF5A1F] hover:underline whitespace-nowrap"
            >
              See All
            </Link>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-2xl border border-stone-200/80 bg-white p-8 text-center text-sm text-stone-500">
                Loading nearby shops…
              </div>
            ) : filteredShops.length > 0 ? (
              filteredShops.slice(0, 6).map((shop) => (
                <Link
                  key={shop.id}
                  href={`/customer/shops/${shop.id}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-stone-200/80 bg-white p-3.5 transition hover:border-[#FF5A1F]/40 hover:shadow-xs"
                >
                  {shop.image_url ? (
                    <img
                      alt={shop.name}
                      src={shop.image_url}
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#FFF4EE] text-[#FF5A1F] shrink-0">
                      <Store className="h-7 w-7" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-stone-900">
                        {shop.name}
                      </h3>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          shop.is_open ? "text-[#15803D]" : "text-stone-400"
                        }`}
                      >
                        {shop.is_open ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {shop.address}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 text-xs font-medium text-stone-600">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        4.5
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        {shop.opening_hours || "20–30 mins"}
                      </span>
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-stone-200/80 bg-white p-8 text-center text-sm text-stone-500">
                No matching shops available right now.
              </div>
            )}
          </div>
        </section>

        {/* Popular Essentials Grid */}
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight text-stone-900">
              {activeCategory || activeQuickKey ? "Filtered Essentials" : "Popular Essentials"}
            </h2>
            <span className="text-xs font-medium text-stone-500 tabular-nums">
              {filteredProducts.length} items
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const shop = shopMap.get(product.shop_id);
              return (
                <article
                  key={product.id}
                  className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-3 transition hover:border-[#FF5A1F]/40 hover:shadow-xs"
                >
                  <Link
                    href={`/customer/products/${product.id}`}
                    className="block flex-1"
                  >
                    <ProductImage
                      src={product.image_url}
                      name={product.name}
                      className="aspect-[4/3] w-full rounded-xl object-cover"
                    />
                    <p className="mt-2 truncate text-[11px] font-medium text-stone-500">
                      {shop?.name || "Local Shop"} · {product.unit || "Standard"}
                    </p>
                    <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-stone-900">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    <span className="tabular-nums font-mono text-sm font-bold text-stone-900">
                      {formatRupees(product.price_paise)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void add(product.id)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-[#FF5A1F] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#E54910]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </article>
              );
            })}

            {!loading && !filteredProducts.length && (
              <div className="col-span-full rounded-2xl border border-stone-200/80 bg-white p-10 text-center text-sm text-stone-500">
                No products match your search or category filter.
              </div>
            )}
          </div>
        </section>
      </main>

      {cartItems > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-20 px-4 md:bottom-6 md:left-auto md:right-8 md:w-80 md:px-0">
          <Link
            href="/customer/cart"
            className="flex min-h-[48px] items-center justify-between rounded-2xl bg-[#FF5A1F] px-4 py-3 text-white shadow-lg shadow-[#FF5A1F]/25 transition hover:bg-[#E54910]"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold">
              <ShoppingBag className="h-4 w-4" />
              <span className="tabular-nums">
                {cartItems} item{cartItems === 1 ? "" : "s"} in cart
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold">
              <span>View Cart</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      )}

      <CustomerNav />
    </div>
  );
}
