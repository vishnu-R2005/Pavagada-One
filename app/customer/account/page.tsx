"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  Bell,
  ChevronRight,
  ClipboardList,
  CreditCard,
  HelpCircle,
  LogOut,
  MapPin,
  Plus,
  Store,
  Trash2,
  Wallet,
} from "lucide-react";
import { CustomerHeader, CustomerNav } from "@/components/customer-nav";
import { apiFetch } from "@/lib/client-session";

type Address = {
  id: string;
  label: string;
  address_line: string;
  landmark?: string | null;
};
type User = { fullName: string; phone?: string | null; email?: string };
type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
};
type SupportCase = {
  id: string;
  subject: string;
  detail: string;
  status: string;
  created_at: string;
};

type SectionKey = "addresses" | "payments" | "offers" | "support" | "partner";

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [editing, setEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [activeTab, setActiveTab] = useState<SectionKey>("addresses");
  const [notice, setNotice] = useState("");

  async function load() {
    const [profileRes, placesRes, supportRes] = await Promise.all([
      apiFetch("/api/profile"),
      apiFetch("/api/addresses"),
      apiFetch("/api/support"),
    ]);
    if (profileRes.status === 401) {
      router.replace("/sign-in");
      return;
    }
    const [profile, places, support] = await Promise.all([
      profileRes.json(),
      placesRes.json(),
      supportRes.json().catch(() => ({})),
    ]);
    setUser(profile.user ?? null);
    setAddresses(places.addresses ?? []);
    setCoupons(support.coupons ?? []);
    setCases(support.cases ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await apiFetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("name"),
        phone: form.get("phone"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "Unable to save your profile.");
      return;
    }
    setNotice("Profile updated.");
    setEditing(false);
    await load();
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
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
      setNotice(data.error || "Unable to save address.");
      return;
    }
    setShowAddressForm(false);
    setNotice("Address saved.");
    await load();
  }

  async function removeAddress(id: string) {
    await apiFetch(`/api/addresses/${id}`, { method: "DELETE" });
    setNotice("Address deleted.");
    await load();
  }

  async function submitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await apiFetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "support",
        subject: form.get("subject"),
        detail: form.get("detail"),
      }),
    });
    if (!res.ok) {
      setNotice("Please enter a subject and message.");
      return;
    }
    event.currentTarget.reset();
    setNotice("Support case submitted. Our team will respond soon.");
    await load();
  }

  async function submitPartnerApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await apiFetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "merchant_apply",
        shopName: form.get("shopName"),
        phone: form.get("phone"),
        address: form.get("address"),
      }),
    });
    if (!res.ok) {
      setNotice("Please complete all shop details.");
      return;
    }
    event.currentTarget.reset();
    setNotice("Shop application submitted for admin approval.");
    await load();
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.replace("/sign-in");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-stone-900">
        <CustomerHeader title="My Profile" backHref="/customer" />
        <main className="grid min-h-[60vh] place-items-center text-sm text-stone-500">
          Loading profile…
        </main>
      </div>
    );
  }

  const initial = user.fullName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-24 md:pb-12">
      <CustomerHeader title="My Profile" backHref="/customer" />

      <main className="mx-auto max-w-5xl px-4 pt-4 md:px-8 md:pt-8">
        <div className="hidden items-center justify-between md:flex mb-5">
          <h1 className="font-display text-2xl font-bold text-stone-900">
            My Profile
          </h1>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#FEF2F2] px-4 py-2 text-xs font-bold text-[#DC2626] hover:bg-rose-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {notice && (
          <button
            type="button"
            onClick={() => setNotice("")}
            className="mb-4 w-full rounded-xl border border-emerald-200 bg-[#EAF7EE] px-4 py-3 text-left text-xs font-semibold text-[#15803D]"
          >
            {notice}
          </button>
        )}

        <div className="grid gap-6 md:grid-cols-12">
          {/* LEFT COLUMN: Profile Card + Clean List Menu (Screen 12) */}
          <div className="space-y-4 md:col-span-5">
            {/* Profile Card */}
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="flex w-full items-center gap-3.5 text-left"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#DBEAFE] font-display text-xl font-bold text-[#1D4ED8] shrink-0">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-stone-900">
                    {user.fullName}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    {user.phone || user.email || "Tap to add mobile number"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
              </button>

              {editing && (
                <form
                  onSubmit={saveProfile}
                  className="mt-4 grid gap-2.5 border-t border-stone-100 pt-4"
                >
                  <input
                    name="name"
                    defaultValue={user.fullName}
                    required
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm outline-none focus:border-[#FF5A1F]"
                    placeholder="Full name"
                  />
                  <input
                    name="phone"
                    defaultValue={user.phone ?? ""}
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-sm outline-none focus:border-[#FF5A1F]"
                    placeholder="Mobile number"
                  />
                  <button className="min-h-[42px] rounded-xl bg-[#FF5A1F] py-2 text-xs font-bold text-white">
                    Save Profile
                  </button>
                </form>
              )}
            </section>

            {/* Vertical List Menu matching Screen 12 */}
            <nav
              aria-label="Profile options"
              className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs"
            >
              <button
                type="button"
                onClick={() => setActiveTab("addresses")}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-stone-50 ${
                  activeTab === "addresses" ? "bg-[#FFF9F6]" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-semibold text-stone-900">
                    My Addresses
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-stone-50 ${
                  activeTab === "payments" ? "bg-[#FFF9F6]" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-semibold text-stone-900">
                    Payment Methods
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </button>

              <Link
                href="/customer/orders"
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-stone-50"
              >
                <span className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-semibold text-stone-900">
                    Order History
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab("offers")}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-stone-50 ${
                  activeTab === "offers" ? "bg-[#FFF9F6]" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <BadgePercent className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-semibold text-stone-900">
                    Offers & Rewards ({coupons.length})
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-stone-50 ${
                  activeTab === "support" ? "bg-[#FFF9F6]" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-semibold text-stone-900">
                    Help & Support
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("partner")}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-stone-50 ${
                  activeTab === "partner" ? "bg-[#FFF9F6]" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-semibold text-stone-900">
                    Partner With Us
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </button>

              <Link
                href="/customer/notifications"
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-stone-50"
              >
                <span className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-semibold text-stone-900">
                    Notifications
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </Link>
            </nav>

            {/* Mobile Logout Pill (Screen 12) */}
            <button
              type="button"
              onClick={() => void logout()}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FEF2F2] py-3 text-sm font-bold text-[#DC2626] hover:bg-rose-100 md:hidden"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* RIGHT COLUMN: Active Panel Detail */}
          <div className="md:col-span-7">
            {activeTab === "addresses" && (
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-stone-900">
                    My Addresses
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5A1F] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>

                {showAddressForm && (
                  <form
                    onSubmit={addAddress}
                    className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-[#FAFAFA] p-4"
                  >
                    <input
                      name="label"
                      required
                      placeholder="Label (Home, Work)"
                      className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm outline-none focus:border-[#FF5A1F]"
                    />
                    <textarea
                      name="address"
                      required
                      minLength={10}
                      placeholder="Full street address in Pavagada"
                      className="min-h-16 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm outline-none focus:border-[#FF5A1F]"
                    />
                    <input
                      name="landmark"
                      placeholder="Landmark (optional)"
                      className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm outline-none focus:border-[#FF5A1F]"
                    />
                    <button className="min-h-[42px] rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-white">
                      Save Address
                    </button>
                  </form>
                )}

                <div className="mt-4 divide-y divide-stone-100">
                  {addresses.map((address) => (
                    <div
                      className="flex items-start gap-3 py-3.5"
                      key={address.id}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 text-[#FF5A1F] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <b className="block text-sm font-bold text-stone-900">
                          {address.label}
                        </b>
                        <small className="mt-0.5 block text-xs text-stone-500">
                          {address.address_line}
                          {address.landmark ? `, ${address.landmark}` : ""}
                        </small>
                      </div>
                      <button
                        type="button"
                        aria-label="Delete address"
                        onClick={() => void removeAddress(address.id)}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {!addresses.length && (
                    <p className="py-6 text-xs text-stone-500">
                      No saved addresses yet.
                    </p>
                  )}
                </div>
              </section>
            )}

            {activeTab === "payments" && (
              <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs">
                <h2 className="text-base font-bold text-stone-900">
                  Payment Methods
                </h2>
                <div className="flex items-center justify-between rounded-xl border border-[#FF5A1F]/30 bg-[#FFF9F6] p-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-[#FF5A1F]" />
                    <div>
                      <p className="text-sm font-bold text-stone-900">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-xs text-stone-500">
                        Active for all Pavagada orders · Cash or doorstep UPI
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-[#EAF7EE] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">
                    Active
                  </span>
                </div>
                <div className="rounded-xl border border-stone-200 bg-[#FAFAFA] p-4 text-xs text-stone-600">
                  Direct online UPI &amp; Card checkout is coming soon.
                </div>
              </section>
            )}

            {activeTab === "offers" && (
              <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs">
                <h2 className="text-base font-bold text-stone-900">
                  Offers &amp; Rewards
                </h2>
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#FAFAFA] p-4"
                  >
                    <div>
                      <p className="font-mono text-sm font-extrabold text-[#FF5A1F]">
                        {c.code}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-600">
                        {c.discount_type === "percent"
                          ? `${c.discount_value}% off your order`
                          : `₹${(Number(c.discount_value) / 100).toFixed(0)} flat off at checkout`}
                      </p>
                    </div>
                    <Link
                      href="/customer/cart"
                      className="text-xs font-bold text-[#15803D] hover:underline"
                    >
                      Apply in Cart
                    </Link>
                  </div>
                ))}
                {!coupons.length && (
                  <p className="text-xs text-stone-500">
                    No active promo codes right now.
                  </p>
                )}
              </section>
            )}

            {activeTab === "support" && (
              <section className="space-y-4">
                <form
                  onSubmit={submitSupport}
                  className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs"
                >
                  <h2 className="text-base font-bold text-stone-900">
                    Help &amp; Support
                  </h2>
                  <input
                    name="subject"
                    required
                    placeholder="Subject (e.g., Delivery inquiry)"
                    className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                  />
                  <textarea
                    name="detail"
                    required
                    placeholder="Describe how we can help…"
                    className="min-h-24 w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                  />
                  <button className="min-h-[44px] w-full rounded-xl bg-[#FF5A1F] py-2.5 text-sm font-bold text-white">
                    Submit Support Case
                  </button>
                </form>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900">
                    Your Cases
                  </h3>
                  {cases.map((c) => (
                    <div
                      key={c.id}
                      className="border-b border-stone-100 pb-3 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-xs font-bold text-stone-900">
                          {c.subject}
                        </b>
                        <span className="rounded-md bg-[#EAF7EE] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600">{c.detail}</p>
                    </div>
                  ))}
                  {!cases.length && (
                    <p className="text-xs text-stone-500">
                      No support cases submitted yet.
                    </p>
                  )}
                </div>
              </section>
            )}

            {activeTab === "partner" && (
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-[#FF5A1F]" />
                  <h2 className="text-base font-bold text-stone-900">
                    List Your Shop on Pavagada One
                  </h2>
                </div>
                <form
                  onSubmit={submitPartnerApplication}
                  className="mt-4 space-y-3"
                >
                  <input
                    name="shopName"
                    required
                    placeholder="Shop name"
                    className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                  />
                  <input
                    name="phone"
                    required
                    placeholder="Business phone number"
                    className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                  />
                  <textarea
                    name="address"
                    required
                    placeholder="Shop address in Pavagada"
                    className="min-h-20 w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#FF5A1F]"
                  />
                  <button className="min-h-[44px] w-full rounded-xl bg-[#FF5A1F] py-2.5 text-sm font-bold text-white">
                    Submit Shop Application
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>
      </main>

      <CustomerNav />
    </div>
  );
}
