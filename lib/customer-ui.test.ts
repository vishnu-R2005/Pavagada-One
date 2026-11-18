import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCartTotals,
  formatRupees,
  getOrderTimelineIndex,
  matchQuickCategoryId,
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
