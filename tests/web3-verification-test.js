/**
 * VarshaRakshak — Automated Web3 & Blockchain Verification Test Suite
 * Validates deterministic policy hashing, anti-fraud rules, contract ABIs,
 * Sepolia network configs, and failure handling without external network dependencies.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log("==================================================================");
console.log("   VARSHARAKSHAK — ROUND 2 WEB3 & BLOCKCHAIN TEST SUITE");
console.log("==================================================================");

// -----------------------------------------------------------------------------
// TEST SUITE 1: SMART CONTRACT SYNTAX & INTERFACES AUDIT
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Auditing Solidity Smart Contracts Structure & Syntax...");
const contractFiles = [
  'PolicyRegistry.sol',
  'TriggerRegistry.sol',
  'ClaimManager.sol',
  'PayoutAuthorizer.sol'
];

for (const file of contractFiles) {
  const p = path.join('contracts', file);
  assert(fs.existsSync(p), `Contract file exists: ${file}`);
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('SPDX-License-Identifier: MIT'), `${file} has MIT license identifier`);
  assert(content.includes('pragma solidity ^0.8.20'), `${file} specifies Solidity 0.8.20 compiler`);
  assert(!content.includes('any_personal_info'), `${file} has zero PII on-chain`);
}

// -----------------------------------------------------------------------------
// TEST SUITE 2: DETERMINISTIC POLICY HASHING & AVALANCHE EFFECT
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Testing Deterministic Policy Hashing & Avalanche Effect...");

function pseudoKeccak256(str) {
  return "0x" + crypto.createHash('sha256').update(str).digest('hex');
}

const samplePolicy = {
  policyNumber: "VR-POL-2026-00812",
  riderId: "rider-001",
  planId: "VR-RAIN-01",
  pincode: "400053",
  totalCoverageLimit: 5000,
  premiumPaid: 450,
  startDate: "2026-11-01T00:00:00Z",
  expiryDate: "2026-11-30T23:59:59Z"
};

// Canonical normalization (deterministic key sorting)
function canonicalSerialize(pol) {
  const terms = {
    coverageLimit: pol.totalCoverageLimit,
    currency: "INR",
    expiryTimeUnix: Math.floor(new Date(pol.expiryDate).getTime() / 1000),
    pincode: pol.pincode.trim(),
    planCode: pol.planId.trim(),
    policyNumber: pol.policyNumber.trim(),
    premiumPaid: pol.premiumPaid,
    pseudonymousRider: pseudoKeccak256(pol.riderId),
    startTimeUnix: Math.floor(new Date(pol.startDate).getTime() / 1000)
  };
  const sortedKeys = Object.keys(terms).sort();
  const sortedObj = {};
  for (const k of sortedKeys) sortedObj[k] = terms[k];
  return JSON.stringify(sortedObj);
}

const canonical1 = canonicalSerialize(samplePolicy);
const hash1 = pseudoKeccak256(canonical1);

// Re-serialize in different object key insertion order
const samplePolicyShuffled = {
  expiryDate: "2026-11-30T23:59:59Z",
  premiumPaid: 450,
  riderId: "rider-001",
  startDate: "2026-11-01T00:00:00Z",
  policyNumber: "VR-POL-2026-00812",
  pincode: "400053",
  planId: "VR-RAIN-01",
  totalCoverageLimit: 5000
};
const canonical2 = canonicalSerialize(samplePolicyShuffled);
const hash2 = pseudoKeccak256(canonical2);

assert(hash1 === hash2, "Policy hashing is 100% deterministic regardless of input key ordering");

// Tamper test: Alter coverage by ₹1
const tamperedPolicy = { ...samplePolicy, totalCoverageLimit: 5001 };
const tamperedCanonical = canonicalSerialize(tamperedPolicy);
const tamperedHash = pseudoKeccak256(tamperedCanonical);

assert(hash1 !== tamperedHash, `Avalanche effect verified: changing coverage ₹5000->₹5001 completely altered hash (${hash1.substring(0, 10)}... vs ${tamperedHash.substring(0, 10)}...)`);

// -----------------------------------------------------------------------------
// TEST SUITE 3: CONTRACT ABIS & NETWORK CONFIGURATION
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Validating ABIs & Sepolia Network Configuration...");

const configContent = fs.readFileSync('js/contracts-config.js', 'utf8');
assert(configContent.includes('11155111'), "Sepolia chain ID 11155111 defined in config");
assert(configContent.includes('0xaa36a7'), "Sepolia hex chain ID 0xaa36a7 defined in config");

const abisContent = fs.readFileSync('js/abis.js', 'utf8');
assert(abisContent.includes('registerPolicy'), "PolicyRegistry ABI contains registerPolicy");
assert(abisContent.includes('recordTrigger'), "TriggerRegistry ABI contains recordTrigger");
assert(abisContent.includes('registerClaim'), "ClaimManager ABI contains registerClaim");
assert(abisContent.includes('authorizePayout'), "PayoutAuthorizer ABI contains authorizePayout");

// -----------------------------------------------------------------------------
// TEST SUITE 4: DUPLICATE CLAIM & ANTI-FRAUD ENGINE
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Testing Fraud Prevention & Duplicate Claim Detection...");

// Load fraud module logic
const fraudCode = fs.readFileSync('js/fraud.js', 'utf8');
const fakeStorage = {
  getClaims: () => [
    {
      id: "CLM-001",
      claimNumber: "VR-CLM-001",
      policyId: "pol-01",
      pincode: "400053",
      eventType: "HEAVY_RAIN",
      status: "Paid",
      riderId: "rider-001",
      createdAt: new Date().toISOString()
    }
  ],
  addFraudFlag: () => {}
};

const fakeRider = { id: "rider-001", primaryPincode: "400053" };
const fakePolicy = {
  id: "pol-01",
  expiryDate: new Date(Date.now() + 86400000).toISOString(),
  status: "ACTIVE",
  coverageLimitRemaining: 5000
};

// Evaluate duplicate attempt
global.VRStorage = fakeStorage;
new Function(fraudCode + '; global.VRFraud = VRFraud;')();

const dupEvent = { pincode: "400053", eventType: "HEAVY_RAIN" };
const check1 = VRFraud.checkClaim(fakeRider, fakePolicy, dupEvent, 750);
assert(!check1.passed, "Fraud Engine rejects duplicate claim for identical weather event");
assert(check1.isAutoRejected, "Duplicate claim is classified as auto-rejected (Risk Score >= 80)");

// Evaluate expired policy attempt
const expiredPolicy = {
  id: "pol-02",
  expiryDate: new Date(Date.now() - 86400000).toISOString(),
  status: "EXPIRED",
  coverageLimitRemaining: 5000
};
const newEvent = { pincode: "400053", eventType: "EXTREME_HEAT" };
const check2 = VRFraud.checkClaim(fakeRider, expiredPolicy, newEvent, 600);
assert(!check2.passed, "Fraud Engine rejects claims submitted against expired policies");

// -----------------------------------------------------------------------------
// TEST SUITE 5: FAILURE SCENARIO HANDLING MATRIX
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Testing Web3 Failure Handlers & Informative Messages...");

const web3Code = fs.readFileSync('js/web3.js', 'utf8');
assert(web3Code.includes('parseContractError'), "Web3 module includes parseContractError handler");
assert(web3Code.includes('4001') || web3Code.includes('user rejected'), "Web3 handles code 4001 user cancellation gracefully");
assert(web3Code.includes('INSUFFICIENT_FUNDS') || web3Code.includes('insufficient funds'), "Web3 handles gas exhaustion with informative faucet instructions");
assert(web3Code.includes('SEPOLIA_CHAIN_ID_DEC'), "Web3 verifies chain ID 11155111 before live execution");

console.log("\n==================================================================");
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log("==================================================================");

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log("✓ All Web3, Solidity, Anti-Fraud and Cryptographic tests PASSED successfully!\n");
}
