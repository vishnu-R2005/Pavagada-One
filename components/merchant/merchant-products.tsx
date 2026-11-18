"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { ProductImage, ProductImagePicker } from "@/components/product-image";
import { VideoAnimator } from "@/components/video-animator";
import type { Category, Product } from "@/components/merchant/types";
import { formatRupees } from "@/lib/merchant-ui";

type StockFilter = "all" | "in_stock" | "out_of_stock";

export function MerchantProductsList({
  products,
  onAddNew,
  onEdit,
  onToggleActive,
}: {
  products: Product[];
  onAddNew: () => void;
  onEdit: (product: Product) => void;
  onToggleActive: (product: Product) => void;
}) {
  const [filter, setFilter] = useState<StockFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const inStock = Boolean(p.is_active) && p.quantity > 0;
      if (filter === "in_stock" && !inStock) return false;
      if (filter === "out_of_stock" && inStock) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category_name || "").toLowerCase().includes(q) ||
        (p.unit || "").toLowerCase().includes(q)
      );
    });
  }, [products, filter, search]);

  return (
    <div className="space-y-4">
      {/* Desktop Header CTA */}
      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Products
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Manage storefront inventory, toggle item availability, or update pricing
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#E54910]"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#FF5A1F]"
        />
      </div>

      {/* Filter Pills (Screen 6) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(
            [
              ["all", "All"],
              ["in_stock", "In Stock"],
              ["out_of_stock", "Out of Stock"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filter === id
                  ? "bg-[#FF5A1F] text-white shadow-xs"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Primary Add CTA (unobstructed above product list) */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={onAddNew}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 transition hover:bg-[#E54910]"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* Product Grid / List */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const available = Boolean(product.is_active) && product.quantity > 0;
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs transition hover:border-stone-300"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProductImage
                    src={product.image_url}
                    name={product.name}
                    className="h-16 w-16 rounded-xl object-cover border border-stone-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-900">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {product.unit || "Standard"} · Stock: {product.quantity}
                    </p>
                    <p className="mt-1 tabular-nums text-sm font-extrabold text-stone-900">
                      {formatRupees(product.price_paise)}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] font-bold ${
                        available ? "text-[#15803D]" : "text-rose-600"
                      }`}
                    >
                      {available ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                </div>

                {/* Right Controls: Green Tactile Toggle + Edit Pencil */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(product.is_active)}
                    aria-label={`Toggle ${product.name} availability`}
                    onClick={() => onToggleActive(product)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      product.is_active ? "bg-[#15803D]" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                        product.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    aria-label={`Edit ${product.name}`}
                    onClick={() => onEdit(product)}
                    className="grid h-10 w-10 place-items-center rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center shadow-xs">
          <p className="text-sm font-bold text-stone-800">No products found</p>
          <p className="mt-1 text-xs text-stone-500">
            Add your first storefront product or clear your search filter.
          </p>
        </div>
      )}

      {/* Promo Video Studio (Retained capability styled to match Merchant UI) */}
      <div className="pt-2">
        <VideoAnimator />
      </div>
    </div>
  );
}

export function MerchantProductForm({
  editingProduct,
  categories,
  busy,
  onSave,
  onCancel,
}: {
  editingProduct: Product | null;
  categories: Category[];
  busy: boolean;
  onSave: (payload: {
    name: string;
    categoryId: string | null;
    pricePaise: number;
    stock: number;
    lowStockThreshold: number;
    unit: string | null;
    description?: string;
    imageUrl?: string | null;
    isActive: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [inStock, setInStock] = useState(
    editingProduct ? Boolean(editingProduct.is_active) : true
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const priceRupees = Number(form.get("price") || 0);
    const stock = Math.max(0, Number(form.get("stock") || 0));
    const lowStock = Math.max(0, Number(form.get("lowStockThreshold") || 5));

    await onSave({
      name: String(form.get("name") || "").trim(),
      categoryId: String(form.get("categoryId") || "") || null,
      pricePaise: Math.max(100, Math.round(priceRupees * 100)),
      stock,
      lowStockThreshold: lowStock,
      unit: String(form.get("unit") || "").trim() || null,
      description: String(form.get("description") || "").trim() || undefined,
      imageUrl: String(form.get("imageUrl") || "").trim() || null,
      isActive: inStock,
    });
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <ProductImagePicker
        key={editingProduct?.id || "new-product"}
        initialValue={editingProduct?.image_url ?? ""}
      />

      <div>
        <label className="mb-1.5 block text-xs font-bold text-stone-700">
          Product Name <span className="text-rose-500">*</span>
        </label>
        <input
          name="name"
          defaultValue={editingProduct?.name ?? ""}
          placeholder="e.g., Aashirvaad Atta"
          required
          className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#FF5A1F] focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-stone-700">
          Category <span className="text-rose-500">*</span>
        </label>
        <select
          name="categoryId"
          defaultValue={editingProduct?.category_id ?? ""}
          className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm text-stone-900 outline-none focus:border-[#FF5A1F] focus:bg-white"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-stone-700">
            Price (₹) <span className="text-rose-500">*</span>
          </label>
          <input
            name="price"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={
              editingProduct ? Math.round(editingProduct.price_paise / 100) : ""
            }
            placeholder="e.g., 245"
            className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-stone-700">
            Stock Quantity <span className="text-rose-500">*</span>
          </label>
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={editingProduct?.quantity ?? 10}
            placeholder="e.g., 10"
            className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-stone-700">
            Unit / Pack Size
          </label>
          <input
            name="unit"
            defaultValue={editingProduct?.unit ?? ""}
            placeholder="e.g., 5 kg, 1 L"
            className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-stone-700">
            Low-Stock Alert At
          </label>
          <input
            name="lowStockThreshold"
            type="number"
            min="0"
            step="1"
            defaultValue={editingProduct?.low_stock_threshold ?? 5}
            className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm text-stone-900 outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-stone-700">
          Description (optional)
        </label>
        <input
          name="description"
          defaultValue={editingProduct?.description ?? ""}
          placeholder="e.g., 5 kg pack, fresh daily stock"
          className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-[#FF5A1F] focus:bg-white"
        />
      </div>

      {/* Tactile In Stock Switch (Screen 7) */}
      <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-[#FAFAFA] px-4 py-3">
        <div>
          <p className="text-sm font-bold text-stone-900">In Stock</p>
          <p className="text-xs text-stone-500">
            Available for customers in your shopfront
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={inStock}
          onClick={() => setInStock((v) => !v)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            inStock ? "bg-[#15803D]" : "bg-stone-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
              inStock ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] flex-[2] rounded-xl bg-[#FF5A1F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#E54910] disabled:opacity-50"
        >
          {busy
            ? "Saving…"
            : editingProduct
              ? "Save Product Changes"
              : "Save Product"}
        </button>
      </div>
    </form>
  );
}
