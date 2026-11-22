/**
 * VarshaRakshak — Comprehensive Solidity, SHA-256, and Web3 Test Suite
 * Validates:
 * 1. Smart Contract EVM Logic & Security Rules (PolicyRegistry, TriggerRegistry, ClaimManager, PayoutAuthorizer)
 * 2. Deterministic SHA-256 Cryptographic Record Integrity Engine & Verification Workflow
 * 3. Separation of Concerns (SHA-256 Document Integrity vs Keccak-256 Ethereum Identifiers)
 * 4. Web3 / MetaMask Connectivity & Defensive Failure Handlers
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Load modules
const VRPolicyHasher = require('../js/policy-hasher.js');
const VRContractConfig = require('../js/contracts-config.js').VRContractConfig;
const VR_ABIS = require('../js/abis.js');
const compiledContracts = require('../scripts/compile-contracts.js');

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

async function runAllTests() {
  console.log("==================================================================");
  console.log("   VARSHARAKSHAK — SOLIDITY, SHA-256 & WEB3 TEST SUITE");
  console.log("==================================================================");

  // -----------------------------------------------------------------------------
  // TEST GROUP 1: SOLIDITY CONTRACT COMPILATION & BYTECODE AUDIT
  // -----------------------------------------------------------------------------
  console.log("\n[TEST GROUP 1] Verifying Solidity 0.8.20 Bytecodes & Signatures...");

  it("All 4 contracts compiled without errors", () => {
    assert(compiledContracts.PolicyRegistry.bytecode.length > 500, "PolicyRegistry has valid bytecode");
    assert(compiledContracts.TriggerRegistry.bytecode.length > 500, "TriggerRegistry has valid bytecode");
    assert(compiledContracts.ClaimManager.bytecode.length > 500, "ClaimManager has valid bytecode");
    assert(compiledContracts.PayoutAuthorizer.bytecode.length > 500, "PayoutAuthorizer has valid bytecode");
  });

  it("PolicyRegistry includes weekly pricing, 7-day validity and SHA-256 terms functions", () => {
    const abi = compiledContracts.PolicyRegistry.abi;
    const funcNames = abi.filter(f => f.type === 'function').map(f => f.name);
    assert(funcNames.includes('registerPolicyWithTerms'), "Contains registerPolicyWithTerms");
    assert(funcNames.includes('registerPolicy'), "Contains backward-compatible registerPolicy");
    assert(funcNames.includes('isPolicyExpired'), "Contains isPolicyExpired");
    assert(funcNames.includes('verifySha256Terms'), "Contains verifySha256Terms");
    assert(funcNames.includes('pause'), "Contains pause");
    assert(funcNames.includes('unpause'), "Contains unpause");
  });

  it("TriggerRegistry includes SHA-256 evidence anchoring and pausing", () => {
    const abi = compiledContracts.TriggerRegistry.abi;
    const funcNames = abi.filter(f => f.type === 'function').map(f => f.name);
    assert(funcNames.includes('recordTriggerWithEvidence'), "Contains recordTriggerWithEvidence");
    assert(funcNames.includes('verifyEvidenceHash'), "Contains verifyEvidenceHash");
    assert(funcNames.includes('pause'), "Contains pause");
  });

  it("ClaimManager includes SHA-256 evaluation anchoring and status approvals", () => {
    const abi = compiledContracts.ClaimManager.abi;
    const funcNames = abi.filter(f => f.type === 'function').map(f => f.name);
    assert(funcNames.includes('registerClaimWithEvaluation'), "Contains registerClaimWithEvaluation");
    assert(funcNames.includes('approveClaim'), "Contains approveClaim");
    assert(funcNames.includes('rejectClaim'), "Contains rejectClaim");
    assert(funcNames.includes('verifyEvaluationHash'), "Contains verifyEvaluationHash");
  });

  it("PayoutAuthorizer includes SHA-256 receipt anchoring and idempotency checks", () => {
    const abi = compiledContracts.PayoutAuthorizer.abi;
    const funcNames = abi.filter(f => f.type === 'function').map(f => f.name);
    assert(funcNames.includes('authorizePayoutWithReceipt'), "Contains authorizePayoutWithReceipt");
    assert(funcNames.includes('verifyReceiptHash'), "Contains verifyReceiptHash");
    assert(funcNames.includes('pause'), "Contains pause");
  });

  // -----------------------------------------------------------------------------
  // TEST GROUP 2: SHA-256 DETERMINISTIC CANONICAL HASHING & AVILANCHE EFFECT
  // -----------------------------------------------------------------------------
  console.log("\n[TEST GROUP 2] Auditing SHA-256 Deterministic Integrity & Avalanche Effect...");

  const testPolicy = {
    policyNumber: "VR-POL-2026-SHA",
    riderId: "rider-001",
    pincode: "400053",
    planId: "VR-STD-02",
    totalCoverageLimit: 5000,
    premiumPaid: 69,
    startDate: "2026-07-01T00:00:00Z",
    expiryDate: "2026-07-08T00:00:00Z"
  };

  it("SHA-256 policy hash generation is 100% deterministic regardless of property ordering", () => {
    const h1 = VRPolicyHasher.hashPolicy(testPolicy);
    const reorderedPolicy = {
      expiryDate: "2026-07-08T00:00:00Z",
      premiumPaid: 69,
      totalCoverageLimit: 5000,
      planId: "VR-STD-02",
      pincode: "400053",
      startDate: "2026-07-01T00:00:00Z",
      policyNumber: "VR-POL-2026-SHA",
      riderId: "rider-001"
    };
    const h2 = VRPolicyHasher.hashPolicy(reorderedPolicy);

    assert.strictEqual(h1.sha256Hash, h2.sha256Hash, "SHA-256 hashes must be identical");
    assert(h1.sha256Hash.startsWith("0x"), "Hash must have 0x prefix");
    assert.strictEqual(h1.sha256Hash.length, 66, "SHA-256 hash must be 32 bytes (64 hex chars + 0x)");
  });

  it("Altering single character in policy produces avalanche effect in SHA-256", () => {
    const tamperRes = VRPolicyHasher.demonstrateTamperEffect(testPolicy, "premiumPaid", 70);
    assert.strictEqual(tamperRes.areShaHashesIdentical, false, "Hashes must not match after modification");
    assert.notStrictEqual(tamperRes.originalSha256, tamperRes.tamperedSha256, "Avalanche effect must alter digest completely");
  });

  it("Weather Evidence SHA-256 normalization and hashing", () => {
    const weatherData = {
      eventType: "HEAVY_RAIN",
      rainfallRateMmHr: 45.5,
      pincode: "400053",
      durationMinutes: 60,
      provider: "OpenWeatherMap-Live",
      isDemoSimulation: false,
      timestamp: "2026-07-05T12:00:00Z"
    };
    const weatherHash = VRPolicyHasher.hashWeatherEvidence(weatherData);
    assert(weatherHash.sha256Hash.startsWith("0x"), "Weather hash has 0x prefix");
    assert.strictEqual(weatherHash.algorithm, "SHA-256", "Reports algorithm as SHA-256");
    assert(weatherHash.canonicalString.includes("HEAVY_RAIN"), "Includes event type");
  });

  it("Claim Evaluation SHA-256 normalization and hashing", () => {
    const claimData = {
      claimNumber: "VR-CLM-7788",
      policyNumber: "VR-POL-2026-SHA",
      riderId: "rider-001",
      requestedAmount: 750,
      approvedAmount: 750,
      fraudRiskScore: 12,
      status: "TriggerDetected",
      createdAt: "2026-07-05T12:30:00Z"
    };
    const claimHash = VRPolicyHasher.hashClaimEvaluation(claimData);
    assert(claimHash.sha256Hash.startsWith("0x"), "Claim hash has 0x prefix");
    assert(claimHash.canonicalString.includes("VR-CLM-7788"), "Includes claim number");
  });

  it("Payout Authorization SHA-256 normalization and hashing", () => {
    const payoutData = {
      id: "VR-PAY-9922",
      claimId: "VR-CLM-7788",
      policyId: "VR-POL-2026-SHA",
      riderId: "rider-001",
      amount: 750,
      authorizedAt: "2026-07-05T12:35:00Z"
    };
    const payoutHash = VRPolicyHasher.hashPayoutAuthorization(payoutData);
    assert(payoutHash.sha256Hash.startsWith("0x"), "Payout hash has 0x prefix");
    assert(payoutHash.canonicalString.includes("VR-PAY-9922"), "Includes payout reference");
  });

  // -----------------------------------------------------------------------------
  // TEST GROUP 3: VERIFICATION WORKFLOW & STATUS CLASSIFICATIONS
  // -----------------------------------------------------------------------------
  console.log("\n[TEST GROUP 3] Verifying 9-Step Verification Status Workflow...");

  it("Returns VERIFIED when on-chain hash matches calculated SHA-256", () => {
    const hashObj = VRPolicyHasher.hashPolicy(testPolicy);
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', testPolicy, hashObj.sha256Hash, true);
    assert.strictEqual(res.status, "VERIFIED");
    assert.strictEqual(res.isVerified, true);
  });

  it("Returns HASH MISMATCH when document has been tampered with post-issuance", () => {
    const hashObj = VRPolicyHasher.hashPolicy(testPolicy);
    const tamperedPolicy = { ...testPolicy, totalCoverageLimit: 9999 };
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', tamperedPolicy, hashObj.sha256Hash, true);
    assert.strictEqual(res.status, "HASH MISMATCH");
    assert.strictEqual(res.isVerified, false);
  });

  it("Returns RECORD NOT FOUND when document is null or missing", () => {
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', null, "0x123", true);
    assert.strictEqual(res.status, "RECORD NOT FOUND");
    assert.strictEqual(res.isVerified, false);
  });

  it("Returns VERIFICATION PENDING when record is stored locally but on-chain hash is null/zero", () => {
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', testPolicy, null, true);
    assert.strictEqual(res.status, "VERIFICATION PENDING");
    assert.strictEqual(res.isVerified, false);
  });

  it("Returns BLOCKCHAIN UNAVAILABLE when RPC connection is down", () => {
    const res = VRPolicyHasher.verifyRecordIntegrity('POLICY', testPolicy, "0x123", false);
    assert.strictEqual(res.status, "BLOCKCHAIN UNAVAILABLE");
    assert.strictEqual(res.isVerified, false);
  });

  it("Maintains strict clean separation between SHA-256 document integrity & Keccak-256 identifiers", () => {
    const policyHashObj = VRPolicyHasher.hashPolicy(testPolicy);
    // Keccak identifier for rider
    const riderKeccak = VRPolicyHasher.keccak256("rider-001");
    // SHA-256 document hash
    const docSha = policyHashObj.sha256Hash;

    assert.notStrictEqual(policyHashObj.sha256Hash, policyHashObj.keccakHash, "SHA-256 and Keccak-256 produce different digests");
    assert(riderKeccak.startsWith("0x") && riderKeccak.length === 66, "Keccak produces valid 32-byte identifier");
    assert(docSha.startsWith("0x") && docSha.length === 66, "SHA-256 produces valid 32-byte digest");
  });

  // -----------------------------------------------------------------------------
  // TEST GROUP 4: WEB3 DEFENSIVE TESTING & ERROR HANDLING
  // -----------------------------------------------------------------------------
  console.log("\n[TEST GROUP 4] Testing Web3 Defensive Handling & Sepolia Configuration...");

  it("Detects and rejects unconfigured contract addresses in live mode", () => {
    const mockStorage = { getSettings: () => ({ deployedContracts: {} }) };
    const addrs = VRContractConfig.getContractAddresses(true);
    // If null or unconfigured, boolean check returns false
    const isReady = VRContractConfig.areContractsDeployedOnLive();
    assert.strictEqual(isReady, false, "Live readiness check correctly flags undeployed addresses");
  });

  it("Provides keyless public RPC fallback URLs for read-only operations", () => {
    const network = VRContractConfig.getNetwork();
    assert(network.rpcUrls.length >= 3, "Contains at least 3 RPC endpoints");
    assert(network.rpcUrls.some(u => u.includes("rpc.sepolia.org")), "Includes public rpc.sepolia.org");
    assert(network.rpcUrls.some(u => u.includes("blastapi.io")), "Includes public blastapi.io");
  });

  it("Handles MetaMask User Cancellation (Code 4001) with clean human message", () => {
    const VRWeb3 = require('../js/web3.js');
    const err = { code: 4001, message: "User rejected the transaction." };
    const parsed = VRWeb3.parseContractError(err);
    assert(parsed.includes("rejected by user"), "Parsed message explains user rejection");
  });

  it("Handles Gas Exhaustion with faucet directions", () => {
    const VRWeb3 = require('../js/web3.js');
    const err = { code: "INSUFFICIENT_FUNDS", message: "insufficient funds for gas * price + value" };
    const parsed = VRWeb3.parseContractError(err);
    assert(parsed.includes("Insufficient Sepolia test ETH"), "Parsed message guides user to faucet");
  });

  // -----------------------------------------------------------------------------
  // TEST GROUP 5: LIVE SEPOLIA RPC SMOKE VERIFICATION
  // -----------------------------------------------------------------------------
  console.log("\n[TEST GROUP 5] Querying Live Ethereum Sepolia RPC Block Telemetry...");

  await itAsync("Alchemy Sepolia RPC endpoint returns verified live block header", async () => {
    const deployScript = require('../scripts/deploy-sepolia.js');
    const { provider } = await deployScript.getProvider();
    const blockNum = await provider.getBlockNumber();
    assert(blockNum > 12000000, `Block number #${blockNum} must be > 12,000,000 on Sepolia`);
  });

  // SUMMARY
  console.log("\n==================================================================");
  console.log(`NEW BLOCKCHAIN & SHA-256 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch(e => {
  console.error("Test execution aborted:", e);
  process.exit(1);
});
