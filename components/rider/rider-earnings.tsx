"use client";

import { useState } from "react";
import { Calendar, Package, Wallet } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import type {
  RiderDashboardData,
  RiderDelivery,
} from "@/components/rider/types";
import {
  calculateRiderEarningsSummary,
  formatRupees,
} from "@/lib/rider-ui";

export function RiderEarningsView({
  dashboard,
}: {
  dashboard: RiderDashboardData;
}) {
  const [range, setRange] = useState<"daily" | "weekly" | "all">("daily");

  const activeBucket =
    range === "daily"
      ? {
          deliveries: dashboard.earnings.today?.deliveries ?? 0,
          earnings: dashboard.earnings.today?.earnings ?? 0,
          codCollected: dashboard.earnings.today?.cod_collected ?? 0,
          label: "Today's Earnings",
          periodCaption: "Today · Live Payout",
        }
      : range === "weekly"
        ? {
            deliveries: dashboard.earnings.week?.deliveries ?? 0,
            earnings: dashboard.earnings.week?.earnings ?? 0,
            codCollected: 0,
            label: "Weekly Earnings",
            periodCaption: "Last 7 Days",
          }
        : {
            deliveries:
              dashboard.earnings.allTime?.deliveries ??
              dashboard.history.length,
            earnings: dashboard.earnings.allTime?.earnings ?? 0,
            codCollected: 0,
            label: "Total Lifetime Earnings",
            periodCaption: "All Completed Trips",
          };

  const summary = calculateRiderEarningsSummary({
    deliveries: activeBucket.deliveries,
    deliveryFeesPaise: activeBucket.earnings,
    codCollectedPaise: activeBucket.codCollected,
    includeDailyIncentive: range === "daily",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Daily / Weekly / All Time Tabs (Screen 9) */}
      <div className="flex gap-2 rounded-2xl bg-stone-100 p-1">
        {(
          [
            ["daily", "Daily"],
            ["weekly", "Weekly"],
            ["all", "All Time"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRange(id)}
            className={`flex-1 min-h-[42px] rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              range === id
                ? "bg-[#FF5A1F] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period Indicator */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700">
        <Calendar className="h-4 w-4 text-[#FF5A1F]" />
        <span>{activeBucket.periodCaption}</span>
      </div>

      {/* Mint Green Hero Card (Screen 9) */}
      <section className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-[#EAF7EE] p-5">
        <div>
          <p className="text-xs font-semibold text-[#15803D]">
            {activeBucket.label}
          </p>
          <p className="mt-1 tabular-nums text-3xl font-extrabold text-[#15803D]">
            {formatRupees(summary.totalEarningsPaise)}
          </p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#15803D] shadow-xs">
          <Wallet className="h-6 w-6" />
        </span>
      </section>

      {/* 2x2 Metrics Grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <p className="tabular-nums text-xl font-extrabold text-stone-900">
            {summary.deliveries}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Deliveries</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <p className="tabular-nums text-xl font-extrabold text-stone-900">
            {formatRupees(summary.avgPerDeliveryPaise)}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Avg. per Delivery</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <p className="tabular-nums text-xl font-extrabold text-[#15803D]">
            {formatRupees(summary.incentivePaise)}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Incentives</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <p className="tabular-nums text-xl font-extrabold text-stone-900">
            {formatRupees(summary.codCollectedPaise)}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">COD Collected</p>
        </div>
      </section>

      {/* Earnings Breakdown (Screen 9) */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-stone-900">Earnings Breakdown</h2>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-stone-600">
            <span>
              Delivery Fees ({summary.deliveries} trip
              {summary.deliveries === 1 ? "" : "s"})
            </span>
            <span className="tabular-nums font-bold text-stone-900">
              {formatRupees(summary.deliveryFeesPaise)}
            </span>
          </div>
          <div className="flex items-center justify-between text-stone-600">
            <span>Milestone Incentives</span>
            <span className="tabular-nums font-bold text-stone-900">
              {formatRupees(summary.incentivePaise)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-sm font-extrabold text-stone-900">
            <span>Total</span>
            <span className="tabular-nums text-[#15803D]">
              {formatRupees(summary.totalEarningsPaise)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RiderOrderHistoryView({
  active,
  history,
  onSelectOrder,
}: {
  active: RiderDelivery[];
  history: RiderDelivery[];
  onSelectOrder: (order: RiderDelivery) => void;
}) {
  const [filter, setFilter] = useState<"all" | "completed" | "active">("all");
  const allOrders = [...active, ...history];
  const visible =
    filter === "all"
      ? allOrders
      : filter === "completed"
        ? history
        : active;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Filter Segmented Tabs (Screen 10) */}
      <div className="flex gap-2 rounded-2xl bg-stone-100 p-1">
        {(
          [
            ["all", `All (${allOrders.length})`],
            ["completed", `Completed (${history.length})`],
            ["active", `In Progress (${active.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`flex-1 min-h-[42px] rounded-xl px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
              filter === id
                ? "bg-[#FF5A1F] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {visible.map((order) => {
          const isCompleted =
            order.assignment_status === "delivered" ||
            order.status === "delivered";
          const timestamp = order.delivered_at || order.created_at;

          return (
            <button
              key={order.id}
              type="button"
              onClick={() => onSelectOrder(order)}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-xs transition hover:border-[#FF5A1F]/40"
            >
              <ProductImage
                src={order.shop_image || "/images/hero-market.jpg"}
                name={order.shop_name}
                className="h-14 w-14 rounded-xl object-cover shrink-0 bg-[#FFF3EE]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-extrabold text-stone-900 tabular-nums">
                    #{order.order_no}
                  </p>
                  <span
                    className={`text-[11px] font-bold whitespace-nowrap ${
                      isCompleted ? "text-[#15803D]" : "text-[#FF5A1F]"
                    }`}
                  >
                    {isCompleted ? "Delivered" : "In Progress"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-stone-700">
                  {order.shop_name} · {order.customer_name}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-stone-500">
                  <span className="truncate">
                    {new Date(
                      timestamp.includes("T") || timestamp.endsWith("Z")
                        ? timestamp
                        : `${timestamp.replace(" ", "T")}Z`
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="tabular-nums text-sm font-extrabold text-stone-900">
                    {formatRupees(order.delivery_fee_paise)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {!visible.length && (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
              <Package className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-stone-900">
              No delivery trips yet
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Completed and active deliveries appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
