import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AuthForm } from "@/components/auth-form";

export default function SignIn() {
  return (
    <main className="grid min-h-screen bg-[#FAF8F5] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#14221B] lg:block">
        <img
          src="/images/hero-market.jpg"
          alt="Fresh local groceries in Pavagada"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14221B]/95 via-[#14221B]/45 to-[#14221B]/20" />
        <div className="absolute inset-x-10 bottom-12 text-white">
          <BrandLogo href="/" variant="light" size="lg" />
          <h2 className="mt-6 font-display text-3xl font-semibold leading-tight [text-wrap:balance]">
            Connected local commerce for Pavagada’s shops, riders, and homes.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
            Sign in with your account or launch any role directly below to explore the live order-to-delivery pipeline.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo href="/" size="md" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#14221B]">
            Sign in
          </h1>
          <p className="mt-1.5 mb-7 text-sm text-[#14221B]/65">
            Access your storefront, merchant centre, rider app, or operations console.
          </p>

          <AuthForm />

          <p className="mt-6 text-center text-sm text-[#14221B]/70">
            New to Pavagada One?{" "}
            <Link
              className="font-semibold text-[#0F5132] hover:underline"
              href="/sign-up"
            >
              Create a customer account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}