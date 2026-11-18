"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  Heart,
  MapPin,
  ShoppingBag,
  Star,
  Store,
  X,
} from "lucide-react";
import { CustomerHeader, CustomerNav } from "@/components/customer-nav";
import { ProductImage } from "@/components/product-image";
import { apiFetch } from "@/lib/client-session";
import { formatRupees } from "@/lib/customer-ui";

type Shop = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  opening_hours?: string | null;
  image_url?: string | null;
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
type Category = { id: string; name: string };

export default function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [shopId, setShopId] = useState("");
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(
    null
  );
  const [conflictProductId, setConflictProductId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [fav, setFav] = useState(false);

  async function load(id: string) {
    try {
      const [catalog, cart] = await Promise.all([
        apiFetch("/api/catalog").then((r) => r.json()),
        apiFetch("/api/cart?optional=1").then((r) => r.json()).catch(() => ({ items: [] })),
      ]);
      setShop((catalog.shops ?? []).find((item: Shop) => item.id === id) ?? null);
      setProducts(
        (catalog.products ?? []).filter((item: Product) => item.shop_id === id)
      );
      setCategories(catalog.categories ?? []);
      setCartCount(
        (cart.items ?? []).reduce(
          (total: number, item: { quantity: number }) =>
            total + Number(item.quantity),
          0
        )
      );
    } catch {
      setNotice({ text: "Unable to load this shop.", tone: "err" });
    }
  }

  useEffect(() => {
    params.then((value) => {
      setShopId(value.id);
      const saved = JSON.parse(
        window.localStorage.getItem("pavagada_fav_shops") || "[]"
      ) as string[];
      setFav(saved.includes(value.id));
      void load(value.id);
    });
  }, [params]);

  function toggleFav() {
    if (!shopId) return;
    const saved = JSON.parse(
      window.localStorage.getItem("pavagada_fav_shops") || "[]"
    ) as string[];
    const next = saved.includes(shopId)
      ? saved.filter((id) => id !== shopId)
      : [...saved, shopId];
    window.localStorage.setItem("pavagada_fav_shops", JSON.stringify(next));
    setFav(next.includes(shopId));
    setNotice({
      text: next.includes(shopId)
        ? "Saved to favourites."
        : "Removed from favourites.",
      tone: "ok",
    });
  }

  async function add(productId: string) {
    setConflictProductId(null);
    const response = await apiFetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data.error || "Unable to add this product.";
      if (msg.toLowerCase().includes("one shop")) {
        setConflictProductId(productId);
      }
      setNotice({ text: msg, tone: "err" });
      return;
    }
    setNotice({ text: "Added to cart.", tone: "ok" });
    await load(shopId);
  }

  async function switchShopAndAdd() {
    if (!conflictProductId) return;
    await apiFetch("/api/cart", { method: "DELETE" });
    const id = conflictProductId;
    setConflictProductId(null);
    await add(id);
  }

  const visible = useMemo(
    () =>
      products.filter(
        (product) => !category || product.category_id === category
      ),
    [products, category]
  );

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-stone-900">
        <CustomerHeader cartCount={cartCount} title="Shop" backHref="/customer/shops" />
        <main className="grid min-h-[60vh] place-items-center text-sm text-stone-500">
          Loading shop…
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-28 md:pb-12">
      <CustomerHeader
        cartCount={cartCount}
        title={shop.name}
        backHref="/customer/shops"
        rightSlot={
          <button
            type="button"
            onClick={toggleFav}
            aria-label="Save shop to favourites"
            className="grid h-11 w-11 place-items-center rounded-xl text-[#FF5A1F] hover:bg-stone-100"
          >
            <Heart className={`h-5 w-5 ${fav ? "fill-[#FF5A1F]" : ""}`} />
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-6 space-y-5">
        {/* Shop Info Header (Screen 5) */}
        <section className="flex items-start gap-3.5 rounded-2xl border border-stone-200/80 bg-white p-4">
          {shop.image_url ? (
            <img
              alt={shop.name}
              src={shop.image_url}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#FFF4EE] text-[#FF5A1F] shrink-0">
              <Store className="h-8 w-8" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-stone-900 md:text-lg">
                {shop.name}
              </h2>
              <button
                type="button"
                onClick={toggleFav}
                aria-label="Toggle favourite"
                className="hidden items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-[#FF5A1F] md:inline-flex"
              >
                <Heart className={`h-3.5 w-3.5 ${fav ? "fill-[#FF5A1F]" : ""}`} />
                <span>{fav ? "Saved" : "Save"}</span>
              </button>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
              <MapPin className="h-3.5 w-3.5 text-[#FF5A1F] shrink-0" />
              <span className="truncate">{shop.address}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                4.5 (320+)
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                {shop.opening_hours || "20–30 mins"}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  shop.is_open
                    ? "bg-emerald-50 text-[#15803D]"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {shop.is_open ? "Open" : "Closed"}
              </span>
            </div>
          </div>
        </section>

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
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Categories Tabs */}
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`min-h-[38px] whitespace-nowrap shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
              !category
                ? "bg-[#FF5A1F] text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`min-h-[38px] whitespace-nowrap shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                category === item.id
                  ? "bg-[#FF5A1F] text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Itemized Product List (Screen 5) */}
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <article
              key={product.id}
              className="flex items-center gap-3.5 rounded-2xl border border-stone-200/80 bg-white p-3.5 transition hover:border-[#FF5A1F]/40"
            >
              <Link href={`/customer/products/${product.id}`} className="shrink-0">
                <ProductImage
                  src={product.image_url}
                  name={product.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/customer/products/${product.id}`}>
                  <h3 className="truncate text-sm font-bold text-stone-900 hover:text-[#FF5A1F]">
                    {product.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    {product.unit || product.description || "Standard"}
                  </p>
                </Link>
                <b className="mt-1 block tabular-nums font-mono text-sm font-bold text-stone-900">
                  {formatRupees(product.price_paise)}
                </b>
              </div>
              <button
                type="button"
                onClick={() => void add(product.id)}
                className="min-h-[36px] shrink-0 rounded-xl bg-[#FF5A1F] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#E54910]"
              >
                Add
              </button>
            </article>
          ))}
          {!visible.length && (
            <div className="col-span-full rounded-2xl border border-stone-200/80 bg-white p-10 text-center text-sm text-stone-500">
              No products in this category.
            </div>
          )}
        </section>
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-20 px-4 md:bottom-6 md:left-auto md:right-8 md:w-80 md:px-0">
          <Link
            href="/customer/cart"
            className="flex min-h-[48px] items-center justify-between rounded-2xl bg-[#FF5A1F] px-4 py-3 text-white shadow-lg shadow-[#FF5A1F]/25"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold">
              <ShoppingBag className="h-4 w-4" />
              <span className="tabular-nums">
                {cartCount} item{cartCount === 1 ? "" : "s"} in cart
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
