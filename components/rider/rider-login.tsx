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
  Truck,
} from "lucide-react";
import { BrandPinMark } from "@/components/brand-logo";
import { apiFetch, writeSessionToken } from "@/lib/client-session";

export function RiderLogin({
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
  const [registerMode, setRegisterMode] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");

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
      if (data.user?.role && data.user.role !== "rider") {
        throw new Error(
          `This account has the "${data.user.role}" role. Use a Delivery Partner (rider) account.`
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

  async function handlePartnerRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setRegisterSuccess("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    const partnerEmail = String(f.get("email") || "").trim();
    const pass = String(f.get("password") || "");
    const vehicle = String(f.get("vehicle") || "").trim();

    try {
      const regRes = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: partnerEmail,
          password: pass,
        }),
      });
      const regBody = await regRes.json().catch(() => ({}));
      if (!regRes.ok) {
        throw new Error(regBody.error || "Unable to create partner profile.");
      }
      if (regBody.sessionToken) {
        writeSessionToken(regBody.sessionToken);
      }

      await apiFetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "support",
          subject: `Delivery Partner Application: ${name}`,
          detail: `Phone: ${phone} | Vehicle: ${vehicle || "Two-wheeler"} | Email: ${partnerEmail}`,
        }),
      });

      setRegisterSuccess(
        "Partner application submitted! Pavagada One Admin can activate your rider role from the Users panel."
      );
      e.currentTarget.reset();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to submit delivery partner application."
      );
    } finally {
      setBusy(false);
    }
  }

  const isRoleMismatch =
    errorMessage?.toLowerCase().includes("delivery partner access") ||
    errorMessage?.toLowerCase().includes("forbidden");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFE7D1] via-[#FFF6EE] to-[#FFFFFF] text-stone-900">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-8 md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-8">
        {/* Left Hero Column (Screen 1 Illustration & Brand) */}
        <div className="flex flex-col items-center text-center md:col-span-6 md:items-start md:text-left">
          <BrandPinMark size="xl" />
          <h1 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            <span className="text-[#FF5A1F]">Pavagada</span>{" "}
            <span className="text-[#15803D]">One</span>
          </h1>
          <p className="mt-1.5 text-lg font-extrabold text-stone-900">
            Delivery Partner
          </p>
          <p className="mt-1 text-sm font-medium text-stone-600">
            Earn with Every Delivery · Serve Our Pavagada
          </p>

          <div className="mt-5 w-full max-w-sm overflow-hidden rounded-3xl border border-[#FF5A1F]/15 bg-white shadow-sm md:max-w-md">
            <img
              src="/images/rider-scooter.jpg"
              alt="Pavagada One delivery partner on scooter"
              referrerPolicy="no-referrer"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>

        {/* Right Auth Card Column */}
        <div className="mt-6 w-full md:col-span-6 md:mt-0">
          <div className="mx-auto max-w-md rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
            {registerMode ? (
              <form onSubmit={handlePartnerRegister} className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMode(false);
                      setFormError("");
                    }}
                    aria-label="Back to login"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-stone-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-stone-900">
                      Register as Delivery Partner
                    </h2>
                    <p className="text-xs text-stone-500">
                      Apply to deliver orders across Pavagada Town
                    </p>
                  </div>
                </div>

                <input
                  name="name"
                  required
                  placeholder="Full Name (e.g., Kiran Gowda)"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  name="phone"
                  required
                  placeholder="Mobile Number (+91 ...)"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  name="vehicle"
                  placeholder="Vehicle Details (e.g., Bike · KA 06 AB 1234)"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={10}
                  placeholder="Create Password (min 10 characters)"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />

                {formError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
                  >
                    {formError}
                  </p>
                )}
                {registerSuccess && (
                  <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#EAF7EE] px-3.5 py-2.5 text-xs font-medium text-[#15803D]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{registerSuccess}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[48px] w-full rounded-xl bg-[#FF5A1F] py-3 text-sm font-bold text-white shadow-sm shadow-[#FF5A1F]/25 hover:bg-[#E54910] disabled:opacity-60"
                >
                  {busy ? "Submitting…" : "Submit Partner Application"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {(isRoleMismatch || errorMessage) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900">
                    {isRoleMismatch
                      ? "Sign in with a Delivery Partner (rider) account to open the rider dashboard."
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
                      <span>Sign In as Delivery Partner</span>
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
                  disabled={busy}
                  onClick={() =>
                    void login({
                      email: "rider@pavagadaone.local",
                      password: "Rider@1234",
                    })
                  }
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#15803D] bg-white py-2.5 text-sm font-bold text-[#15803D] transition hover:bg-[#EAF7EE] disabled:opacity-60"
                >
                  <Truck className="h-4 w-4" />
                  <span>Quick Demo Delivery Partner Sign-In</span>
                </button>

                <div className="pt-1 text-center text-xs text-stone-500">
                  <p>
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => setRegisterMode(true)}
                      className="font-bold text-[#FF5A1F] hover:underline"
                    >
                      Register as Delivery Partner
                    </button>
                  </p>
                  <Link
                    href="/customer"
                    className="mt-2 inline-block font-semibold text-stone-500 hover:text-[#FF5A1F]"
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
