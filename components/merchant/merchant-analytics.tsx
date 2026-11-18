"use client";

import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import type { Dashboard, MerchantOrder } from "@/components/merchant/types";
import {
  buildSalesChartBuckets,
  calculateAverageOrderValue,
  calculateMerchantEarnings,
  formatRupees,
} from "@/lib/merchant-ui";

export function MerchantAnalytics({
  dashboard,
  orders,
  range,
  onChangeRange,
}: {
  dashboard: Dashboard | null;
  orders: MerchantOrder[];
  range: "today" | "week" | "month";
  onChangeRange: (r: "today" | "week" | "month") => void;
}) {
  const sale = dashboard?.sales[range] ?? { orders: 0, revenue: 0 };
  const { gross, platformFee, netEarnings } = calculateMerchantEarnings(
    Number(sale.revenue)
  );
  const avgOrder = calculateAverageOrderValue(
    Number(sale.revenue),
    Number(sale.orders)
  );
  const buckets = buildSalesChartBuckets(orders, range);

  const rangeDateLabel =
    range === "today"
      ? new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : range === "week"
        ? "Last 7 Days"
        : new Date().toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          });

  const periodSuffix =
    range === "today" ? "Today" : range === "week" ? "This Week" : "This Month";

  return (
    <div className="space-y-5">
      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Earnings &amp; Analytics
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Live revenue breakdown, 5% platform fee, and hourly sales volume
          </p>
        </div>
      </div>

      {/* Daily / Weekly / Monthly Segmented Pills (Screen 9) */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xs sm:inline-grid sm:w-auto sm:min-w-[320px]">
        {(
          [
            ["today", "Daily"],
            ["week", "Weekly"],
            ["month", "Monthly"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChangeRange(id)}
            className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition ${
              range === id
                ? "bg-[#FF5A1F] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date Navigation Strip */}
      <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs">
        <button
          type="button"
          onClick={() =>
            onChangeRange(
              range === "today" ? "week" : range === "week" ? "month" : "today"
            )
          }
          aria-label="Previous period"
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-stone-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="tabular-nums">{rangeDateLabel}</span>
        <button
          type="button"
          onClick={() =>
            onChangeRange(
              range === "today" ? "month" : range === "month" ? "week" : "today"
            )
          }
          aria-label="Next period"
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-stone-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Mint-Green Earnings Hero + 2x2 Breakdown */}
        <div className="space-y-4 lg:col-span-6">
          <section className="flex items-center justify-between rounded-2xl border border-[#BBF7D0] bg-[#DCFCE7] p-5 shadow-xs">
            <div>
              <p className="tabular-nums text-3xl font-extrabold text-[#15803D]">
                {formatRupees(netEarnings)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#166534]">
                Your Earnings {periodSuffix}
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#15803D] text-white shadow-sm shrink-0">
              <Wallet className="h-5 w-5" />
            </span>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <p className="tabular-nums text-xl font-extrabold text-stone-900">
                {formatRupees(gross)}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">
                Total Sales
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <p className="tabular-nums text-xl font-extrabold text-stone-900">
                {sale.orders}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">
                Total Orders
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <p className="tabular-nums text-xl font-extrabold text-stone-900">
                {formatRupees(avgOrder)}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">
                Avg Order Value
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <p className="tabular-nums text-xl font-extrabold text-stone-900">
                {formatRupees(platformFee)}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">
                Platform Fees (5%)
              </p>
            </div>
          </div>
        </div>

        {/* Sales Overview Bar Chart + Top Products */}
        <div className="space-y-4 lg:col-span-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900">
                Sales Overview
              </h2>
              <span className="text-[11px] font-medium text-stone-500">
                {periodSuffix}
              </span>
            </div>

            <div className="mt-5 flex h-36 items-end gap-2.5 border-b border-stone-100 pb-2">
              {buckets.map((b) => (
                <div
                  key={b.label}
                  className="flex flex-1 flex-col items-center justify-end gap-1.5 h-full"
                  title={`${b.label}: ${formatRupees(b.valuePaise)}`}
                >
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className={`w-full max-w-[34px] rounded-t-lg transition-all ${
                        b.valuePaise > 0
                          ? "bg-gradient-to-t from-[#FF5A1F] to-[#FF9B71]"
                          : "bg-stone-100"
                      }`}
                      style={{ height: `${b.heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-stone-500 whitespace-nowrap">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900">
              Top Selling Products
            </h2>
            <div className="mt-3 divide-y divide-stone-100">
              {dashboard?.topProducts?.length ? (
                dashboard.topProducts.map((p, idx) => (
                  <div
                    key={p.product_name}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <span>
                      <b className="mr-2 font-mono text-[#FF5A1F]">
                        0{idx + 1}.
                      </b>
                      <span className="font-semibold text-stone-900">
                        {p.product_name}
                      </span>
                    </span>
                    <span className="tabular-nums font-medium text-stone-500">
                      {p.units} sold ·{" "}
                      <b className="text-stone-900">
                        {formatRupees(p.revenue)}
                      </b>
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-5 text-xs text-stone-500">
                  Best-selling products will appear once orders arrive.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
