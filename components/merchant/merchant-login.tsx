"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Store,
} from "lucide-react";
import { BrandPinMark } from "@/components/brand-logo";
import { apiFetch, writeSessionToken } from "@/lib/client-session";

export function MerchantLogin({
  errorMessage,
  onSignedIn,
  onSwitchAccount,
}: {
  errorMessage?: string;
  onSignedIn: () => void;
  onSwitchAccount?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [applyMode, setApplyMode] = useState(false);
  const [applySuccess, setApplySuccess] = useState("");

  async function login(creds: { email: string; password: string }) {
    setFormError("");
    setBusy(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Unable to sign in.");
      }
      if (data.sessionToken) {
        writeSessionToken(data.sessionToken);
      }
      if (data.user?.role && data.user.role !== "merchant") {
        throw new Error(
          `This account has the "${data.user.role}" role. Use a Shop Partner (merchant) account.`
        );
      }
      onSignedIn();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await login({ email: email.trim(), password });
  }

  async function handleApply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setApplySuccess("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await apiFetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "merchant_apply",
          shopName: String(f.get("shopName") || ""),
          phone: String(f.get("phone") || ""),
          address: String(f.get("address") || ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            "Sign in with a customer account first or contact Pavagada One admin to register your shop."
        );
      }
      setApplySuccess(
        "Shop application submitted. Once approved by Pavagada One Admin, sign in here."
      );
      e.currentTarget.reset();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to submit application."
      );
    } finally {
      setBusy(false);
    }
  }

  const isRoleMismatch =
    errorMessage?.toLowerCase().includes("forbidden") ||
    errorMessage?.toLowerCase().includes("does not have a shop");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFE7D1] via-[#FFF6EE] to-[#FFFFFF] text-stone-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-10"
        style={{
          backgroundImage: "url('/images/hero-market.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to bottom, black 25%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 25%, transparent 100%)",
        }}
      />

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-10 md:grid md:grid-cols-12 md:items-center md:gap-12 md:px-8">
        {/* Brand Column */}
        <div className="flex flex-col items-center text-center md:col-span-6 md:items-start md:text-left">
          <BrandPinMark size="xl" />
          <h1 className="mt-4 text-[38px] font-extrabold leading-[1.04] tracking-tight sm:text-5xl">
            <span className="text-[#FF5A1F]">Pavagada</span>{" "}
            <span className="block text-[#15803D] sm:inline">One</span>
          </h1>
          <p className="mt-2.5 text-lg font-extrabold text-stone-900">
            Shop Partner
          </p>
          <p className="mt-1 max-w-sm text-sm font-medium text-stone-600">
            Grow Your Business with Pavagada One — manage orders, live stock,
            and daily earnings in real time.
          </p>

          <div className="mt-6 hidden gap-3 md:grid md:grid-cols-2 md:max-w-md">
            <div className="rounded-2xl border border-[#FF5A1F]/15 bg-white/90 p-3.5 shadow-xs">
              <p className="text-xs font-bold text-[#FF5A1F]">Instant Orders</p>
              <p className="mt-0.5 text-[11px] text-stone-600">
                Accept, pack, and dispatch directly to Pavagada riders.
              </p>
            </div>
            <div className="rounded-2xl border border-[#15803D]/15 bg-white/90 p-3.5 shadow-xs">
              <p className="text-xs font-bold text-[#15803D]">Live Inventory</p>
              <p className="mt-0.5 text-[11px] text-stone-600">
                Toggle items in stock and track daily payouts cleanly.
              </p>
            </div>
          </div>
        </div>

        {/* Auth Card Column (Screen 1) */}
        <div className="mt-7 w-full md:col-span-6 md:mt-0">
          <div className="mx-auto max-w-md rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
            {applyMode ? (
              <form onSubmit={handleApply} className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setApplyMode(false);
                      setFormError("");
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-stone-200 text-stone-700"
                    aria-label="Back to login"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-stone-900">
                      Create Shop Account
                    </h2>
                    <p className="text-[11px] text-stone-500">
                      Submit your Pavagada shop for onboarding
                    </p>
                  </div>
                </div>

                <input
                  name="shopName"
                  required
                  placeholder="Shop Name (e.g., Sri Lakshmi Super Mart)"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  name="phone"
                  required
                  placeholder="Mobile Number (+91 ...)"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <textarea
                  name="address"
                  required
                  placeholder="Shop Address in Pavagada"
                  className="min-h-20 w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />

                {formError && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                    {formError}
                  </p>
                )}
                {applySuccess && (
                  <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#EAF7EE] px-3.5 py-2.5 text-xs font-medium text-[#15803D]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{applySuccess}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[48px] w-full rounded-xl bg-[#FF5A1F] py-3 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 hover:bg-[#E54910] disabled:opacity-60"
                >
                  {busy ? "Submitting…" : "Submit Shop Application"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {(isRoleMismatch || errorMessage) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900">
                    {isRoleMismatch
                      ? "Sign in with a Shop Partner (merchant) account to manage a store."
                      : errorMessage}
                    {onSwitchAccount && isRoleMismatch && (
                      <button
                        type="button"
                        onClick={onSwitchAccount}
                        className="mt-1.5 block font-bold text-[#FF5A1F] hover:underline"
                      >
                        Sign out of current session
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="relative flex items-center rounded-xl border border-stone-200 bg-white px-3.5 focus-within:border-[#FF5A1F]">
                    <Mail className="h-4 w-4 text-stone-400 shrink-0" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Partner Email"
                      aria-label="Enter Partner Email"
                      className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-stone-400"
                    />
                  </div>

                  <div className="relative flex items-center rounded-xl border border-stone-200 bg-white px-3.5 focus-within:border-[#FF5A1F]">
                    <Lock className="h-4 w-4 text-stone-400 shrink-0" />
                    <input
                      required
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      aria-label="Enter Password"
                      className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                      className="grid h-9 w-9 place-items-center text-stone-400 hover:text-stone-700"
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {formError && (
                    <p
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] py-3 text-sm font-bold text-white shadow-md shadow-[#FF5A1F]/25 transition hover:bg-[#E54910] disabled:opacity-60"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <span>Login</span>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-3 text-xs text-stone-400">
                  <span className="h-px flex-1 bg-stone-200" />
                  <span>OR</span>
                  <span className="h-px flex-1 bg-stone-200" />
                </div>

                <button
                  type="button"
                  onClick={() => setApplyMode(true)}
                  className="min-h-[46px] w-full rounded-xl border-2 border-[#15803D] bg-white py-2.5 text-sm font-bold text-[#15803D] transition hover:bg-[#EAF7EE]"
                >
                  Create Shop Account
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void login({
                      email: "merchant@pavagadaone.local",
                      password: "Merchant@1234",
                    })
                  }
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-[#FAFAFA] py-2 text-xs font-semibold text-stone-700 hover:border-[#FF5A1F]/40"
                >
                  <Store className="h-3.5 w-3.5 text-[#FF5A1F]" />
                  <span>Quick Demo Shop Partner Sign-In</span>
                </button>

                <div className="pt-1 text-center text-[11px] text-stone-500">
                  <p>Partner with Pavagada One · Serve Your Community</p>
                  <Link
                    href="/customer"
                    className="mt-1 inline-block font-semibold text-[#FF5A1F] hover:underline"
                  >
                    Back to Customer Storefront
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
