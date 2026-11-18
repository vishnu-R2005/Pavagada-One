export const DELIVERY_FEE_PAISE = 3000;
export const FREE_DELIVERY_THRESHOLD_PAISE = 50000;

export function formatRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((Number(paise) || 0) / 100);
}

export function calculateCartTotals(
  items: Array<{ price_paise: number; quantity: number }>,
  discountPaise = 0,
  settings?: {
    deliveryFeePaise?: number;
    freeDeliveryThresholdPaise?: number;
  }
) {
  const feePaise =
    settings?.deliveryFeePaise !== undefined &&
    Number.isFinite(Number(settings.deliveryFeePaise))
      ? Math.max(0, Number(settings.deliveryFeePaise))
      : DELIVERY_FEE_PAISE;
  const freeThreshold =
    settings?.freeDeliveryThresholdPaise !== undefined &&
    Number.isFinite(Number(settings.freeDeliveryThresholdPaise))
      ? Math.max(0, Number(settings.freeDeliveryThresholdPaise))
      : FREE_DELIVERY_THRESHOLD_PAISE;

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price_paise || 0) * Number(item.quantity || 0),
    0
  );
  const deliveryFee =
    subtotal === 0 ? 0 : subtotal >= freeThreshold ? 0 : feePaise;
  const clampedDiscount = Math.min(Math.max(0, discountPaise), subtotal);
  const total = Math.max(0, subtotal - clampedDiscount) + deliveryFee;
  const remainingForFreeDelivery = Math.max(0, freeThreshold - subtotal);
  return {
    subtotal,
    deliveryFee,
    discount: clampedDiscount,
    total,
    remainingForFreeDelivery,
  };
}

export function evaluateCouponDiscount(
  subtotalPaise: number,
  coupon: { discount_type: string; discount_value: number } | null | undefined
): number {
  const sub = Math.max(0, Number(subtotalPaise) || 0);
  if (!coupon || sub === 0) return 0;
  const val = Math.max(0, Number(coupon.discount_value) || 0);
  const raw =
    coupon.discount_type === "percent"
      ? Math.round((sub * val) / 100)
      : val;
  return Math.min(raw, sub);
}

export function parseUtcDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const hasZone = trimmed.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed);
  const iso = hasZone ? trimmed : `${trimmed.replace(" ", "T")}Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatUtcDateTime(
  raw?: string | null,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  const parsed = parseUtcDate(raw);
  if (!parsed) return "";
  return parsed.toLocaleString("en-IN", options);
}

export const ORDER_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "accepted", label: "Confirmed by Shop" },
  { key: "preparing", label: "Preparing Items" },
  { key: "ready", label: "Ready for Pickup" },
  { key: "assigned", label: "Rider Assigned" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export function getOrderTimelineIndex(status: string): number {
  const idx = ORDER_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function matchQuickCategoryId(
  quickKeywords: string[],
  categories: Array<{ id: string; name: string }>
): string {
  if (!quickKeywords.length || !categories.length) return "";
  for (const cat of categories) {
    const lower = cat.name.toLowerCase();
    if (quickKeywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return cat.id;
    }
  }
  return "";
}
