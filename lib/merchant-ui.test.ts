import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSalesChartBuckets,
  calculateAverageOrderValue,
  calculateMerchantEarnings,
  getMerchantOrderLabel,
  getMerchantStepIndex,
} from "./merchant-ui";

test("calculateMerchantEarnings computes 5% platform fee and net earnings accurately", () => {
  const result = calculateMerchantEarnings(29500);
  assert.equal(result.gross, 29500);
  assert.equal(result.platformFee, 1475);
  assert.equal(result.netEarnings, 28025);
});

test("calculateAverageOrderValue guards against zero orders", () => {
  assert.equal(calculateAverageOrderValue(345000, 14), 24643);
  assert.equal(calculateAverageOrderValue(345000, 0), 0);
});

test("getMerchantStepIndex maps order statuses to 5-step progress indicator", () => {
  assert.equal(getMerchantStepIndex("placed"), -1);
  assert.equal(getMerchantStepIndex("accepted"), 0);
  assert.equal(getMerchantStepIndex("preparing"), 1);
  assert.equal(getMerchantStepIndex("ready"), 2);
  assert.equal(getMerchantStepIndex("out_for_delivery"), 3);
  assert.equal(getMerchantStepIndex("delivered"), 4);
  assert.equal(getMerchantOrderLabel("placed"), "New");
});

test("buildSalesChartBuckets aggregates valid non-cancelled orders into slots", () => {
  const now = new Date().toISOString();
  const buckets = buildSalesChartBuckets(
    [
      { total_paise: 10000, created_at: now, status: "delivered" },
      { total_paise: 5000, created_at: now, status: "cancelled" },
    ],
    "week"
  );
  assert.equal(buckets.length, 7);
  assert.equal(buckets[6].valuePaise, 10000);
  assert.equal(buckets[6].heightPct, 100);

  const yesterday = new Date(Date.now() - 86400000 * 2).toISOString();
  const todayBuckets = buildSalesChartBuckets(
    [
      { total_paise: 25000, created_at: now, status: "placed" },
      { total_paise: 90000, created_at: yesterday, status: "delivered" },
    ],
    "today"
  );
  const sumToday = todayBuckets.reduce((acc, b) => acc + b.valuePaise, 0);
  assert.equal(sumToday, 25000);
});
