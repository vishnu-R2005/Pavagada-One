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
  discountPaise = 0
) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price_paise || 0) * Number(item.quantity || 0),
    0
  );
  const deliveryFee =
    subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD_PAISE ? 0 : DELIVERY_FEE_PAISE;
  const clampedDiscount = Math.min(Math.max(0, discountPaise), subtotal);
  const total = Math.max(0, subtotal - clampedDiscount) + deliveryFee;
  const remainingForFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD_PAISE - subtotal
  );
  return {
    subtotal,
    deliveryFee,
    discount: clampedDiscount,
    total,
    remainingForFreeDelivery,
  };
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
