"use client";

import { FormEvent, useState } from "react";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  Gift,
  HelpCircle,
  Info,
  LogOut,
  MapPin,
  ShieldCheck,
  Sliders,
  Star,
  Truck,
  User,
} from "lucide-react";
import type {
  RiderNotification,
  RiderPage,
  RiderProfile,
} from "@/components/rider/types";
import {
  calculateRiderIncentive,
  formatRiderTimeAgo,
  formatRupees,
} from "@/lib/rider-ui";

export function RiderProfileView({
  profile,
  deliveriesToday,
  online,
  busy,
  onSaveProfile,
  onToggleOnline,
  onNavigate,
  onLogout,
}: {
  profile: RiderProfile;
  deliveriesToday: number;
  online: boolean;
  busy: boolean;
  onSaveProfile: (fullName: string, phone: string) => Promise<void>;
  onToggleOnline: () => void;
  onNavigate: (page: RiderPage) => void;
  onLogout: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || "");

  const initial = profile.full_name.trim().charAt(0).toUpperCase() || "R";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSaveProfile(fullName.trim(), phone.trim());
    setEditing(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Rider Profile Card (Screen 11) */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#FFF3EE] text-lg font-extrabold text-[#FF5A1F] shrink-0">
              {initial}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-stone-900">
                {profile.full_name}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>Verified Partner · {profile.phone || profile.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFullName(profile.full_name);
              setPhone(profile.phone || "");
              setEditing((v) => !v);
            }}
            className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-[#EFF6FF]"
          >
            {editing ? "Close" : "Edit"}
          </button>
        </div>

        {editing && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 space-y-3 border-t border-stone-100 pt-4"
          >
            <label className="block text-xs font-semibold text-stone-700">
              Full Name
              <input
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A1F]"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              Mobile Number
              <input
                required
                minLength={8}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A1F]"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-[44px] w-full rounded-xl bg-[#FF5A1F] py-2.5 text-xs font-bold text-white hover:bg-[#E54910] disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save Profile Changes"}
            </button>
          </form>
        )}
      </section>

      {/* Menu List (Screen 11) */}
      <section className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-700">
              <User className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900">
                Personal Information
              </p>
              <p className="text-[11px] text-stone-500">{profile.email}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowZones((v) => !v)}
          className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-700">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900">
                Vehicle & Service Zones
              </p>
              <p className="text-[11px] text-stone-500">
                Pavagada Town · Two-Wheeler Fleet
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        {showZones && (
          <div className="bg-[#FAFAFA] px-4 py-3 text-xs text-stone-600">
            Active zones covered: Pavagada Town, Temple Street, Bus Stand Road,
            Hirehalli, Kudligi Road, and Nellikaiyanahatti.
          </div>
        )}

        <div className="flex min-h-[58px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-700">
              <Sliders className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900">
                Availability Settings
              </p>
              <p className="text-[11px] text-stone-500">
                {online
                  ? "Currently Online for pickups"
                  : "Currently Offline · Paused"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={online}
            aria-label="Toggle delivery availability"
            disabled={busy}
            onClick={onToggleOnline}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              online ? "bg-[#15803D]" : "bg-stone-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                online ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("history")}
          className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-700">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900">Trip History</p>
              <p className="text-[11px] text-stone-500">
                {deliveriesToday} completed today
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("support")}
          className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-700">
              <HelpCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900">
                Help & Support
              </p>
              <p className="text-[11px] text-stone-500">
                Contact Pavagada One operations
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 py-3 text-sm font-bold text-rose-600 hover:bg-rose-100/70"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </div>
  );
}

export function RiderMoreView({
  unreadCount,
  deliveriesToday,
  onNavigate,
}: {
  unreadCount: number;
  deliveriesToday: number;
  onNavigate: (page: RiderPage) => void;
}) {
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const incentive = calculateRiderIncentive(deliveriesToday);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <button
          type="button"
          onClick={() => onNavigate("notifications")}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-bold text-stone-900">
              Notifications
            </span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#FF5A1F] px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-stone-400" />
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setOpenInfo((v) => (v === "incentives" ? null : "incentives"))
          }
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-bold text-stone-900">
              Incentives & Targets
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>
        {openInfo === "incentives" && (
          <div className="bg-[#EAF7EE] px-4 py-3 text-xs text-[#15803D]">
            Complete 5 deliveries/day for ₹50 bonus or {incentive.target}{" "}
            deliveries/day for {formatRupees(incentive.bonusPaise)} bonus. Today:{" "}
            {incentive.completed}/{incentive.target}.
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpenInfo((v) => (v === "safety" ? null : "safety"))}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-bold text-stone-900">
              Safety Guidelines
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>
        {openInfo === "safety" && (
          <div className="bg-[#FAFAFA] px-4 py-3 text-xs text-stone-600">
            Always wear a helmet, verify item counts at shop pickup, and confirm
            COD collection before closing the trip.
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpenInfo((v) => (v === "areas" ? null : "areas"))}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-bold text-stone-900">
              Service Areas
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>
        {openInfo === "areas" && (
          <div className="bg-[#FAFAFA] px-4 py-3 text-xs text-stone-600">
            Pavagada Town, Temple Street, Main Road, Bus Stand Road, Hirehalli,
            Kudligi Road, and Nellikaiyanahatti.
          </div>
        )}

        <button
          type="button"
          onClick={() => onNavigate("support")}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-bold text-stone-900">
              Contact Support
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>

        <button
          type="button"
          onClick={() => setOpenInfo((v) => (v === "about" ? null : "about"))}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
        >
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-stone-600" />
            <span className="text-sm font-bold text-stone-900">
              About Pavagada One
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </button>
        {openInfo === "about" && (
          <div className="bg-[#FAFAFA] px-4 py-3 text-xs text-stone-600">
            Pavagada One connects local neighbourhood shops, delivery partners,
            and households across Pavagada on one real-time platform.
          </div>
        )}
      </section>

      {/* Bottom Promotional Banner (Screen 12) */}
      <section className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-[#FF5A1F]/15 bg-gradient-to-r from-[#FFF3EE] via-[#FFE9D6] to-[#FFE0C4] p-4 shadow-xs">
        <div>
          <p className="text-lg font-extrabold leading-tight text-stone-900">
            Deliver.
            <br />
            Earn. Grow.
          </p>
          <p className="mt-1 text-xs font-bold text-[#FF5A1F]">
            With Pavagada One
          </p>
        </div>
        <img
          src="/images/rider-scooter.jpg"
          alt="Pavagada One delivery partner"
          referrerPolicy="no-referrer"
          className="h-24 w-32 rounded-xl object-cover shadow-xs shrink-0"
        />
      </section>
    </div>
  );
}

export function RiderNotificationsView({
  notifications,
  onMarkAllRead,
}: {
  notifications: RiderNotification[];
  onMarkAllRead: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500">
          Live pickup & delivery alerts
        </p>
        {notifications.some((n) => !n.read_at) && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-bold text-[#FF5A1F] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {notifications.map((n) => (
          <article
            key={n.id}
            className={`rounded-2xl border p-4 shadow-xs ${
              n.read_at
                ? "border-stone-200 bg-white"
                : "border-[#FF5A1F]/30 bg-[#FFF9F6]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-stone-900">{n.title}</p>
              <span className="text-[11px] text-stone-400">
                {formatRiderTimeAgo(n.created_at)}
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-600">{n.body}</p>
          </article>
        ))}

        {!notifications.length && (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <Bell className="mx-auto h-7 w-7 text-stone-300" />
            <p className="mt-2 text-sm font-bold text-stone-900">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Dispatch alerts and delivery updates will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function RiderSupportView({
  busy,
  onSubmitTicket,
}: {
  busy: boolean;
  onSubmitTicket: (subject: string, detail: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !detail.trim()) return;
    await onSubmitTicket(subject.trim(), detail.trim());
    setSubject("");
    setDetail("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-stone-900">
          Contact Operations Support
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Report a customer address issue, shop delay, or payout question to
          Pavagada One operations.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            required
            minLength={3}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g., Shop delay on #PO...)"
            className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
          />
          <textarea
            required
            minLength={5}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Describe what happened..."
            className="min-h-28 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] p-3.5 text-sm outline-none focus:border-[#FF5A1F]"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-[48px] w-full rounded-xl bg-[#FF5A1F] py-3 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 hover:bg-[#E54910] disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send Support Request"}
          </button>
        </form>
      </section>
    </div>
  );
}
