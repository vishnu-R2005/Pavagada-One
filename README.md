# Pavagada One

A local-delivery starter for Pavagada with customer, merchant, and operations dashboards. It uses **Next.js + TypeScript + Tailwind + Turso/libSQL**.

## Quick start

1. Copy `.env.example` to `.env.local` and set the URL and read/write token from your Turso database.
2. Create the database: `turso db create pavagada-one`.
3. Apply `supabase/migrations/0001_init.sql` in the Turso dashboard SQL editor or with `turso db shell pavagada-one < supabase/migrations/0001_init.sql`.
4. Install and run: `npm install`, then `npm run dev`.

## Security model

Turso is a remote SQLite database and does **not** implement database RLS like Supabase. The browser must never receive `TURSO_AUTH_TOKEN`; only server-side route handlers import `lib/db.ts`. Each protected handler must resolve the signed-in user, then scope reads/writes by user role: customers to their own cart/orders/addresses, merchants to their own shops/products/orders, and admins to all operations. Put the current-user lookup in the API before calling SQL. The sample order route marks that integration point explicitly.

## Included domain tables

Users and addresses; shops/categories/products/inventory; carts/items; orders/items/status history; delivery assignments; payments; and notifications. Monetary values are integer paise. `order_items` snapshots names/prices so past orders remain accurate.

## Authentication and payments

Bring your chosen server-side auth provider (Clerk, Auth.js, or a phone OTP service) and replace `REPLACE_WITH_AUTH_USER` in the checkout API with the verified session user id. The `payments` table is a provider-agnostic record scaffold. Verify payment webhooks server-side before changing `payment_status`.

## Production checklist

- Add signed auth sessions and role middleware.
- Execute checkout in a Turso transaction: validate cart/ownership, lock or conditionally decrement inventory, create order/items/history/payment, then clear cart.
- Rate limit public APIs, validate payloads with Zod, and use a restricted server token only.
- Add image storage, real notification delivery, rider interface, and payment provider keys only as server environment variables.