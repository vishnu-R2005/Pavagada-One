import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCompletionRate,
  calculateRiderEarningsSummary,
  calculateRiderIncentive,
  estimateRouteEta,
  formatRupees,
  getRiderStepIndex,
} from "./rider-ui";

test("formatRupees formats paise into whole INR strings", () => {
  assert.equal(formatRupees(4500), "₹45");
  assert.equal(formatRupees(82000), "₹820");
  assert.equal(formatRupees(0), "₹0");
});

test("getRiderStepIndex maps assignment and order statuses to 4-step tracker", () => {
  assert.equal(getRiderStepIndex(null, "ready"), 0);
  assert.equal(getRiderStepIndex("assigned", "assigned"), 1);
  assert.equal(getRiderStepIndex("picked_up", "out_for_delivery"), 2);
  assert.equal(getRiderStepIndex("delivered", "delivered"), 3);
});

test("calculateRiderIncentive computes daily milestone tiers accurately", () => {
  const tier0 = calculateRiderIncentive(3);
  assert.equal(tier0.unlockedPaise, 0);
  assert.equal(tier0.progressPercent, 30);

  const tier5 = calculateRiderIncentive(5);
  assert.equal(tier5.unlockedPaise, 5000);
  assert.equal(tier5.progressPercent, 50);

  const tier10 = calculateRiderIncentive(10);
  assert.equal(tier10.unlockedPaise, 10000);
  assert.equal(tier10.progressPercent, 100);
});

test("calculateCompletionRate guards against zero denominator", () => {
  assert.equal(calculateCompletionRate(0, 0), 100);
  assert.equal(calculateCompletionRate(9, 1), 90);
});

test("calculateRiderEarningsSummary computes total, avg, and incentive", () => {
  const s = calculateRiderEarningsSummary({
    deliveries: 10,
    deliveryFeesPaise: 45000,
    codCollectedPaise: 120000,
    includeDailyIncentive: true,
  });
  assert.equal(s.avgPerDeliveryPaise, 4500);
  assert.equal(s.incentivePaise, 10000);
  assert.equal(s.totalEarningsPaise, 55000);

  const zero = calculateRiderEarningsSummary({
    deliveries: 0,
    deliveryFeesPaise: 0,
    includeDailyIncentive: true,
  });
  assert.equal(zero.avgPerDeliveryPaise, 0);
  assert.equal(zero.totalEarningsPaise, 0);
});

test("estimateRouteEta resolves Pavagada zones deterministically", () => {
  assert.equal(estimateRouteEta("Main Road, Pavagada", "Hirehalli").etaLabel, "16 mins");
  assert.equal(estimateRouteEta("Main Road, Pavagada", "Temple Street, Pavagada").etaLabel, "8 mins");
});
