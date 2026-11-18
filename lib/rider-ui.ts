export const RIDER_STEPS = ["Accepted", "Pickup", "On the Way", "Delivered"] as const;

export function formatRupees(paise: number): string {
  const rupees = Math.round((Number(paise) || 0) / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function getRiderStepIndex(
  assignmentStatus?: string | null,
  orderStatus?: string | null
): number {
  const a = String(assignmentStatus || "").toLowerCase();
  const o = String(orderStatus || "").toLowerCase();
  if (a === "delivered" || o === "delivered") return 3;
  if (a === "picked_up" || o === "out_for_delivery") return 2;
  if (a === "assigned" || o === "assigned") return 1;
  return 0;
}

export function calculateRiderIncentive(deliveriesToday: number): {
  completed: number;
  target: number;
  bonusPaise: number;
  unlockedPaise: number;
  progressPercent: number;
} {
  const completed = Math.max(0, Math.floor(Number(deliveriesToday) || 0));
  const target = 10;
  const bonusPaise = 10000; // ₹100 daily milestone bonus
  const unlockedPaise = completed >= target ? bonusPaise : completed >= 5 ? 5000 : 0;
  const progressPercent = Math.min(100, Math.round((completed / target) * 100));
  return {
    completed,
    target,
    bonusPaise,
    unlockedPaise,
    progressPercent,
  };
}

export function calculateCompletionRate(
  deliveredCount: number,
  cancelledCount: number
): number {
  const done = Math.max(0, Number(deliveredCount) || 0);
  const cancelled = Math.max(0, Number(cancelledCount) || 0);
  const total = done + cancelled;
  if (total === 0) return 100;
  return Math.round((done / total) * 100);
}

export function calculateRiderEarningsSummary(params: {
  deliveries: number;
  deliveryFeesPaise: number;
  codCollectedPaise?: number;
  includeDailyIncentive?: boolean;
}) {
  const deliveries = Math.max(0, Math.floor(Number(params.deliveries) || 0));
  const deliveryFeesPaise = Math.max(0, Math.round(Number(params.deliveryFeesPaise) || 0));
  const incentive = params.includeDailyIncentive
    ? calculateRiderIncentive(deliveries).unlockedPaise
    : 0;
  const avgPerDeliveryPaise = deliveries > 0 ? Math.round(deliveryFeesPaise / deliveries) : 0;
  const totalEarningsPaise = deliveryFeesPaise + incentive;
  return {
    deliveries,
    deliveryFeesPaise,
    incentivePaise: incentive,
    avgPerDeliveryPaise,
    totalEarningsPaise,
    codCollectedPaise: Math.max(0, Math.round(Number(params.codCollectedPaise) || 0)),
  };
}

export function estimateRouteEta(shopAddress: string, customerAddress: string): {
  distanceLabel: string;
  etaLabel: string;
} {
  const combined = `${shopAddress} ${customerAddress}`.toLowerCase();
  if (combined.includes("hirehalli") || combined.includes("nellikaiyanahatti")) {
    return { distanceLabel: "4.2 km", etaLabel: "16 mins" };
  }
  if (combined.includes("kudligi") || combined.includes("bus stand")) {
    return { distanceLabel: "2.4 km", etaLabel: "10 mins" };
  }
  return { distanceLabel: "1.8 km", etaLabel: "8 mins" };
}

export function formatRiderTimeAgo(value: string): string {
  const normalized = value.includes("T") || value.endsWith("Z") ? value : `${value.replace(" ", "T")}Z`;
  const ms = new Date(normalized).getTime();
  if (!Number.isFinite(ms)) return "Just now";
  const diffMin = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
  return `${Math.round(diffMin / 1440)}d ago`;
}
