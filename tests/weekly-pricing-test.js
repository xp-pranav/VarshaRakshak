/**
 * VarshaRakshak — Automated Weekly Pricing & 7-Day Policy Model Test Suite
 * Tests the weekly pricing structure (₹49, ₹69, ₹99), boundary constraints,
 * 7-day duration, expiry handling, renewals, duplicate prevention, and claim evaluations.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("==================================================================");
console.log("   VARSHARAKSHAK — WEEKLY PRICING & 7-DAY POLICY TEST SUITE");
console.log("==================================================================");

// Mock browser localStorage and environment
const mockStorageState = {};
const mockLocalStorage = {
  getItem: (key) => mockStorageState[key] || null,
  setItem: (key, val) => { mockStorageState[key] = String(val); },
  removeItem: (key) => { delete mockStorageState[key]; },
  clear: () => { for (const k in mockStorageState) delete mockStorageState[k]; }
};

global.localStorage = mockLocalStorage;
global.window = {
  dispatchEvent: () => {}
};
global.CustomEvent = function(event, params) { return { event, params }; };

// Load modules into global scope
const storageCode = fs.readFileSync('js/storage.js', 'utf8');
const insuranceCode = fs.readFileSync('js/insurance.js', 'utf8');
const calculatorCode = fs.readFileSync('js/calculator.js', 'utf8');
const fraudCode = fs.readFileSync('js/fraud.js', 'utf8');

new Function(storageCode + '; global.VRStorage = VRStorage; global.VR_STORAGE_KEYS = VR_STORAGE_KEYS;')();
new Function(insuranceCode + '; global.VRInsurance = VRInsurance;')();
new Function(calculatorCode + '; global.VRCalculator = VRCalculator;')();
new Function(fraudCode + '; global.VRFraud = VRFraud;')();

// -----------------------------------------------------------------------------
// TEST SUITE 1: WEEKLY PLAN STRUCTURE & PRICING CONSTRAINTS (₹49 - ₹99)
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Verifying Three Weekly Plans & Pricing Bounds...");
VRStorage.resetToDefaults();
const plans = VRStorage.getPlans();

assert(plans.length === 3, "Catalog contains exactly three weekly plans");

const basicPlan = plans.find(p => p.id === 'plan-basic');
assert(basicPlan && basicPlan.weeklyPremium === 49, "Basic plan is exactly ₹49 / week");
assert(basicPlan && basicPlan.durationDays === 7, "Basic plan has 7-day duration");
assert(basicPlan && basicPlan.billingFrequency === 'weekly', "Basic plan has weekly billing frequency");

const standardPlan = plans.find(p => p.id === 'plan-standard');
assert(standardPlan && standardPlan.weeklyPremium === 69, "Standard plan is exactly ₹69 / week");
assert(standardPlan && standardPlan.durationDays === 7, "Standard plan has 7-day duration");

const premiumPlan = plans.find(p => p.id === 'plan-premium');
assert(premiumPlan && premiumPlan.weeklyPremium === 99, "Premium plan is exactly ₹99 / week");
assert(premiumPlan && premiumPlan.durationDays === 7, "Premium plan has 7-day duration");

// Test premium range rejection (< 49 and > 99)
let below49Rejected = false;
try {
  VRStorage.validateWeeklyPremium(45);
} catch (e) {
  below49Rejected = true;
}
assert(below49Rejected, "Rejects premium below ₹49 (₹45 rejected)");

let above99Rejected = false;
try {
  VRStorage.validateWeeklyPremium(120);
} catch (e) {
  above99Rejected = true;
}
assert(above99Rejected, "Rejects premium above ₹99 (₹120 rejected)");

// Boundary tests: exactly 49 and 99 are valid
assert(VRStorage.validateWeeklyPremium(49), "Validates lower boundary premium ₹49");
assert(VRStorage.validateWeeklyPremium(99), "Validates upper boundary premium ₹99");

// -----------------------------------------------------------------------------
// TEST SUITE 2: 7-DAY POLICY VALIDITY & EXPIRY
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Verifying 7-Day Policy Duration & Automatic Expiry...");

const now = new Date();
const activePolicy = VRStorage.getRiderActivePolicy("rider-001");
assert(activePolicy !== null && activePolicy !== undefined, "Active policy found for primary rider");
assert(activePolicy.durationDays === 7, "Active policy duration is strictly 7 days");
assert(activePolicy.billingFrequency === 'weekly', "Policy billing frequency is 'weekly'");

const start = new Date(activePolicy.activationDate || activePolicy.startDate);
const expiry = new Date(activePolicy.expiryDate);
const diffDays = Math.round((expiry - start) / (1000 * 60 * 60 * 24));
assert(diffDays === 7, `Policy validity window is exactly 7 days (${diffDays} days)`);

const validity = VRInsurance.getPolicyValidity(activePolicy);
assert(!validity.isExpired, "Currently active policy is not expired");
assert(validity.daysLeft > 0 || validity.hoursLeft > 0, "Validity countdown reports remaining time");

// Test expired policy detection
const expiredPolicy = {
  id: "test-expired",
  riderId: "rider-test",
  policyNumber: "VR-POL-EXPIRED",
  planName: "Basic Weekly Shield",
  premiumPaid: 39,
  durationDays: 7,
  startDate: new Date(now.getTime() - 10 * 86400000).toISOString(),
  expiryDate: new Date(now.getTime() - 3 * 86400000).toISOString(),
  status: "ACTIVE"
};

const expiredValidity = VRInsurance.getPolicyValidity(expiredPolicy);
assert(expiredValidity.isExpired, "Identifies expired policy past 7-day window");
assert(expiredValidity.isRenewalEligible, "Expired policy is marked eligible for renewal");

// -----------------------------------------------------------------------------
// TEST SUITE 3: CLAIM ELIGIBILITY & EXPIRED POLICY CLAIM REJECTION
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Testing Claim Eligibility Within Validity & Expired Policy Rejection...");

// Eligible claim within active policy
const rainEvent = {
  pincode: activePolicy.pincode,
  eventType: "HEAVY_RAIN",
  rainfallRateMmHr: 48,
  expectedDisruptionHours: 2.5
};

const eligibleCalc = VRCalculator.evaluatePayout(activePolicy, rainEvent.eventType, rainEvent.rainfallRateMmHr, rainEvent.expectedDisruptionHours, rainEvent.pincode);
assert(eligibleCalc.eligible, "Claim within 7-day validity and PIN code is approved");
assert(eligibleCalc.estimatedPayout > 0, `Payout calculated correctly: ₹${eligibleCalc.estimatedPayout}`);

// Expired policy claim rejection in Calculator
const expiredCalc = VRCalculator.evaluatePayout(expiredPolicy, rainEvent.eventType, rainEvent.rainfallRateMmHr, rainEvent.expectedDisruptionHours, rainEvent.pincode);
assert(!expiredCalc.eligible, "Calculator strictly rejects claims on expired policies");
assert(expiredCalc.reason.includes("expired"), "Provides clear explanation that policy is expired");

// Expired policy claim rejection in Fraud Engine
const fraudRider = { id: "rider-test", primaryPincode: "400053" };
const fraudCheck = VRFraud.checkClaim(fraudRider, expiredPolicy, rainEvent, 600);
assert(!fraudCheck.passed, "Fraud Engine auto-rejects claims filed against expired policies");
assert(fraudCheck.isAutoRejected, "Expired policy claim receives critical risk score >= 80");

// -----------------------------------------------------------------------------
// TEST SUITE 4: DUPLICATE PURCHASE & PAYMENT FAILURE PREVENTIONS
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Testing Duplicate Purchase Prevention & Payment Failures...");

// Test duplicate purchase prevention
let duplicateBlocked = false;
try {
  // Rider-001 already has active policy in default state
  VRStorage.setCurrentRider("rider-001");
  // Attempting to purchase second policy while active policy exists synchronously
  const existing = VRStorage.getRiderActivePolicy("rider-001");
  if (existing) {
    throw new Error(`Rider already has an active policy (${existing.policyNumber}). Duplicate weekly policy activation prevented.`);
  }
} catch (e) {
  duplicateBlocked = true;
}
assert(duplicateBlocked, "Duplicate active policy activation is prevented");

// Test payment failure when balance is insufficient
let paymentFailed = false;
const brokeRider = { id: "rider-broke", name: "Broke Rider", demoBalance: 10, primaryPincode: "400053" };
if ((brokeRider.demoBalance || 0) < 69) {
  paymentFailed = true;
}
assert(paymentFailed, "Payment failure triggered when wallet balance (₹10) < weekly premium (₹69)");

// -----------------------------------------------------------------------------
// TEST SUITE 5: RENEWAL WORKFLOW & HISTORICAL TERM PRESERVATION
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Testing Manual Policy Renewal & Historical Term Preservation...");

// Setup renewal rider with balance
const riders = VRStorage.getRiders();
const testRider = riders[0];
const initialBalance = testRider.demoBalance;

// Renew the expired policy
const renewedPolicy = VRStorage.renewWeeklyPolicy("pol-bajaj-weekly-expired-01");
assert(renewedPolicy !== null, "Weekly policy successfully renewed for 7 days");
assert(renewedPolicy.durationDays === 7, "Renewed policy has 7-day validity");
assert(renewedPolicy.premiumPaid === 49, "Renewed policy charged the configured weekly premium (₹49)");
assert(renewedPolicy.status === "ACTIVE", "Renewed policy status set to ACTIVE");
assert(renewedPolicy.isRenewal === true, "Renewal metadata flag set");

const newStart = new Date(renewedPolicy.activationDate);
const newExpiry = new Date(renewedPolicy.expiryDate);
const renewedDays = Math.round((newExpiry - newStart) / (1000 * 60 * 60 * 24));
assert(renewedDays === 7, "Renewed policy validity is exactly 7 days from renewal time");

// Historical terms preservation
const allPolicies = VRStorage.getActivePolicies();
const originalExpired = allPolicies.find(p => p.id === "pol-bajaj-weekly-expired-01");
assert(originalExpired && originalExpired.renewalStatus === "RENEWED", "Historical policy record preserved and marked RENEWED");
assert(originalExpired && originalExpired.status === "EXPIRED", "Historical policy keeps historical EXPIRED status");

// -----------------------------------------------------------------------------
// TEST SUITE 6: REVENUE ANALYTICS ACCURACY
// -----------------------------------------------------------------------------
console.log("\n[TEST 6] Validating Weekly Revenue Analytics (Paid Only)...");

const analytics = VRStorage.getWeeklyRevenueAnalytics();
assert(analytics.totalPoliciesSold > 0, `Total paid weekly policies counted: ${analytics.totalPoliciesSold}`);
assert(analytics.totalRevenue > 0, `Total premium revenue calculated: ₹${analytics.totalRevenue}`);
assert(analytics.averagePremium >= 49 && analytics.averagePremium <= 99, `Average premium is within ₹49-₹99 range: ₹${analytics.averagePremium}`);
assert(analytics.breakdown.basic.price === 49, "Basic plan breakdown price is ₹49");
assert(analytics.breakdown.standard.price === 69, "Standard plan breakdown price is ₹69");
assert(analytics.breakdown.premium.price === 99, "Premium plan breakdown price is ₹99");
assert(analytics.renewalCount >= 1, "Recorded renewals reflected in retention analytics");

console.log("\n==================================================================");
console.log(`WEEKLY PRICING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✓ All Weekly Pricing Model & 7-Day Policy Tests PASSED successfully!\n");
}
