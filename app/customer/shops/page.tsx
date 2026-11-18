"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock, Search, Star, Store } from "lucide-react";
import { CustomerHeader, CustomerNav } from "@/components/customer-nav";
import { apiFetch } from "@/lib/client-session";

type Category = { id: string; name: string };
type Shop = {
  id: string;
  name: string;
  address: string;
  image_url?: string | null;
  opening_hours?: string | null;
  is_open?: number;
};
type Product = { shop_id: string; category_id?: string | null };

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [locationName, setLocationName] = useState("Pavagada Town");

  useEffect(() => {
    setLocationName(
      window.localStorage.getItem("pavagada_delivery_area") || "Pavagada Town"
    );
    Promise.all([
      apiFetch("/api/catalog").then((r) => r.json()),
      apiFetch("/api/cart?optional=1").then((r) => r.json()).catch(() => ({ items: [] })),
    ]).then(([data, cart]) => {
      setShops(data.shops ?? []);
      setCategories(data.categories ?? []);
      setProducts(data.products ?? []);
      setCartCount(
        (cart.items ?? []).reduce(
          (sum: number, i: { quantity: number }) => sum + Number(i.quantity),
          0
        )
      );
    });
  }, []);

  const visible = useMemo(
    () =>
      shops.filter((shop) => {
        const shopProducts = products.filter((p) => p.shop_id === shop.id);
        return (
          (!query || shop.name.toLowerCase().includes(query.toLowerCase())) &&
          (!category || shopProducts.some((p) => p.category_id === category))
        );
      }),
    [shops, products, query, category]
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-24 md:pb-12">
      <CustomerHeader
        locationName={locationName}
        cartCount={cartCount}
        title="Shops"
        backHref="/customer"
      />

      <main className="mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-6 space-y-4">
        {/* Search Shops */}
        <label className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-[#F4F4F5] px-4 py-3 focus-within:border-[#FF5A1F] focus-within:bg-white transition-colors">
          <Search className="h-4 w-4 text-stone-400 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shops…"
            className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
        </label>

        {/* Horizontal Filter Tabs */}
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
            All
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

        {/* Shops List */}
        <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((shop) => (
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
                  <h2 className="truncate text-sm font-bold text-stone-900">
                    {shop.name}
                  </h2>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold shrink-0 ${
                      shop.is_open
                        ? "bg-emerald-50 text-[#15803D]"
                        : "bg-stone-100 text-stone-400"
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
          ))}
          {!visible.length && (
            <div className="col-span-full rounded-2xl border border-stone-200/80 bg-white p-10 text-center text-sm text-stone-500">
              No shops match this search.
            </div>
          )}
        </section>
      </main>

      <CustomerNav />
    </div>
  );
}
