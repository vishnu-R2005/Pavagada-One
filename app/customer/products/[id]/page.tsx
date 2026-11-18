"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { CustomerHeader } from "@/components/customer-nav";
import { ProductImage } from "@/components/product-image";
import { apiFetch } from "@/lib/client-session";
import { formatRupees } from "@/lib/customer-ui";

type Product = {
  id: string;
  shop_id: string;
  name: string;
  description?: string | null;
  price_paise: number;
  quantity: number;
  image_url?: string | null;
  unit?: string | null;
};

export default function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(
    null
  );
  const [cartCount, setCartCount] = useState(0);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    params.then(async (value) => {
      const [catalog, cart] = await Promise.all([
        apiFetch("/api/catalog").then((r) => r.json()),
        apiFetch("/api/cart?optional=1").then((r) => r.json()).catch(() => ({ items: [] })),
      ]);
      const found =
        (catalog.products ?? []).find(
          (item: Product) => item.id === value.id
        ) ?? null;
      setProduct(found);
      setCartCount(
        (cart.items ?? []).reduce(
          (s: number, i: { quantity: number }) => s + Number(i.quantity),
          0
        )
      );
      const saved = JSON.parse(
        window.localStorage.getItem("pavagada_fav_products") || "[]"
      ) as string[];
      setFav(saved.includes(value.id));
    });
  }, [params]);

  function toggleFav() {
    if (!product) return;
    const saved = JSON.parse(
      window.localStorage.getItem("pavagada_fav_products") || "[]"
    ) as string[];
    const next = saved.includes(product.id)
      ? saved.filter((id) => id !== product.id)
      : [...saved, product.id];
    window.localStorage.setItem("pavagada_fav_products", JSON.stringify(next));
    setFav(next.includes(product.id));
  }

  async function add() {
    if (!product) return;
    const response = await apiFetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice({
        text: data.error || "Unable to add this product.",
        tone: "err",
      });
      return;
    }
    setCartCount((c) => c + quantity);
    setNotice({
      text: `${quantity} item${quantity === 1 ? "" : "s"} added to cart.`,
      tone: "ok",
    });
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-stone-900">
        <CustomerHeader cartCount={cartCount} title="Product" backHref="/customer" />
        <main className="grid min-h-[60vh] place-items-center text-sm text-stone-500">
          Loading product…
        </main>
      </div>
    );
  }

  const detailPoints = [
    product.description || "Carefully sourced quality stock from Pavagada merchants",
    `${product.quantity} available in stock today`,
    "Freshly packed for doorstep delivery",
    "Cash on Delivery supported",
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-28 md:pb-12">
      <CustomerHeader
        cartCount={cartCount}
        title={product.name}
        backHref={`/customer/shops/${product.shop_id}`}
        rightSlot={
          <button
            type="button"
            onClick={toggleFav}
            aria-label="Save product"
            className="grid h-11 w-11 place-items-center rounded-xl text-[#FF5A1F] hover:bg-stone-100"
          >
            <Heart className={`h-5 w-5 ${fav ? "fill-[#FF5A1F]" : ""}`} />
          </button>
        }
      />

      <main className="mx-auto max-w-5xl px-4 pt-4 md:px-8 md:pt-8">
        <section className="grid gap-6 md:grid-cols-12">
          {/* Showcase Frame */}
          <div className="md:col-span-6">
            <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-4">
              <ProductImage
                src={product.image_url}
                name={product.name}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
          </div>

          {/* Contiguous Purchase Module (Screen 6) */}
          <div className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-5 md:col-span-6 md:p-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">
                {product.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-stone-500">
                {product.unit || "Standard pack"}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span className="tabular-nums font-mono text-2xl font-extrabold text-stone-900">
                  {formatRupees(product.price_paise)}
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-[#15803D]">
                  In Stock ({product.quantity})
                </span>
              </div>

              {/* Quantity Stepper Row (Screen 6) */}
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-2">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                  className="grid h-10 w-10 place-items-center rounded-xl text-stone-700 hover:bg-stone-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <b className="tabular-nums font-mono text-base font-bold">
                  {quantity}
                </b>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQuantity((v) => Math.min(product.quantity, v + 1))
                  }
                  className="grid h-10 w-10 place-items-center rounded-xl text-stone-700 hover:bg-stone-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Product Details Checklist */}
              <div className="mt-6 border-t border-stone-100 pt-5">
                <h3 className="text-sm font-bold text-stone-900">
                  Product Details
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs text-stone-600">
                  {detailPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 text-[#15803D] shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-stone-100 pt-5">
              {notice && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                    notice.tone === "ok"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-800"
                  }`}
                >
                  <span>{notice.text}</span>
                  {notice.text.toLowerCase().includes("unauthenticated") && (
                    <Link
                      href="/sign-in"
                      className="rounded-lg bg-[#FF5A1F] px-2.5 py-1 text-[11px] font-bold text-white"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              )}

              <div className="hidden md:flex gap-3">
                <button
                  type="button"
                  onClick={() => void add()}
                  className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF5A1F] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#FF5A1F]/20 transition hover:bg-[#E54910]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="tabular-nums">
                    Add to Cart · {formatRupees(product.price_paise * quantity)}
                  </span>
                </button>
                {cartCount > 0 && (
                  <Link
                    href="/customer/cart"
                    className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-[#FF5A1F] px-4 py-3 text-xs font-bold text-[#FF5A1F]"
                  >
                    View Cart ({cartCount})
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Sticky Bottom Add to Cart CTA (Screen 6) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200/80 bg-white/95 p-4 backdrop-blur-md md:hidden">
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => void add()}
            className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF5A1F] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF5A1F]/25 active:scale-[0.99] transition"
          >
            <span className="tabular-nums">
              Add to Cart | {formatRupees(product.price_paise * quantity)}
            </span>
          </button>
          {cartCount > 0 && (
            <Link
              href="/customer/cart"
              className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-[#FF5A1F] bg-white px-3.5 text-xs font-bold text-[#FF5A1F]"
            >
              Cart ({cartCount})
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
