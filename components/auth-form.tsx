"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Shield, ShoppingBag, Store, Truck } from "lucide-react";
import { apiFetch, writeSessionToken } from "@/lib/client-session";

const DEMO_ACCOUNTS = [
  {
    role: "Customer",
    email: "customer@pavagadaone.local",
    pass: "Customer@1234",
    icon: ShoppingBag,
  },
  {
    role: "Merchant",
    email: "merchant@pavagadaone.local",
    pass: "Merchant@1234",
    icon: Store,
  },
  {
    role: "Rider",
    email: "rider@pavagadaone.local",
    pass: "Rider@1234",
    icon: Truck,
  },
  {
    role: "Admin",
    email: "admin@gmail.com",
    pass: "admin@4432",
    icon: Shield,
  },
] as const;

export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function authenticate(payload: Record<string, unknown>, isRegister: boolean) {
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { error?: string; user?: { role: string }; sessionToken?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("The server returned an unreadable response.");
      }
      if (!res.ok) throw new Error(data.error ?? "Unable to sign in.");
      if (data.sessionToken) {
        writeSessionToken(data.sessionToken);
      }
      if (!data.user?.role)
        throw new Error("Sign-in response did not include an account role.");
      router.push(`/${data.user.role}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    await authenticate(body, register);
  }

  return (
    <div className="space-y-6">
      <form method="post" onSubmit={submit} className="space-y-4">
        {register && (
          <>
            <label className="block text-xs font-semibold text-[#14221B]/80">
              Full name
              <input
                required
                name="name"
                placeholder="Ananya Rao"
                className="mt-1.5 w-full rounded-xl border border-[#14221B]/15 bg-white px-3.5 py-3 text-sm text-[#14221B] outline-none transition focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/15"
              />
            </label>
            <label className="block text-xs font-semibold text-[#14221B]/80">
              Mobile number
              <input
                required
                name="phone"
                placeholder="9845011223"
                className="mt-1.5 w-full rounded-xl border border-[#14221B]/15 bg-white px-3.5 py-3 text-sm text-[#14221B] outline-none transition focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/15"
              />
            </label>
          </>
        )}

        <label className="block text-xs font-semibold text-[#14221B]/80">
          Email address
          <input
            required
            type="email"
            name="email"
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-xl border border-[#14221B]/15 bg-white px-3.5 py-3 text-sm text-[#14221B] outline-none transition focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/15"
          />
        </label>

        <label className="block text-xs font-semibold text-[#14221B]/80">
          Password
          <input
            required
            minLength={register ? 10 : 1}
            type="password"
            name="password"
            placeholder={register ? "At least 10 characters" : "Enter your password"}
            className="mt-1.5 w-full rounded-xl border border-[#14221B]/15 bg-white px-3.5 py-3 text-sm text-[#14221B] outline-none transition focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/15"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !hydrated}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F5132] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B3D25] disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Please wait…</span>
            </>
          ) : (
            <>
              <span>{register ? "Create customer account" : "Sign in"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {!register && (
        <div className="border-t border-[#14221B]/10 pt-5">
          <p className="text-xs font-semibold text-[#14221B]/70">
            Quick launch by role
          </p>
          <p className="mt-1 text-xs text-[#14221B]/55">
            Sign in with a verified demo account to test the complete delivery pipeline.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {DEMO_ACCOUNTS.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.role}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void authenticate(
                      { email: demo.email, password: demo.pass },
                      false
                    )
                  }
                  className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-[#14221B]/12 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-[#14221B] transition hover:border-[#0F5132] hover:bg-[#0F5132]/5 disabled:opacity-50"
                >
                  <Icon className="h-4 w-4 text-[#0F5132] shrink-0" />
                  <span className="truncate">{demo.role}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}