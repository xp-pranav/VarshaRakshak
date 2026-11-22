# Blockchain Architecture & Smart Contracts (Ethereum Sepolia)
## VarshaRakshak (वर्षा रक्षक) — Parametric Gig Insurance Platform

**Document Version:** 2.0.0 (Round 2 Web3 & SHA-256 Security Architecture)  
**Network:** Ethereum Sepolia Testnet (ChainID: 11155111, Hex: `0xaa36a7`)  
**Solidity Compiler:** ^0.8.20  
**Web3 Client:** Ethers.js v6  
**Deployment Tools:** Remix IDE + Hardhat + Node.js  
**Block Explorer:** [sepolia.etherscan.io](https://sepolia.etherscan.io)

---

## 1. Blockchain Design Principles

1. **Zero Personal Identifiable Information (PII) On-Chain:**
   - Rider full names, phone numbers, vehicle registrations, and real-time GPS breadcrumbs are strictly stored off-chain in encrypted application storage.
   - Smart contracts store only pseudonymous rider hashes (`keccak256(riderId)`), SHA-256 canonical terms digests, pincodes, timestamps, coverage amounts, and lifecycle enums.

2. **Dual-Layer Cryptographic Model:**
   - **SHA-256 (FIPS 180-4):** Used for document, weather evidence, claim evaluation, and payout receipt integrity.
   - **Keccak-256 (Ethereum Native):** Used for EVM function selectors, storage mapping keys, and pseudonymous identifiers.

3. **Weekly Insurance Underwriting Enforcement:**
   - Smart contract enforces strict weekly micro-insurance bounds:
     - Basic: ₹49 / week (₹2,500 total weekly cap, max ₹800/day)
     - Standard: ₹69 / week (₹5,000 total weekly cap, max ₹1,500/day)
     - Premium: ₹99 / week (₹8,000 total weekly cap, max ₹2,500/day)
   - Duration rule: `expiryTime <= startTime + 7 days + 1 hours`.
   - Bound rule: `require(premiumAmount >= 49 && premiumAmount <= 99)`.

4. **Emergency Pausing & Role-Based Access Control:**
   - Contracts include `pause()` and `unpause()` owner emergency controls.
   - Inter-contract authorizations (`authorizedIssuers`, `authorizedOracles`, `authorizedClaimsOfficers`, `authorizedDisbursers`) restrict execution to authenticated entities.

---

## 2. Smart Contract Topology & Call Graph

```
                               ┌───────────────────────────┐
                               │       MetaMask User       │
                               │   (Rider / Admin Wallet)  │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
          ┌─────────────────────────┐                 ┌─────────────────────────┐
          │    PolicyRegistry       │                 │     TriggerRegistry     │
          │ - registerPolicyWithTerms│                │ - recordTriggerWithEvid │
          │ - verifyPolicy()        │                 │ - verifyEvidenceHash()  │
          │ - isPolicyExpired()     │                 │ - getTrigger()          │
          │ - deductCoverage()      │                 └────────────┬────────────┘
          └────────────▲────────────┘                              │
                       │                                           │
                       │               ┌───────────────────────────┘
                       │               │
                       │               ▼
                       │  ┌─────────────────────────┐
                       │  │      ClaimManager       │
                       │  │ - registerClaimWithEval │
                       ├──┤ - approveClaim()        │
                       │  │ - rejectClaim()         │
                       │  │ - verifyEvaluationHash()│
                       │  └────────────┬────────────┘
                       │               │
                       │               ▼
                       │  ┌─────────────────────────┐
                       │  │    PayoutAuthorizer     │
                       └──┤ - authorizePayoutWithRec│
                          │ - verifyReceiptHash()   │
                          │ - getPayout()           │
                          └─────────────────────────┘
```

---

## 3. Contract Specifications

### 3.1 `PolicyRegistry.sol`
- **Purpose:** Registers weekly parametric insurance policies, anchors deterministic SHA-256 terms hashes, enforces 7-day validity and ₹49–₹99 premium bounds, and tracks remaining payout capacity.
- **Key Functions:**
  - `registerPolicyWithTerms(bytes32 policyId, bytes32 pseudonymousRider, string pincode, uint64 startTime, uint64 expiryTime, uint256 maxCoverageAmount, uint256 premiumAmount, bytes32 sha256TermsHash)`
  - `verifyPolicy(bytes32 policyId) returns (bool isValid, bool isActive, uint256 remainingCoverage)`
  - `isPolicyExpired(bytes32 policyId) returns (bool)`
  - `verifySha256Terms(bytes32 policyId, bytes32 expectedHash) returns (bool)`
  - `deductCoverage(bytes32 policyId, uint256 payoutAmount)`

### 3.2 `TriggerRegistry.sol`
- **Purpose:** Anchors verified environmental anomaly events (Rainfall, Heat, Cold, Waterlogging) submitted by authenticated Oracles.
- **Key Functions:**
  - `recordTriggerWithEvidence(bytes32 eventHash, bytes32 evidenceHash, EventType eventType, string pincode, uint32 intensityValue, uint16 durationMinutes, bool isDemoSimulation)`
  - `verifyTrigger(bytes32 eventHash)`
  - `verifyEvidenceHash(bytes32 eventHash, bytes32 expectedEvidenceHash) returns (bool)`

### 3.3 `ClaimManager.sol`
- **Purpose:** Manages claim lifecycle, anchors SHA-256 claim evaluation reports, and enforces compound duplicate claim prevention (`keccak256(policyId, triggerEventHash)`).
- **Key Functions:**
  - `registerClaimWithEvaluation(bytes32 claimId, bytes32 policyId, bytes32 triggerEventHash, bytes32 evaluationHash, bytes32 pseudonymousRider, uint256 requestedAmount)`
  - `approveClaim(bytes32 claimId, uint256 approvedAmount, string notes)`
  - `rejectClaim(bytes32 claimId, string notes)`
  - `verifyEvaluationHash(bytes32 claimId, bytes32 expectedHash) returns (bool)`

### 3.4 `PayoutAuthorizer.sol`
- **Purpose:** Enforces approved claim eligibility, anchors SHA-256 settlement receipts, prevents double disbursements, and executes cross-contract coverage deduction on `PolicyRegistry`.
- **Key Functions:**
  - `authorizePayoutWithReceipt(bytes32 payoutReference, bytes32 claimId, bytes32 policyId, bytes32 receiptHash, bytes32 pseudonymousRider, uint256 amount)`
  - `verifyReceiptHash(bytes32 payoutReference, bytes32 expectedHash) returns (bool)`

---

## 4. Deployment & Configuration

- Deployment Instructions: [docs/REMIX_DEPLOYMENT.md](file:///Users/pranav/🧑‍💻/v1/docs/REMIX_DEPLOYMENT.md)
- Testing & Smoke Suite: [docs/SEPOLIA_TESTING.md](file:///Users/pranav/🧑‍💻/v1/docs/SEPOLIA_TESTING.md)
- SHA-256 Specification: [docs/SHA256_SECURITY.md](file:///Users/pranav/🧑‍💻/v1/docs/SHA256_SECURITY.md)
