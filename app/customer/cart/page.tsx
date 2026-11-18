"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  ChevronRight,
  CreditCard,
  Home,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  Store,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { CustomerHeader } from "@/components/customer-nav";
import { ProductImage } from "@/components/product-image";
import { apiFetch } from "@/lib/client-session";
import {
  calculateCartTotals,
  DELIVERY_FEE_PAISE,
  formatRupees,
  FREE_DELIVERY_THRESHOLD_PAISE,
} from "@/lib/customer-ui";

type Item = {
  item_id: string;
  product_id: string;
  name: string;
  price_paise: number;
  quantity: number;
  available: number;
  image_url?: string | null;
  unit?: string | null;
  shop_name?: string;
  shop_id?: string;
};

type Address = {
  id: string;
  label: string;
  address_line: string;
  landmark?: string | null;
  is_default?: number;
};

type Stage = "cart" | "address" | "payment";

function AddressIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();
  if (lower.includes("home")) {
    return (
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
        <Home className="h-5 w-5" />
      </span>
    );
  }
  if (lower.includes("work") || lower.includes("office")) {
    return (
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB] shrink-0">
        <Briefcase className="h-5 w-5" />
      </span>
    );
  }
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5F3FF] text-[#7C3AED] shrink-0">
      <MapPin className="h-5 w-5" />
    </span>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState("");
  const [stage, setStage] = useState<Stage>("cart");
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
  } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFeePaise: DELIVERY_FEE_PAISE,
    freeDeliveryThresholdPaise: FREE_DELIVERY_THRESHOLD_PAISE,
  });
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLine, setEditLine] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const { subtotal, deliveryFee, discount, total, remainingForFreeDelivery } =
    calculateCartTotals(
      items,
      appliedCoupon?.discountPaise ?? 0,
      deliverySettings
    );

  async function load(couponOverride?: string) {
    try {
      const codeParam = (couponOverride ?? appliedCoupon?.code ?? "").trim();
      const cartUrl = codeParam
        ? `/api/cart?coupon=${encodeURIComponent(codeParam)}`
        : "/api/cart";
      const [basketRes, placesRes] = await Promise.all([
        apiFetch(cartUrl),
        apiFetch("/api/addresses"),
      ]);
      if (basketRes.status === 401) {
        setUnauthenticated(true);
        setItems([]);
        setAddresses([]);
        setLoading(false);
        return;
      }
      setUnauthenticated(false);
      const [basket, places] = await Promise.all([
        basketRes.json().catch(() => ({})),
        placesRes.json().catch(() => ({})),
      ]);
      setItems(basket.items ?? []);
      if (basket.settings) {
        setDeliverySettings(basket.settings);
      }
      if (basket.coupon) {
        if (basket.coupon.valid) {
          setAppliedCoupon({
            code: basket.coupon.code,
            discountPaise: Number(basket.coupon.discountPaise) || 0,
          });
          if (couponOverride !== undefined) {
            setCouponFeedback({
              text: `${basket.coupon.code} applied — you save ${formatRupees(
                Number(basket.coupon.discountPaise) || 0
              )}.`,
              ok: true,
            });
          }
        } else {
          setAppliedCoupon(null);
          if (couponOverride !== undefined) {
            setCouponFeedback({
              text: basket.coupon.error || "Invalid coupon code.",
              ok: false,
            });
          }
        }
      }
      setAddresses(places.addresses ?? []);
      const defaultAddress =
        (places.addresses ?? []).find((a: Address) => a.is_default) ||
        places.addresses?.[0];
      if (defaultAddress) setSelected((v) => v || defaultAddress.id);
    } catch {
      setNotice("Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function applyPromoCode() {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) {
      setAppliedCoupon(null);
      setCouponFeedback(null);
      return;
    }
    setCouponFeedback(null);
    await load(trimmed);
  }

  async function change(item: Item, quantity: number) {
    if (quantity < 1) {
      await apiFetch(`/api/cart/items/${item.item_id}`, { method: "DELETE" });
    } else {
      const response = await apiFetch(`/api/cart/items/${item.item_id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data.error || "Unable to update quantity.");
      }
    }
    await load();
  }

  async function addAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await apiFetch("/api/addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        addressLine: form.get("address"),
        landmark: form.get("landmark"),
        isDefault: !addresses.length,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "Unable to save your address.");
      return;
    }
    setShowAddForm(false);
    await load();
    setSelected(data.id);
  }

  function startEditAddress(address: Address) {
    setShowAddForm(false);
    setEditingAddress(address);
    setEditLabel(address.label);
    setEditLine(address.address_line);
    setEditLandmark(address.landmark || "");
  }

  async function saveEditAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAddress) return;
    const response = await apiFetch(`/api/addresses/${editingAddress.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: editLabel,
        addressLine: editLine,
        landmark: editLandmark || null,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "Unable to update address.");
      return;
    }
    setEditingAddress(null);
    await load();
  }

  async function place() {
    if (!selected) {
      setNotice("Choose a delivery address first.");
      setStage("address");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const response = await apiFetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          addressId: selected,
          paymentMethod: "cash_on_delivery",
          deliveryInstructions: note,
          couponCode: appliedCoupon?.code || couponCode.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to place the order.");
      }
      router.replace(`/customer/orders/${data.orderId}`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to place the order."
      );
    } finally {
      setBusy(false);
    }
  }

  const headerTitle =
    stage === "cart"
      ? "My Cart"
      : stage === "address"
        ? "Delivery Address"
        : "Payment Method";

  const cartCount = items.reduce((s, i) => s + Number(i.quantity), 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-28 md:pb-12">
      <CustomerHeader
        title={headerTitle}
        onBack={() =>
          stage === "cart"
            ? router.back()
            : setStage(stage === "payment" ? "address" : "cart")
        }
        cartCount={cartCount}
        rightSlot={<span className="w-10" aria-hidden="true" />}
      />

      <main className="mx-auto max-w-5xl px-4 pt-4 md:px-8 md:pt-8">
        {/* Desktop Step Breadcrumb */}
        <div className="mb-5 hidden items-center justify-between md:flex">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900">
              {headerTitle}
            </h1>
            {items[0]?.shop_name && (
              <p className="mt-0.5 text-xs text-stone-500">
                Fulfilled by {items[0].shop_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className={stage === "cart" ? "text-[#FF5A1F]" : ""}>
              1. My Cart
            </span>
            <span>/</span>
            <span className={stage === "address" ? "text-[#FF5A1F]" : ""}>
              2. Delivery Address
            </span>
            <span>/</span>
            <span className={stage === "payment" ? "text-[#FF5A1F]" : ""}>
              3. Payment Method
            </span>
          </div>
        </div>

        {notice && (
          <button
            type="button"
            onClick={() => setNotice("")}
            className="mb-4 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-xs font-semibold text-rose-800"
          >
            {notice}
          </button>
        )}

        {/* STAGE 1: MY CART (Screen 7) */}
        {stage === "cart" && (
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="space-y-4 lg:col-span-7">
              {items[0]?.shop_name && (
                <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
                      <Store className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-stone-900">
                        {items[0].shop_name}
                      </p>
                      <p className="text-[11px] text-[#15803D] font-medium">
                        Same-hour Pavagada delivery
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
                </div>
              )}

              <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-4 shadow-xs">
                {items.map((item) => (
                  <div
                    className="flex items-center gap-3.5 py-4"
                    key={item.item_id}
                  >
                    <ProductImage
                      src={item.image_url}
                      name={item.name}
                      className="h-16 w-16 rounded-xl object-cover shrink-0 bg-[#F7F4F0]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-stone-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {item.unit || "Standard pack"}
                      </p>
                      <b className="mt-1 block tabular-nums text-sm font-extrabold text-stone-900">
                        {formatRupees(item.price_paise)}
                      </b>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="flex items-center rounded-xl border border-stone-200 bg-[#FAFAFA] px-1 py-0.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() => void change(item, item.quantity - 1)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-stone-700 hover:bg-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <b className="tabular-nums text-xs font-bold px-2 text-stone-900">
                          {item.quantity}
                        </b>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          onClick={() => void change(item, item.quantity + 1)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-stone-700 hover:bg-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => void change(item, 0)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {!loading && !items.length && (
                  <div className="py-14 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                    <p className="mt-3 text-base font-bold text-stone-900">
                      {unauthenticated
                        ? "Sign in to view your cart"
                        : "Your cart is empty"}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {unauthenticated
                        ? "Sign in with your Pavagada One account to add items and place orders."
                        : "Add fresh groceries or essentials from Pavagada shops."}
                    </p>
                    <Link
                      href={unauthenticated ? "/sign-in" : "/customer/shops"}
                      className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-[#FF5A1F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E54910]"
                    >
                      {unauthenticated ? "Sign in" : "Browse Local Shops"}
                    </Link>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <label className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
                  <span className="text-xs font-semibold text-stone-700">
                    Add a note for the shop{" "}
                    <span className="font-normal text-stone-400">
                      (optional)
                    </span>
                  </span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g., Prefer latest expiry date or call at gate"
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A1F]"
                  />
                </label>
              )}
            </section>

            {items.length > 0 && (
              <aside className="lg:col-span-5">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs">
                  <h2 className="text-base font-bold text-stone-900">
                    Bill Summary
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between text-stone-600">
                      <span>Item Total</span>
                      <span className="tabular-nums font-semibold text-stone-900">
                        {formatRupees(subtotal)}
                      </span>
                    </p>
                    <p className="flex justify-between text-stone-600">
                      <span>Delivery Fee</span>
                      <span className="tabular-nums font-semibold text-stone-900">
                        {deliveryFee ? formatRupees(deliveryFee) : "Free"}
                      </span>
                    </p>
                    <p className="flex justify-between border-t border-stone-100 pt-3 text-base font-extrabold text-stone-900">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {formatRupees(total)}
                      </span>
                    </p>
                  </div>

                  {remainingForFreeDelivery > 0 && (
                    <p className="rounded-xl bg-[#EAF7EE] px-3 py-2 text-xs font-medium text-[#15803D]">
                      Add {formatRupees(remainingForFreeDelivery)} more to unlock
                      free delivery.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setStage("address")}
                    className="hidden min-h-[48px] w-full rounded-xl bg-[#FF5A1F] py-3 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 transition hover:bg-[#E54910] md:block"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </aside>
            )}
          </div>
        )}

        {/* STAGE 2: DELIVERY ADDRESS (Screen 8) */}
        {stage === "address" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <section className="space-y-3">
              {addresses.map((address) => {
                const active = selected === address.id;
                return (
                  <div
                    key={address.id}
                    className={`rounded-2xl border bg-white p-4 transition shadow-xs ${
                      active
                        ? "border-[#FF5A1F] ring-2 ring-[#FF5A1F]/15"
                        : "border-stone-200 hover:border-[#FF5A1F]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => setSelected(address.id)}
                        className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
                      >
                        <AddressIcon label={address.label} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <b className="text-sm font-bold text-stone-900">
                              {address.label}
                            </b>
                            {active && (
                              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#FF5A1F] text-white">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                            )}
                          </span>
                          <small className="mt-1 block text-xs leading-relaxed text-stone-500">
                            {address.address_line}
                            {address.landmark ? `, ${address.landmark}` : ""}
                          </small>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditAddress(address)}
                        className="min-h-[36px] px-2.5 text-xs font-semibold text-[#2563EB] hover:underline shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}

              {!addresses.length && !showAddForm && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center">
                  <p className="text-sm font-semibold text-stone-900">
                    No saved addresses yet
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Add a delivery address in Pavagada to continue checkout.
                  </p>
                </div>
              )}
            </section>

            {editingAddress && (
              <form
                onSubmit={saveEditAddress}
                className="space-y-3 rounded-2xl border border-[#FF5A1F]/30 bg-white p-5 shadow-xs"
              >
                <h2 className="text-sm font-bold text-stone-900">
                  Edit {editingAddress.label}
                </h2>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  required
                  placeholder="Label (Home, Work, Other)"
                  className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <textarea
                  value={editLine}
                  onChange={(e) => setEditLine(e.target.value)}
                  required
                  minLength={10}
                  placeholder="Full street address in Pavagada"
                  className="min-h-20 w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  value={editLandmark}
                  onChange={(e) => setEditLandmark(e.target.value)}
                  placeholder="Landmark (optional)"
                  className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="min-h-[44px] flex-1 rounded-xl bg-[#FF5A1F] py-2.5 text-sm font-bold text-white"
                  >
                    Update Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAddress(null)}
                    className="min-h-[44px] rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {showAddForm ? (
              <form
                onSubmit={addAddress}
                className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
              >
                <h2 className="text-sm font-bold text-stone-900">
                  Add a new address
                </h2>
                <input
                  name="label"
                  required
                  placeholder="Label (Home, Work, Other)"
                  className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <textarea
                  name="address"
                  required
                  minLength={10}
                  placeholder="Full street address in Pavagada"
                  className="min-h-20 w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  name="landmark"
                  placeholder="Landmark (optional)"
                  className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="min-h-[44px] flex-1 rounded-xl bg-[#FF5A1F] py-2.5 text-sm font-bold text-white"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="min-h-[44px] rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setShowAddForm(true);
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#2563EB]/40 bg-white py-2.5 text-xs font-bold text-[#2563EB] hover:bg-[#EFF6FF]"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Address</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                selected
                  ? setStage("payment")
                  : setNotice("Choose or add an address first.")
              }
              className="hidden min-h-[48px] w-full rounded-xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 hover:bg-[#E54910] md:block"
            >
              Continue
            </button>
          </div>
        )}

        {/* STAGE 3: PAYMENT METHOD (Screen 9) */}
        {stage === "payment" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs divide-y divide-stone-100">
              {/* Cash on Delivery - Active */}
              <div className="flex items-center justify-between gap-3.5 bg-[#FFF9F6] p-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <b className="block text-sm font-bold text-stone-900">
                      Cash on Delivery
                    </b>
                    <small className="block text-xs text-stone-500">
                      Pay cash or UPI directly to the rider at your doorstep
                    </small>
                  </div>
                </div>
                <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-[#FF5A1F] shrink-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5A1F]" />
                </span>
              </div>

              {/* UPI Online */}
              <button
                type="button"
                onClick={() =>
                  setPaymentNote(
                    "Online UPI checkout is coming soon — pay cash or scan rider UPI on delivery."
                  )
                }
                className="flex w-full items-center justify-between gap-3.5 p-4 text-left opacity-70 hover:bg-stone-50"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-100 text-stone-600 shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <b className="block text-sm font-semibold text-stone-800">
                      UPI (Google Pay, PhonePe, Paytm)
                    </b>
                    <small className="block text-[11px] text-stone-500">
                      Online gateway coming soon
                    </small>
                  </div>
                </div>
                <span className="h-5 w-5 rounded-full border-2 border-stone-300 shrink-0" />
              </button>

              {/* Card */}
              <button
                type="button"
                onClick={() =>
                  setPaymentNote(
                    "Card gateway is coming soon — Cash on Delivery is active for all Pavagada orders."
                  )
                }
                className="flex w-full items-center justify-between gap-3.5 p-4 text-left opacity-70 hover:bg-stone-50"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-100 text-stone-600 shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <b className="block text-sm font-semibold text-stone-800">
                      Credit / Debit Card
                    </b>
                    <small className="block text-[11px] text-stone-500">
                      Online gateway coming soon
                    </small>
                  </div>
                </div>
                <span className="h-5 w-5 rounded-full border-2 border-stone-300 shrink-0" />
              </button>
            </section>

            {paymentNote && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
                {paymentNote}
              </p>
            )}

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-2.5">
              <label className="block">
                <span className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                  <Tag className="h-3.5 w-3.5 text-[#FF5A1F]" />
                  <span>Promo code (try PAVAGADA50)</span>
                </span>
                <div className="mt-2 flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setCouponCode(nextVal);
                      if (!nextVal.trim()) {
                        setAppliedCoupon(null);
                        setCouponFeedback(null);
                      }
                    }}
                    placeholder="Enter coupon code (optional)"
                    className="flex-1 rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-2.5 text-sm uppercase outline-none focus:border-[#FF5A1F]"
                  />
                  <button
                    type="button"
                    onClick={() => void applyPromoCode()}
                    className="min-h-[42px] rounded-xl border border-[#FF5A1F] bg-[#FFF8F5] px-4 py-2 text-xs font-bold text-[#FF5A1F] hover:bg-[#FFF3EE]"
                  >
                    Apply
                  </button>
                </div>
              </label>
              {couponFeedback && (
                <p
                  className={`text-xs font-semibold ${
                    couponFeedback.ok ? "text-[#15803D]" : "text-rose-600"
                  }`}
                >
                  {couponFeedback.text}
                </p>
              )}
              {discount > 0 && (
                <div className="border-t border-stone-100 pt-2.5 space-y-1 text-xs">
                  <p className="flex justify-between text-stone-600">
                    <span>Item Total + Delivery</span>
                    <span className="tabular-nums">
                      {formatRupees(subtotal + deliveryFee)}
                    </span>
                  </p>
                  <p className="flex justify-between font-semibold text-[#15803D]">
                    <span>Promo Discount ({appliedCoupon?.code})</span>
                    <span className="tabular-nums">
                      -{formatRupees(discount)}
                    </span>
                  </p>
                  <p className="flex justify-between font-extrabold text-stone-900">
                    <span>Payable on Delivery</span>
                    <span className="tabular-nums">{formatRupees(total)}</span>
                  </p>
                </div>
              )}
            </div>

            <label className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold text-stone-700">
                Delivery instructions{" "}
                <span className="font-normal text-stone-400">(optional)</span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="E.g., call on arrival or gate details"
                className="mt-2 min-h-20 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] p-3 text-sm outline-none focus:border-[#FF5A1F]"
              />
            </label>

            <button
              type="button"
              disabled={busy}
              onClick={() => void place()}
              className="hidden min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 transition hover:bg-[#E54910] disabled:opacity-60 md:block"
            >
              {busy
                ? "Placing Order…"
                : `Place Order  |  ${formatRupees(total)}`}
            </button>
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
          {stage === "cart" && (
            <button
              type="button"
              onClick={() => setStage("address")}
              className="min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3 text-base font-bold text-white shadow-md shadow-[#FF5A1F]/25 active:scale-[0.99]"
            >
              Proceed to Checkout
            </button>
          )}
          {stage === "address" && (
            <button
              type="button"
              onClick={() =>
                selected
                  ? setStage("payment")
                  : setNotice("Choose or add an address first.")
              }
              className="min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3 text-base font-bold text-white shadow-md shadow-[#FF5A1F]/25 active:scale-[0.99]"
            >
              Continue
            </button>
          )}
          {stage === "payment" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void place()}
              className="min-h-[50px] w-full rounded-xl bg-[#FF5A1F] py-3 text-base font-bold text-white shadow-md shadow-[#FF5A1F]/25 disabled:opacity-60 active:scale-[0.99]"
            >
              {busy
                ? "Placing Order…"
                : `Place Order  |  ${formatRupees(total)}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
