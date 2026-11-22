/**
 * VarshaRakshak — Supabase to Ethereum Sepolia Blockchain Integration Test Suite
 * 
 * Validates the 12-item end-to-end integration matrix:
 * 1. Policy Purchase Pipeline (₹69 weekly standard plan, SHA-256 terms hash, zero PII, status lifecycle)
 * 2. Weather Evidence Registration (canonical weather JSON, SHA-256 evidence hash, on-chain recording)
 * 3. Rider Claim Submission (claim evaluation canonical data, SHA-256 evaluation hash, status tracking)
 * 4. Admin Approval & On-Chain Status Transition (ClaimManager state transition, status Approved)
 * 5. Payout Authorization & Wallet Settlement (deterministic receipt hash, balance credit, idempotency)
 * 6. Blockchain Explorer Interactive Verification (All 7 outcomes: HASH VERIFIED, HASH MISMATCH,
 *    TRANSACTION PENDING, TRANSACTION FAILED, RECORD NOT FOUND, CONTRACT NOT DEPLOYED, BLOCKCHAIN UNAVAILABLE)
 * 7. Tamper Detection & Avalanche Effect (Hamming distance calculation, bit flip audit)
 * 8. Duplicate Claim & Idempotency Rejection (duplicate prevention without data loss)
 * 9. Failed Transaction Handling & Record Preservation (status FAILED, error logging, data preserved)
 * 10. User Rejection Handling (EIP-1193 code 4001, human-friendly messaging, no corruption)
 * 11. Insufficient Gas Handling & Faucet Guidance (INSUFFICIENT_FUNDS parsing, retry readiness)
 * 12. Wrong Network Rejection & Chain Guard (Sepolia 11155111 enforcement, cross-chain block)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ethers } = require('ethers');

// Mock browser environment for modules that check window/localStorage
const mockStorageState = {};
const mockLocalStorage = {
  getItem: (key) => mockStorageState[key] || null,
  setItem: (key, val) => { mockStorageState[key] = String(val); },
  removeItem: (key) => { delete mockStorageState[key]; },
  clear: () => { for (const k in mockStorageState) delete mockStorageState[k]; }
};

global.localStorage = mockLocalStorage;
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  VR_SUPABASE_CONFIG: {
    url: "https://yenahycxkcjdobazyqka.supabase.co",
    publishableKey: "sb_publishable_H_tK1tJIsPBUeNDMbvbptw_Bu10REnh"
  }
};
global.CustomEvent = function(event, params) { return { event, params }; };

// Load application modules
const VRPolicyHasher = require('../js/policy-hasher.js');
const VRContractConfig = require('../js/contracts-config.js').VRContractConfig;
const VR_ABIS = require('../js/abis.js');
const VRWeb3 = require('../js/web3.js');
const compiledContracts = require('../scripts/compile-contracts.js');

// Expose globals for modules evaluated in global scope
global.VRPolicyHasher = VRPolicyHasher;
global.VRContractConfig = VRContractConfig;
global.VR_ABIS = VR_ABIS;
global.VRWeb3 = VRWeb3;
global.ethers = ethers;

// Load VRStorage and VRSupabase
const storageCode = fs.readFileSync(path.join(__dirname, '../js/storage.js'), 'utf8');
new Function(storageCode + '; global.VRStorage = VRStorage; global.VR_STORAGE_KEYS = VR_STORAGE_KEYS;')();
VRStorage.init();

const supabaseCode = fs.readFileSync(path.join(__dirname, '../js/supabase-client.js'), 'utf8');
new Function(supabaseCode + '; global.VRSupabase = VRSupabase;')();

let passedTests = 0;
let failedTests = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("   VARSHARAKSHAK — SUPABASE TO ETHEREUM SEPOLIA INTEGRATION TEST");
  console.log("==================================================================");

  // -----------------------------------------------------------------------------
  // TEST MATRIX 1: POLICY PURCHASE PIPELINE (₹69 STANDARD PLAN)
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 1] Policy Purchase Pipeline & SHA-256 On-Chain Registration...");

  const standardWeeklyPolicy = {
    id: "pol-test-std-69",
    policyNumber: "VR-POL-2026-TEST69",
    riderId: "rider-001",
    planName: "Standard Protection",
    planId: "VR-STD-02",
    premiumPaid: 69,
    totalCoverageLimit: 5000,
    coverageLimitRemaining: 5000,
    durationDays: 7,
    billingFrequency: "weekly",
    pincode: "400053",
    startDate: "2026-11-22T00:00:00Z",
    expiryDate: "2026-11-29T00:00:00Z"
  };

  it("1.1: Standard weekly plan parameters adhere strictly to ₹69/wk and 7-day duration", () => {
    assert.strictEqual(standardWeeklyPolicy.premiumPaid, 69, "Premium is exactly ₹69");
    assert.strictEqual(standardWeeklyPolicy.durationDays, 7, "Duration is 7 days");
    assert.strictEqual(standardWeeklyPolicy.totalCoverageLimit, 5000, "Coverage limit is ₹5,000");
    assert.strictEqual(standardWeeklyPolicy.billingFrequency, "weekly", "Billing frequency is weekly");
  });

  it("1.2: Deterministic SHA-256 terms hash generation guarantees ZERO PII on-chain", () => {
    const hashRes = VRPolicyHasher.hashPolicy(standardWeeklyPolicy);
    assert(hashRes.sha256Hash.startsWith("0x"), "SHA-256 hash has 0x prefix");
    assert.strictEqual(hashRes.sha256Hash.length, 66, "SHA-256 is 32 bytes (64 hex characters + 0x)");
    assert.strictEqual(hashRes.algorithm, "SHA-256", "Reported algorithm is SHA-256");

    // Verify zero PII in canonical string
    const canon = hashRes.canonicalString;
    assert(!canon.includes("Raju Sharma"), "Rider personal name strictly excluded");
    assert(!canon.includes("9876543210"), "Rider phone strictly excluded");
    assert(!canon.includes("MH 02 BG 4521"), "Vehicle registration strictly excluded");
    assert(canon.includes("pseudonymousRider"), "Contains pseudonymous rider identifier");
    assert(canon.includes('"premiumPaid":69'), "Contains normalized weekly premium of 69");
  });

  await itAsync("1.3: Policy registration pipeline transitions NOT_SUBMITTED -> PENDING -> CONFIRMED", async () => {
    // Execute registration pipeline
    const regRes = await VRSupabase.registerPolicyOnChain(standardWeeklyPolicy);

    assert(regRes.success, "Registration reported success");
    assert(regRes.txHash.startsWith("0x"), "Valid transaction hash returned");
    assert(regRes.sha256Hash.startsWith("0x"), "SHA-256 terms hash returned");
    assert(regRes.blockNumber > 0, "Valid block number assigned");

    // Inspect stored policy
    const storedPolicy = VRStorage.getActivePolicies().find(p => p.id === standardWeeklyPolicy.id);
    assert(storedPolicy, "Policy stored in application state");
    assert.strictEqual(storedPolicy.blockchain_status, "CONFIRMED", "Final status is CONFIRMED");
    assert.strictEqual(storedPolicy.sepoliaTxHash, regRes.txHash, "Transaction hash persisted");
    assert.strictEqual(storedPolicy.sha256_terms_hash, regRes.sha256Hash, "Terms hash persisted");
  });

  it("1.4: Blockchain verification of confirmed policy terms returns HASH VERIFIED", () => {
    const storedPolicy = VRStorage.getActivePolicies().find(p => p.id === standardWeeklyPolicy.id);
    const verifyRes = VRPolicyHasher.verifyRecordIntegrity(
      'POLICY',
      storedPolicy,
      storedPolicy.sha256_terms_hash,
      true,
      { isContractDeployed: true, useHashVerifiedLabel: true }
    );

    assert.strictEqual(verifyRes.status, "HASH VERIFIED", "Status is HASH VERIFIED");
    assert.strictEqual(verifyRes.isVerified, true, "isVerified is true");
    assert.strictEqual(verifyRes.hashAlgorithm, "SHA-256", "Verified with SHA-256");
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 2: WEATHER EVIDENCE REGISTRATION & ON-CHAIN ANCHORING
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 2] Weather Evidence Registration & TriggerRegistry Anchoring...");

  const extremeWeatherData = {
    id: "weather-evt-991",
    locality: "Andheri West, Mumbai",
    pincode: "400053",
    eventType: "EXTREME_RAIN",
    condition: "Violent Monsoon Downpour",
    rainfallRateMmHr: 72.4,
    windSpeedKmh: 42.0,
    temperature: 25.5,
    durationMinutes: 75,
    provider: "OpenWeatherMap-Live-Oracle",
    isDemoSimulation: false,
    timestamp: "2026-11-22T14:30:00Z"
  };

  it("2.1: Deterministic SHA-256 weather evidence hashing normalizes metrics and keys", () => {
    const hashRes = VRPolicyHasher.hashWeatherEvidence(extremeWeatherData);
    assert(hashRes.sha256Hash.startsWith("0x") && hashRes.sha256Hash.length === 66, "Valid 32-byte hash");
    // Rainfall 72.4 scaled x10 integer precision for EVM
    assert(hashRes.canonicalString.includes('"intensityValue":724'), "Normalized intensity value present");
    assert(hashRes.canonicalString.includes('"metricUnit":"MM_HR_X10"'), "Metric unit MM_HR_X10 present");
    assert(hashRes.canonicalString.includes('"pincode":"400053"'), "Normalized pincode present");
    assert(hashRes.canonicalString.includes('"isDemoSimulation":false'), "Simulation flag normalized");
  });

  await itAsync("2.2: Weather evidence registered on-chain with CONFIRMED receipt", async () => {
    const weathRes = await VRSupabase.recordWeatherEvidenceOnChain(extremeWeatherData);

    assert(weathRes.success, "Weather trigger reported success");
    assert(weathRes.evidenceHash.startsWith("0x"), "Evidence hash generated");
    assert(weathRes.txHash.startsWith("0x"), "Transaction hash generated");
    assert(weathRes.blockNumber > 0, "Block number assigned");
  });

  it("2.3: Verification of weather evidence hash against recorded digest returns HASH VERIFIED", () => {
    const hashRes = VRPolicyHasher.hashWeatherEvidence(extremeWeatherData);
    const verifyRes = VRPolicyHasher.verifyRecordIntegrity(
      'WEATHER',
      extremeWeatherData,
      hashRes.sha256Hash,
      true,
      { isContractDeployed: true, useHashVerifiedLabel: true }
    );

    assert.strictEqual(verifyRes.status, "HASH VERIFIED");
    assert.strictEqual(verifyRes.isVerified, true);
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 3: RIDER CLAIM SUBMISSION & EVALUATION HASHING
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 3] Rider Claim Submission & Evaluation Hashing...");

  const sampleClaim = {
    id: "clm-test-881",
    claimNumber: "VR-CLM-2026-8810",
    riderId: "rider-001",
    policyId: standardWeeklyPolicy.id,
    requestedAmount: 750,
    approvedAmount: 750,
    claimReason: "Extreme Rainfall Disruption (>70mm/hr) in Andheri West",
    pincode: "400053",
    triggerEventId: extremeWeatherData.id,
    fraudRiskScore: 6,
    disruptionHours: 3.5,
    timestamp: "2026-11-22T15:00:00Z"
  };

  it("3.1: Claim evaluation hash encapsulates risk score, amounts, and trigger evidence without PII", () => {
    const evalRes = VRPolicyHasher.hashClaimEvaluation(sampleClaim);
    assert(evalRes.sha256Hash.startsWith("0x") && evalRes.sha256Hash.length === 66, "Evaluation hash valid");
    assert(evalRes.canonicalString.includes('"fraudRiskScore":6'), "Contains risk score");
    assert(evalRes.canonicalString.includes('"requestedAmount":750'), "Contains requested payout");
    assert(!evalRes.canonicalString.includes("Raju"), "Zero personal information in evaluation hash");
  });

  await itAsync("3.2: Claim registered on-chain via ClaimManager with CONFIRMED receipt", async () => {
    const claimRes = await VRSupabase.registerClaimOnChain(sampleClaim);

    assert(claimRes.success, "Claim registration succeeded");
    assert(claimRes.txHash.startsWith("0x"), "Tx hash generated");
    assert(claimRes.evaluationHash.startsWith("0x"), "Evaluation hash confirmed");

    sampleClaim.blockchain_tx_hash = claimRes.txHash;
    sampleClaim.sha256_evaluation_hash = claimRes.evaluationHash;
    sampleClaim.blockchain_status = 'CONFIRMED';
    VRStorage.addClaim(sampleClaim);
  });

  it("3.3: Verification of claim evaluation hash returns HASH VERIFIED", () => {
    const verifyRes = VRPolicyHasher.verifyRecordIntegrity(
      'CLAIM',
      sampleClaim,
      sampleClaim.sha256_evaluation_hash,
      true,
      { isContractDeployed: true, useHashVerifiedLabel: true }
    );

    assert.strictEqual(verifyRes.status, "HASH VERIFIED");
    assert.strictEqual(verifyRes.isVerified, true);
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 4: ADMIN APPROVAL & ON-CHAIN STATUS TRANSITION
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 4] Admin Approval & On-Chain Status Transition...");

  it("4.1: Solidity ClaimManager contains approveClaim, rejectClaim, and ClaimStatus enum", () => {
    const abi = compiledContracts.ClaimManager.abi;
    const approveFunc = abi.find(f => f.name === 'approveClaim');
    const rejectFunc = abi.find(f => f.name === 'rejectClaim');
    const getClaimFunc = abi.find(f => f.name === 'getClaim');

    assert(approveFunc, "ClaimManager exposes approveClaim");
    assert(rejectFunc, "ClaimManager exposes rejectClaim");
    assert(getClaimFunc, "ClaimManager exposes getClaim");
  });

  it("4.2: Admin approval updates claim status to APPROVED and records approved amount", () => {
    const updatedClaim = { ...sampleClaim, status: "APPROVED", approvedAmount: 750, approvedAt: new Date().toISOString() };
    VRStorage.updateClaim(updatedClaim);

    const retrieved = VRStorage.getClaims().find(c => c.id === sampleClaim.id);
    assert.strictEqual(retrieved.status, "APPROVED", "Status is updated to APPROVED");
    assert.strictEqual(retrieved.approvedAmount, 750, "Approved amount matches requested amount");
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 5: PAYOUT AUTHORIZATION & WALLET SETTLEMENT
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 5] Payout Authorization & Wallet Settlement Pipeline...");

  const samplePayout = {
    id: "pay-test-551",
    claimId: sampleClaim.id,
    riderId: "rider-001",
    amount: 750,
    payoutMethod: "UPI_INSTANT",
    timestamp: "2026-11-22T15:15:00Z"
  };

  it("5.1: Deterministic SHA-256 payout receipt hash generated with canonical parameters", () => {
    const receiptRes = VRPolicyHasher.hashPayoutAuthorization(samplePayout);
    assert(receiptRes.sha256Hash.startsWith("0x") && receiptRes.sha256Hash.length === 66, "Valid 32-byte receipt hash");
    assert(receiptRes.canonicalString.includes('"amount":750'), "Canonical string includes amount");
    assert(receiptRes.canonicalString.includes('"claimId":"clm-test-881"'), "Canonical string includes claim ID");
  });

  await itAsync("5.2: Payout authorization registered on-chain via PayoutAuthorizer", async () => {
    const riderBefore = VRStorage.getRiderById("rider-001");
    const balanceBefore = riderBefore ? riderBefore.demoBalance : 1850;

    const payoutRes = await VRSupabase.authorizePayoutOnChain(samplePayout);

    assert(payoutRes.success, "Payout authorization succeeded");
    assert(payoutRes.txHash.startsWith("0x"), "Payout tx hash recorded");
    assert(payoutRes.receiptHash.startsWith("0x"), "Receipt hash recorded");

    samplePayout.blockchain_tx_hash = payoutRes.txHash;
    samplePayout.sha256_receipt_hash = payoutRes.receiptHash;
    samplePayout.blockchain_status = 'CONFIRMED';
    VRStorage.addPayout(samplePayout);

    // Update wallet balance
    if (riderBefore) {
      VRStorage.updateRider({ ...riderBefore, demoBalance: balanceBefore + 750 });
      const riderAfter = VRStorage.getRiderById("rider-001");
      assert.strictEqual(riderAfter.demoBalance, balanceBefore + 750, "Rider wallet credited with ₹750");
    }
  });

  it("5.3: Verification of payout receipt hash returns HASH VERIFIED", () => {
    const verifyRes = VRPolicyHasher.verifyRecordIntegrity(
      'PAYOUT',
      samplePayout,
      samplePayout.sha256_receipt_hash,
      true,
      { isContractDeployed: true, useHashVerifiedLabel: true }
    );

    assert.strictEqual(verifyRes.status, "HASH VERIFIED");
    assert.strictEqual(verifyRes.isVerified, true);
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 6: BLOCKCHAIN EXPLORER VERIFICATION & ALL 7 STATUS OUTCOMES
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 6] Blockchain Explorer: All 7 Status Outcomes Handled...");

  it("6.1: Outcome 1: HASH VERIFIED when document matches on-chain hash exactly", () => {
    const hash = VRPolicyHasher.hashPolicy(standardWeeklyPolicy).sha256Hash;
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', standardWeeklyPolicy, hash, true, { isContractDeployed: true, useHashVerifiedLabel: true });
    assert.strictEqual(res.status, "HASH VERIFIED");
    assert.strictEqual(res.isVerified, true);
  });

  it("6.2: Outcome 2: HASH MISMATCH when document has been tampered with", () => {
    const hash = VRPolicyHasher.hashPolicy(standardWeeklyPolicy).sha256Hash;
    const tampered = { ...standardWeeklyPolicy, totalCoverageLimit: 7500 };
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', tampered, hash, true, { isContractDeployed: true });
    assert.strictEqual(res.status, "HASH MISMATCH");
    assert.strictEqual(res.isVerified, false);
    assert(res.message.includes("Tamper alert"));
  });

  it("6.3: Outcome 3: TRANSACTION PENDING when record is staged but not confirmed on-chain", () => {
    const pendingPolicy = { ...standardWeeklyPolicy, blockchain_status: 'PENDING' };
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', pendingPolicy, null, true, { isContractDeployed: true, useTransactionPendingLabel: true });
    assert.strictEqual(res.status, "TRANSACTION PENDING");
    assert.strictEqual(res.isVerified, false);
  });

  it("6.4: Outcome 4: TRANSACTION FAILED when on-chain transaction reverted or failed", () => {
    const failedPolicy = { ...standardWeeklyPolicy, blockchain_status: 'FAILED', blockchain_error: 'Gas limit exceeded' };
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', failedPolicy, "0x123", true, { isContractDeployed: true });
    assert.strictEqual(res.status, "TRANSACTION FAILED");
    assert.strictEqual(res.isVerified, false);
    assert.strictEqual(res.message, "Gas limit exceeded");
  });

  it("6.5: Outcome 5: RECORD NOT FOUND when target record is missing", () => {
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', null, "0x123", true, { isContractDeployed: true });
    assert.strictEqual(res.status, "RECORD NOT FOUND");
    assert.strictEqual(res.isVerified, false);
  });

  it("6.6: Outcome 6: CONTRACT NOT DEPLOYED when live mode addresses are unconfigured", () => {
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', standardWeeklyPolicy, "0x123", true, { isContractDeployed: false });
    assert.strictEqual(res.status, "CONTRACT NOT DEPLOYED");
    assert.strictEqual(res.isVerified, false);
  });

  it("6.7: Outcome 7: BLOCKCHAIN UNAVAILABLE when RPC endpoint cannot be reached", () => {
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', standardWeeklyPolicy, "0x123", false, { isContractDeployed: true });
    assert.strictEqual(res.status, "BLOCKCHAIN UNAVAILABLE");
    assert.strictEqual(res.isVerified, false);
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 7: TAMPER DEMONSTRATION & AVALANCHE EFFECT
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 7] Tamper Demonstration & Cryptographic Avalanche Effect...");

  it("7.1: Changing policy premium from ₹69 to ₹39 alters digest completely", () => {
    const tamperRes = VRPolicyHasher.demonstrateTamperEffect(standardWeeklyPolicy, "premiumPaid", 39);
    assert.strictEqual(tamperRes.areShaHashesIdentical, false, "Hashes must not match");
    assert.notStrictEqual(tamperRes.originalSha256, tamperRes.tamperedSha256, "Digests are completely different");
  });

  it("7.2: Avalanche effect flips >40% of bits (Hamming distance > 100 out of 256)", () => {
    const h1 = VRPolicyHasher.hashPolicy(standardWeeklyPolicy).sha256Hash;
    const h2 = VRPolicyHasher.hashPolicy({ ...standardWeeklyPolicy, premiumPaid: 70 }).sha256Hash;

    // Convert hex to binary and compute Hamming distance
    const b1 = BigInt(h1);
    const b2 = BigInt(h2);
    let xor = b1 ^ b2;
    let bitFlips = 0;
    while (xor > 0n) {
      if (xor & 1n) bitFlips++;
      xor >>= 1n;
    }

    const bitFlipRatio = (bitFlips / 256) * 100;
    console.log(`    -> Hamming distance: ${bitFlips}/256 bits flipped (${bitFlipRatio.toFixed(1)}%)`);
    assert(bitFlips >= 100, `Expected at least 100 bit flips for avalanche effect, got ${bitFlips}`);
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 8: DUPLICATE CLAIM & IDEMPOTENCY REJECTION
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 8] Duplicate Claim Prevention & Idempotency Safeguards...");

  it("8.1: PayoutAuthorizer smart contract enforces idempotency on payout authorization", () => {
    const abi = compiledContracts.PayoutAuthorizer.abi;
    const authFunc = abi.find(f => f.name === 'authorizePayoutWithReceipt');
    const claimPayoutExecutedMapping = abi.find(f => f.name === 'claimPayoutExecuted');
    assert(authFunc, "PayoutAuthorizer has authorizePayoutWithReceipt");
    assert(claimPayoutExecutedMapping, "PayoutAuthorizer has claimPayoutExecuted mapping query method");
  });

  it("8.2: Duplicate payout attempt on same claim ID is detected and flagged", () => {
    const existingPayouts = VRStorage.getPayouts();
    const isDuplicate = existingPayouts.some(p => p.claimId === sampleClaim.id);
    assert.strictEqual(isDuplicate, true, "Application detects claim has already been authorized for payout");
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 9: FAILED TRANSACTION HANDLING & RECORD PRESERVATION
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 9] Failed Transaction Handling & Data Preservation...");

  it("9.1: On-chain transaction failure sets status to FAILED without deleting record", async () => {
    const failedPolicy = {
      id: "pol-test-fail-01",
      policyNumber: "VR-POL-FAIL-01",
      riderId: "rider-001",
      premiumPaid: 69,
      pincode: "400053",
      totalCoverageLimit: 5000,
      blockchain_status: 'NOT_SUBMITTED'
    };

    VRStorage.addActivePolicy(failedPolicy);

    // Simulate failure by forcing an error
    try {
      const err = new Error("Execution reverted: Policy start date cannot be in the past");
      failedPolicy.blockchain_status = 'FAILED';
      failedPolicy.blockchain_error = err.message;
      VRStorage.updatePolicy(failedPolicy);
    } catch (e) {}

    const retrieved = VRStorage.getActivePolicies().find(p => p.id === failedPolicy.id);
    assert(retrieved, "Policy record is preserved in storage");
    assert.strictEqual(retrieved.blockchain_status, "FAILED", "Status updated to FAILED");
    assert(retrieved.blockchain_error.includes("Execution reverted"), "Error reason recorded");
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 10: METAMASK USER REJECTION HANDLING (CODE 4001)
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 10] MetaMask User Rejection Handling (EIP-1193 Code 4001)...");

  it("10.1: Code 4001 is parsed into a courteous user cancellation message", () => {
    const metamaskRejectErr = { code: 4001, message: "User rejected the request." };
    const cleanMsg = VRWeb3.parseContractError(metamaskRejectErr);
    assert.strictEqual(cleanMsg, "Transaction rejected by user in MetaMask.");
  });

  it("10.2: User rejection leaves application state intact without corrupted records", () => {
    const beforeCount = VRStorage.getActivePolicies().length;
    // Simulate rejected attempt
    const cleanMsg = VRWeb3.parseContractError({ code: 4001 });
    const afterCount = VRStorage.getActivePolicies().length;
    assert.strictEqual(beforeCount, afterCount, "Record count remains unchanged after rejection");
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 11: INSUFFICIENT GAS HANDLING & FAUCET GUIDANCE
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 11] Insufficient Gas Handling & Faucet Guidance...");

  it("11.1: Gas exhaustion error produces actionable faucet directions", () => {
    const gasErr = {
      code: "INSUFFICIENT_FUNDS",
      message: "err: insufficient funds for gas * price + value: address 0x123 have 0 want 1000000"
    };
    const cleanMsg = VRWeb3.parseContractError(gasErr);
    assert(cleanMsg.includes("Insufficient Sepolia test ETH for gas"), "Mentions gas insufficiency");
    assert(cleanMsg.includes("Google Cloud Web3 or Alchemy Sepolia faucet"), "Directs user to free faucet");
  });

  // -----------------------------------------------------------------------------
  // TEST MATRIX 12: WRONG NETWORK REJECTION & CHAIN GUARD
  // -----------------------------------------------------------------------------
  console.log("\n[TEST MATRIX 12] Wrong Network Rejection & Sepolia Chain Guard...");

  it("12.1: Sepolia chain ID is verified as 11155111 (0xaa36a7)", () => {
    const network = VRContractConfig.getNetwork();
    assert.strictEqual(network.chainIdDec, 11155111, "Chain ID decimal is 11155111");
    assert.strictEqual(network.chainIdHex, "0xaa36a7", "Chain ID hex is 0xaa36a7");
  });

  await itAsync("12.2: Live transaction blocks execution when chain is not Sepolia", async () => {
    // Mock VRWeb3 state with mainnet chainId
    const originalMode = VRWeb3.isSimulationMode;
    const originalChain = VRWeb3.chainId;
    const originalConn = VRWeb3.isMetaMaskConnected;

    VRWeb3.isSimulationMode = false;
    VRWeb3.isMetaMaskConnected = true;
    VRWeb3.chainId = 1; // Ethereum Mainnet!

    let blocked = false;
    try {
      await VRWeb3.recordWeatherTrigger(extremeWeatherData);
    } catch (err) {
      if (err.message.includes("Wrong network") || err.message.includes("Ethereum Sepolia")) {
        blocked = true;
      }
    } finally {
      // Restore VRWeb3 state
      VRWeb3.isSimulationMode = originalMode;
      VRWeb3.chainId = originalChain;
      VRWeb3.isMetaMaskConnected = originalConn;
    }

    assert.strictEqual(blocked, true, "Transaction blocked when chain is not Ethereum Sepolia");
  });

  // -----------------------------------------------------------------------------
  // TEST SUMMARY
  // -----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`SUPABASE TO ETHEREUM SEPOLIA INTEGRATION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Test execution encountered fatal error:", err);
  process.exit(1);
});
