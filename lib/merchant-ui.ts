export const PLATFORM_FEE_RATE = 0.05;

export function formatRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((Number(paise) || 0) / 100);
}

export function calculateMerchantEarnings(grossSalesPaise: number) {
  const gross = Math.max(0, Math.round(Number(grossSalesPaise) || 0));
  const platformFee = Math.round(gross * PLATFORM_FEE_RATE);
  const netEarnings = Math.max(0, gross - platformFee);
  return {
    gross,
    platformFee,
    netEarnings,
  };
}

export function calculateAverageOrderValue(
  grossSalesPaise: number,
  orderCount: number
): number {
  if (!orderCount || orderCount <= 0) return 0;
  return Math.round((Number(grossSalesPaise) || 0) / Number(orderCount));
}

export const MERCHANT_ORDER_LABELS: Record<string, string> = {
  placed: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  assigned: "Picked",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function getMerchantOrderLabel(status: string): string {
  return MERCHANT_ORDER_LABELS[status] ?? status;
}

export const MERCHANT_STATUS_STEPS = [
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "assigned", label: "Picked" },
  { key: "delivered", label: "Delivered" },
] as const;

export function getMerchantStepIndex(status: string): number {
  if (status === "placed") return -1;
  if (status === "out_for_delivery") return 3;
  const idx = MERCHANT_STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function buildSalesChartBuckets(
  orders: Array<{ total_paise: number; created_at: string; status: string }>,
  range: "today" | "week" | "month"
): Array<{ label: string; valuePaise: number; heightPct: number }> {
  const valid = orders.filter((o) => o.status !== "cancelled");

  if (range === "today") {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const slots = [
      { label: "6 AM", minH: 0, maxH: 9 },
      { label: "10 AM", minH: 9, maxH: 12 },
      { label: "12 PM", minH: 12, maxH: 15 },
      { label: "2 PM", minH: 15, maxH: 18 },
      { label: "6 PM", minH: 18, maxH: 21 },
      { label: "10 PM", minH: 21, maxH: 24 },
    ];
    const totals = slots.map((s) => ({ label: s.label, valuePaise: 0 }));
    for (const o of valid) {
      const iso = o.created_at.endsWith("Z")
        ? o.created_at
        : `${o.created_at}Z`;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      if (
        d.getFullYear() !== todayY ||
        d.getMonth() !== todayM ||
        d.getDate() !== todayD
      ) {
        continue;
      }
      const hr = d.getHours();
      const idx = slots.findIndex((s) => hr >= s.minH && hr < s.maxH);
      const target = idx >= 0 ? idx : 2;
      totals[target].valuePaise += Number(o.total_paise) || 0;
    }
    const maxVal = Math.max(1, ...totals.map((t) => t.valuePaise));
    return totals.map((t) => ({
      ...t,
      heightPct:
        t.valuePaise === 0
          ? 8
          : Math.max(14, Math.round((t.valuePaise / maxVal) * 100)),
    }));
  }

  const bucketCount = range === "week" ? 7 : 4;
  const labels =
    range === "week"
      ? ["D-6", "D-5", "D-4", "D-3", "D-2", "Yest", "Today"]
      : ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  const sums = Array.from({ length: bucketCount }, (_, i) => ({
    label: labels[i],
    valuePaise: 0,
  }));

  const now = Date.now();
  const windowDays = range === "week" ? 7 : 28;
  for (const o of valid) {
    const iso = o.created_at.endsWith("Z")
      ? o.created_at
      : `${o.created_at}Z`;
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) continue;
    const daysAgo = Math.max(0, Math.floor((now - ts) / 86400000));
    if (daysAgo >= windowDays) continue;
    const idx =
      range === "week"
        ? Math.min(6, Math.max(0, 6 - daysAgo))
        : Math.min(3, Math.max(0, 3 - Math.floor(daysAgo / 7)));
    sums[idx].valuePaise += Number(o.total_paise) || 0;
  }

  const maxVal = Math.max(1, ...sums.map((s) => s.valuePaise));
  return sums.map((s) => ({
    ...s,
    heightPct:
      s.valuePaise === 0
        ? 8
        : Math.max(14, Math.round((s.valuePaise / maxVal) * 100)),
  }));
}
