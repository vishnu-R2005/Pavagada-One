"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Package, ShoppingBag, Store } from "lucide-react";
import { CustomerHeader, CustomerNav } from "@/components/customer-nav";
import { apiFetch } from "@/lib/client-session";
import { formatRupees } from "@/lib/customer-ui";

type Order = {
  id: string;
  order_no: string;
  status: string;
  total_paise: number;
  created_at: string;
  shop_name: string;
  payment_status: string;
};

const statusLabel = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (v) => v.toUpperCase());

const statusTone = (status: string) =>
  status === "cancelled"
    ? "bg-rose-50 text-rose-700"
    : status === "delivered"
      ? "bg-[#EAF7EE] text-[#15803D]"
      : "bg-[#FFF3EE] text-[#FF5A1F]";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await apiFetch("/api/orders");
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setOrders(data.orders ?? []);
      setUnauthenticated(false);
    } else if (response.status === 401) {
      setUnauthenticated(true);
    } else {
      setNotice(data.error || "Unable to load orders.");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function cancel(id: string) {
    const response = await apiFetch(`/api/orders/${id}/cancel`, {
      method: "POST",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(data.error || "This order cannot be cancelled.");
      return;
    }
    setNotice("Order cancelled and stock restored.");
    await load();
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-24 md:pb-12">
      <CustomerHeader title="My Orders" backHref="/customer" />

      <main className="mx-auto max-w-4xl px-4 pt-4 md:px-8 md:pt-8">
        <div className="hidden md:block">
          <h1 className="font-display text-2xl font-bold text-stone-900">
            My Orders
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Track live Pavagada deliveries and inspect item receipts
          </p>
        </div>

        {notice && (
          <button
            type="button"
            onClick={() => setNotice("")}
            className="mt-4 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-xs font-semibold text-stone-800"
          >
            {notice}
          </button>
        )}

        {unauthenticated && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center shadow-xs">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
              <Package className="h-7 w-7" />
            </div>
            <p className="mt-3 text-base font-bold text-stone-900">
              Sign in to view your orders
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Track live deliveries and view item receipts for your Pavagada One account.
            </p>
            <Link
              href="/sign-in"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-[#FF5A1F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E54910]"
            >
              Sign in
            </Link>
          </div>
        )}

        <section className="mt-4 space-y-3 md:mt-6">
          {orders.map((order) => (
            <article
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs transition hover:border-[#FF5A1F]/40"
              key={order.id}
            >
              <Link href={`/customer/orders/${order.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
                      <Store className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-stone-900">
                        {order.shop_name}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-stone-500">
                        {order.order_no} ·{" "}
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold shrink-0 ${statusTone(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5A1F]">
                    <span>
                      {order.status === "delivered"
                        ? "View order receipt"
                        : "Track delivery"}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                  <b className="tabular-nums text-sm font-extrabold text-stone-900">
                    {formatRupees(order.total_paise)}
                  </b>
                </div>
              </Link>

              {order.status === "placed" && (
                <div className="mt-2.5 border-t border-stone-100 pt-2.5">
                  <button
                    type="button"
                    onClick={() => void cancel(order.id)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Cancel order
                  </button>
                </div>
              )}
            </article>
          ))}

          {!loading && !orders.length && !notice && !unauthenticated && (
            <div className="rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center shadow-xs">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
                <Package className="h-7 w-7" />
              </div>
              <p className="mt-3 text-base font-bold text-stone-900">
                No orders yet
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Place your first grocery or essentials order in Pavagada.
              </p>
              <Link
                href="/customer/shops"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#FF5A1F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E54910]"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Start Shopping</span>
              </Link>
            </div>
          )}
        </section>
      </main>

      <CustomerNav />
    </div>
  );
}
