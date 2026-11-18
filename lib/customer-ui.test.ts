import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCartTotals,
  evaluateCouponDiscount,
  formatRupees,
  getOrderTimelineIndex,
  matchQuickCategoryId,
  parseUtcDate,
} from "./customer-ui";

test("formatRupees formats paise into whole INR strings", () => {
  assert.equal(formatRupees(24500), "₹245");
  assert.equal(formatRupees(0), "₹0");
});

test("calculateCartTotals applies delivery fee below threshold and waives above 500 INR", () => {
  const small = calculateCartTotals([{ price_paise: 24500, quantity: 1 }]);
  assert.equal(small.subtotal, 24500);
  assert.equal(small.deliveryFee, 3000);
  assert.equal(small.total, 27500);
  assert.equal(small.remainingForFreeDelivery, 25500);

  const free = calculateCartTotals([{ price_paise: 28500, quantity: 2 }]);
  assert.equal(free.subtotal, 57000);
  assert.equal(free.deliveryFee, 0);
  assert.equal(free.total, 57000);
  assert.equal(free.remainingForFreeDelivery, 0);
});

test("calculateCartTotals honors custom platform settings and coupon discount", () => {
  const custom = calculateCartTotals(
    [{ price_paise: 24500, quantity: 1 }],
    5000,
    { deliveryFeePaise: 2000, freeDeliveryThresholdPaise: 30000 }
  );
  assert.equal(custom.subtotal, 24500);
  assert.equal(custom.discount, 5000);
  assert.equal(custom.deliveryFee, 2000);
  assert.equal(custom.total, 21500);
  assert.equal(custom.remainingForFreeDelivery, 5500);
});

test("evaluateCouponDiscount calculates flat and percent discounts safely", () => {
  assert.equal(
    evaluateCouponDiscount(24500, { discount_type: "flat", discount_value: 5000 }),
    5000
  );
  assert.equal(
    evaluateCouponDiscount(3000, { discount_type: "flat", discount_value: 5000 }),
    3000
  );
  assert.equal(
    evaluateCouponDiscount(20000, { discount_type: "percent", discount_value: 15 }),
    3000
  );
});

test("parseUtcDate parses SQLite CURRENT_TIMESTAMP strings as UTC", () => {
  const d = parseUtcDate("2026-11-17 10:15:00");
  assert.ok(d);
  assert.equal(d.toISOString(), "2026-11-17T10:15:00.000Z");
  assert.equal(parseUtcDate(""), null);
});

test("getOrderTimelineIndex resolves order progress indices safely", () => {
  assert.equal(getOrderTimelineIndex("placed"), 0);
  assert.equal(getOrderTimelineIndex("out_for_delivery"), 5);
  assert.equal(getOrderTimelineIndex("delivered"), 6);
  assert.equal(getOrderTimelineIndex("unknown"), 0);
});

test("matchQuickCategoryId finds matching catalog category IDs", () => {
  const cats = [
    { id: "cat-1", name: "Groceries" },
    { id: "cat-2", name: "Fresh Produce" },
    { id: "cat-3", name: "Dairy & Eggs" },
  ];
  assert.equal(matchQuickCategoryId(["milk", "dairy"], cats), "cat-3");
  assert.equal(matchQuickCategoryId(["fruit", "produce"], cats), "cat-2");
  assert.equal(matchQuickCategoryId(["pharmacy"], cats), "");
});
