"use client";

import { FormEvent, useState } from "react";
import {
  BarChart3,
  Bell,
  Camera,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  LogOut,
  Package,
  Pencil,
  Settings,
  Store,
  Truck,
} from "lucide-react";
import type {
  MerchantNotification,
  MerchantPage,
  Shop,
} from "@/components/merchant/types";

const SHOP_IMAGE_PRESETS = [
  "/images/shop-lakshmi.jpg",
  "/images/shop-fruits.jpg",
  "/images/shop-dairy.jpg",
  "/images/shop-bakery.jpg",
];

export function MerchantProfileView({
  shop,
  ownerName,
  onEdit,
}: {
  shop: Shop;
  ownerName: string;
  onEdit: () => void;
}) {
  const rows = [
    { label: "Owner Name", value: ownerName || "Shop Partner" },
    { label: "Phone Number", value: shop.phone },
    { label: "Shop Category", value: "Grocery & Daily Needs" },
    { label: "Shop Address", value: shop.address },
    { label: "Shop Timings", value: shop.opening_hours || "7:00 AM - 10:00 PM" },
    {
      label: "Delivery Radius",
      value: shop.delivery_available === 0 ? "Pickup only" : "5 km · Local Delivery",
    },
    {
      label: "Partner Status",
      value: shop.is_approved ? "Approved Partner" : "Pending Verification",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        {/* Banner Photo */}
        <div className="relative h-40 w-full bg-gradient-to-br from-[#FFF3EE] to-[#FED7AA]">
          {shop.image_url ? (
            <img
              src={shop.image_url}
              alt={shop.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-[#FF5A1F]/40">
              <Store className="h-14 w-14" />
            </div>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-stone-900/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs hover:bg-stone-900"
          >
            <Camera className="h-3.5 w-3.5" />
            Change Photo
          </button>
        </div>

        {/* Circular Overlapping Shop Thumbnail + Name */}
        <div className="relative z-10 px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            {shop.image_url ? (
              <img
                src={shop.image_url}
                alt={shop.name}
                referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md bg-white shrink-0"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-[#FFF3EE] text-[#FF5A1F] shadow-md shrink-0">
                <Store className="h-8 w-8" />
              </span>
            )}
            <div className="min-w-0 flex-1 pt-10">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-xl font-bold text-stone-900">
                  {shop.name}
                </h2>
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label="Edit shop profile"
                  className="text-stone-400 hover:text-stone-800"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <span
                className={`mt-1 inline-block rounded-md px-2.5 py-0.5 text-[11px] font-bold ${
                  shop.is_open
                    ? "bg-[#EAF7EE] text-[#15803D]"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {shop.is_open ? "Open" : "Paused"}
              </span>
            </div>
          </div>

          {/* Spec Table */}
          <dl className="mt-6 divide-y divide-stone-100 border-t border-stone-100 text-sm">
            {rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-12 gap-3 py-3 text-xs sm:text-sm"
              >
                <dt className="col-span-5 font-medium text-stone-500">
                  {r.label}
                </dt>
                <dd className="col-span-7 font-semibold text-stone-900">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            onClick={onEdit}
            className="mt-5 min-h-[48px] w-full rounded-xl border border-[#FF5A1F] bg-white px-5 py-3 text-sm font-bold text-[#FF5A1F] transition hover:bg-[#FFF8F5]"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export function MerchantEditShopForm({
  shop,
  busy,
  onSave,
  onCancel,
}: {
  shop: Shop;
  busy: boolean;
  onSave: (payload: {
    name: string;
    phone: string;
    address: string;
    openingHours?: string;
    isOpen: boolean;
    deliveryAvailable: boolean;
    imageUrl?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(shop.name);
  const [phone, setPhone] = useState(shop.phone);
  const [address, setAddress] = useState(shop.address);
  const [openingHours, setOpeningHours] = useState(
    shop.opening_hours || "7:00 AM - 10:00 PM"
  );
  const [imageUrl, setImageUrl] = useState(shop.image_url || "");
  const [isOpen, setIsOpen] = useState(Boolean(shop.is_open));
  const [deliveryAvailable, setDeliveryAvailable] = useState(
    shop.delivery_available !== 0
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      openingHours: openingHours.trim() || undefined,
      isOpen,
      deliveryAvailable,
      imageUrl: imageUrl.trim() || null,
    });
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <div>
        <label className="mb-1.5 block text-xs font-bold text-stone-700">
          Shop Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-stone-700">
            Phone Number
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-stone-700">
            Business Hours
          </label>
          <input
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="7:00 AM - 10:00 PM"
            className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-stone-700">
          Shop Address
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-stone-700">
          Shop Banner Photo URL
        </label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/images/shop-lakshmi.jpg or https://..."
          className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-xs outline-none focus:border-[#FF5A1F] focus:bg-white"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {SHOP_IMAGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setImageUrl(preset)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                imageUrl === preset
                  ? "border-[#FF5A1F] bg-[#FFF3EE] text-[#FF5A1F]"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {preset.replace("/images/", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#FAFAFA] px-4 py-3 cursor-pointer">
          <span className="text-xs font-bold text-stone-900">
            Shop Accepting Orders
          </span>
          <input
            type="checkbox"
            checked={isOpen}
            onChange={(e) => setIsOpen(e.target.checked)}
            className="h-4 w-4 accent-[#15803D]"
          />
        </label>
        <label className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#FAFAFA] px-4 py-3 cursor-pointer">
          <span className="text-xs font-bold text-stone-900">
            Local Delivery Enabled
          </span>
          <input
            type="checkbox"
            checked={deliveryAvailable}
            onChange={(e) => setDeliveryAvailable(e.target.checked)}
            className="h-4 w-4 accent-[#15803D]"
          />
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] flex-[2] rounded-xl bg-[#FF5A1F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#E54910] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save Shop Profile"}
        </button>
      </div>
    </form>
  );
}

export function MerchantSettingsView({
  shop,
  onNavigate,
  onToggleDelivery,
}: {
  shop: Shop;
  onNavigate: (page: MerchantPage) => void;
  onToggleDelivery: () => void;
}) {
  const [showPayments, setShowPayments] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <button
          type="button"
          onClick={() => onNavigate("edit-profile")}
          className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <Store className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-semibold text-stone-900">
              Shop Information
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("edit-profile")}
          className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-stone-600" />
            <span>
              <span className="block text-sm font-semibold text-stone-900">
                Business Hours
              </span>
              <span className="block text-xs text-stone-500">
                {shop.opening_hours || "7:00 AM - 10:00 PM"}
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        <div className="flex min-h-[56px] w-full items-center justify-between px-4 py-3">
          <span className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-stone-600" />
            <span>
              <span className="block text-sm font-semibold text-stone-900">
                Delivery Settings
              </span>
              <span className="block text-xs text-stone-500">
                {shop.delivery_available === 0
                  ? "Pickup only"
                  : "Local rider delivery active"}
              </span>
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={shop.delivery_available !== 0}
            aria-label="Toggle local delivery"
            onClick={onToggleDelivery}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              shop.delivery_available !== 0 ? "bg-[#15803D]" : "bg-stone-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                shop.delivery_available !== 0 ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPayments((v) => !v)}
          className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-semibold text-stone-900">
              Payment Settings
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        {showPayments && (
          <div className="bg-[#FAFAFA] px-4 py-3 text-xs text-stone-600 space-y-1">
            <p className="font-bold text-stone-900">
              UPI &amp; Cash on Delivery Enabled
            </p>
            <p>
              Standard Pavagada One partner fee is 5% per completed order. Payouts
              are settled directly to your registered shop account.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => onNavigate("notifications")}
          className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-semibold text-stone-900">
              Notification Preferences
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        <div className="flex min-h-[56px] w-full items-center justify-between px-4 py-3">
          <span className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-semibold text-stone-900">
              Language
            </span>
          </span>
          <span className="text-xs font-semibold text-stone-500">English</span>
        </div>
      </div>
    </div>
  );
}

export function MerchantMoreView({
  shop,
  onNavigate,
  onLogout,
}: {
  shop: Shop;
  onNavigate: (page: MerchantPage) => void;
  onLogout: () => void;
}) {
  const [showTerms, setShowTerms] = useState(false);

  const items: Array<{
    label: string;
    icon: typeof Package;
    target: MerchantPage;
  }> = [
    { label: "My Products", icon: Package, target: "products" },
    { label: "My Orders", icon: ClipboardList, target: "orders" },
    { label: "Earnings & Reports", icon: BarChart3, target: "analytics" },
    { label: "Shop Profile", icon: Store, target: "profile" },
    { label: "Settings", icon: Settings, target: "settings" },
    { label: "Notifications", icon: Bell, target: "notifications" },
    { label: "Help & Support", icon: HelpCircle, target: "support" },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Shop Header Card (Screen 11) */}
      <button
        type="button"
        onClick={() => onNavigate("profile")}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-xs hover:border-stone-300 transition-colors"
      >
        {shop.image_url ? (
          <img
            src={shop.image_url}
            alt={shop.name}
            referrerPolicy="no-referrer"
            className="h-14 w-14 rounded-full border border-stone-200 object-cover shrink-0"
          />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
            <Store className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-extrabold text-stone-900">
            {shop.name}
          </h2>
          <p className="text-xs text-stone-500">Grocery &amp; Daily Needs</p>
          <span
            className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
              shop.is_open
                ? "bg-[#EAF7EE] text-[#15803D]"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {shop.is_open ? "Open" : "Paused"}
          </span>
        </div>
        <ChevronRight className="h-5 w-5 text-stone-400 shrink-0" />
      </button>

      {/* Menu List */}
      <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.target)}
              className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-stone-600" />
                <span className="text-sm font-semibold text-stone-900">
                  {item.label}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-stone-400" />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowTerms((v) => !v)}
          className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-semibold text-stone-900">
              Terms &amp; Privacy
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        {showTerms && (
          <div className="bg-[#FAFAFA] px-4 py-3 text-xs leading-relaxed text-stone-600">
            Merchants keep catalog accuracy and pack quality up to date. Customer
            phone details are strictly for active delivery coordination within
            Pavagada.
          </div>
        )}
      </div>

      {/* Outlined Red Logout Button */}
      <button
        type="button"
        onClick={onLogout}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-5 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}

export function MerchantNotificationsView({
  notifications,
  onMarkAllRead,
}: {
  notifications: MerchantNotification[];
  onMarkAllRead: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500">
          {notifications.filter((n) => !n.read_at).length} unread alerts
        </p>
        {notifications.some((n) => !n.read_at) && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-bold text-[#FF5A1F] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 shadow-xs ${
                n.read_at
                  ? "border-stone-200 bg-white"
                  : "border-[#FF5A1F]/30 bg-[#FFF8F5]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-stone-900">{n.title}</p>
                {!n.read_at && (
                  <span className="rounded-full bg-[#FF5A1F] px-2 py-0.5 text-[10px] font-bold text-white">
                    New
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                {n.body}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center shadow-xs">
            <Bell className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-2 text-sm font-bold text-stone-800">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-stone-500">
              New customer orders and rider pickup updates will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MerchantSupportView({
  onSubmitTicket,
  busy,
}: {
  onSubmitTicket: (subject: string, detail: string) => Promise<void>;
  busy: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmitTicket(subject.trim(), detail.trim());
    setSubject("");
    setDetail("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Merchant Partner Support
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Need help with payouts, rider pickups, or catalog updates? Send a
            ticket to the Pavagada One operations desk.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g., Payout inquiry or Rider delay)"
            required
            minLength={3}
            className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Describe your issue or order number…"
            required
            minLength={5}
            rows={4}
            className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] p-3.5 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-[48px] w-full rounded-xl bg-[#FF5A1F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#E54910] disabled:opacity-50"
          >
            {busy ? "Sending Ticket…" : "Submit Support Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
