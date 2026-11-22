# SHA-256 Cryptographic Record Integrity Specification
## VarshaRakshak (वर्षा रक्षक) — Parametric Gig Insurance Platform

**Document Version:** 2.0.0  
**Classification:** Technical Security Architecture  
**Primary Standards:** FIPS 180-4 (Secure Hash Standard SHA-256), ISO/IEC 10118-3, DPDP Act 2023 (Zero PII Compliance)

---

## 1. Executive Summary & Architectural Separation

VarshaRakshak implements a strict **Dual-Layer Cryptographic Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DUAL-LAYER CRYPTOGRAPHIC ENGINE                       │
├──────────────────────────────────────┬──────────────────────────────────────┤
│    LAYER 1: SHA-256 DOCUMENT INTEGRITY    │     LAYER 2: KECCAK-256 ETHEREUM EVM     │
│  (FIPS 180-4 Standard 256-bit Digest)│    (Ethereum Native Keccak-256 Digest)    │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Canonical Insurance Policy Terms   │ • Pseudonymous Rider Account Hashes  │
│ • Weather Sensor Evidence Telemetry  │ • Smart Contract Mapping Keys        │
│ • Claim Evaluation Reports & Audits  │ • Compound Uniqueness Duplicate Keys │
│ • Payout Authorization Receipts      │ • Ethereum Function Selectors & Logs │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Critical Implementation Rules:
1. **Zero PII on Any Ledger:** No rider names, phone numbers, vehicle registrations, or GPS breadcrumbs are included in any hash. Rider identity is pseudonymized via `keccak256(riderId)`.
2. **Deterministic Canonical Serialization:** Key-ordering ambiguity is eliminated by sorting all dictionary keys alphabetically prior to serialization.
3. **Hashing is NOT Encryption:** Hashes provide non-repudiable integrity proofs; they do not obscure plaintext for later decryption. Original documents reside in secure off-chain storage.

---

## 2. Nine-Step Verification Workflow

```
[Step 1: Document Created/Updated in Off-Chain Storage]
       ↓
[Step 2: Canonical Normalization (Sorted Keys, Epoch Seconds, Strict Types)]
       ↓
[Step 3: SHA-256 Hash Generated (32-byte bytes32 Hex: 0x...)]
       ↓
[Step 4: Record Stored in Application Database / Storage]
       ↓
[Step 5: Hash Registered on Ethereum Sepolia Smart Contract via MetaMask]
       ↓
[Step 6: Auditor/Rider Requests Verification via Blockchain Explorer]
       ↓
[Step 7: Engine Re-reads Document & Recalculates Deterministic SHA-256]
       ↓
[Step 8: Engine Fetches Registered Hash from Smart Contract on Sepolia]
       ↓
[Step 9: Byte-for-Byte Comparison & Status Return]
       ├── <verified>HASH VERIFIED</verified> (100% Cryptographic Match)
       ├── HASH MISMATCH (Tamper Alert: Document altered post-issuance)
       ├── PENDING (Stored locally, awaiting mining confirmation)
       ├── RECORD NOT FOUND (Target document missing from storage)
       └── BLOCKCHAIN UNAVAILABLE (Sepolia RPC connection offline)
```

---

## 3. Four Canonical Hashed Record Types

### A. Insurance Policy Terms
- **Canonical Schema:**
  ```json
  {
    "algorithm": "SHA-256",
    "coverageLimit": 5000,
    "currency": "INR",
    "durationDays": 7,
    "expiryTimeUnix": 1720483199,
    "pincode": "400053",
    "planCode": "VR-STD-02",
    "policyNumber": "VR-POL-2026-001",
    "premiumPaid": 69,
    "pseudonymousRider": "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    "schemaVersion": "1.0.0",
    "startTimeUnix": 1719878400
  }
  ```
- **On-Chain Anchor:** `PolicyRegistry.sol` (`registerPolicyWithTerms`)

### B. Weather Sensor Evidence Telemetry
- **Canonical Schema:**
  ```json
  {
    "algorithm": "SHA-256",
    "durationMinutes": 60,
    "eventType": "HEAVY_RAIN",
    "intensityValue": 450,
    "isDemoSimulation": false,
    "metricUnit": "MM_HR_X10",
    "pincode": "400053",
    "provider": "OpenWeatherMap-Live",
    "recordedAtUnix": 1720180800,
    "schemaVersion": "1.0.0"
  }
  ```
- **On-Chain Anchor:** `TriggerRegistry.sol` (`recordTriggerWithEvidence`)

### C. Claim Evaluation Report
- **Canonical Schema:**
  ```json
  {
    "algorithm": "SHA-256",
    "approvedAmount": 750,
    "claimNumber": "VR-CLM-2026-9102",
    "decisionStatus": "TriggerDetected",
    "evaluatedAtUnix": 1720182600,
    "fraudRiskScore": 14,
    "policyNumber": "VR-POL-2026-001",
    "pseudonymousRider": "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    "requestedAmount": 750,
    "schemaVersion": "1.0.0",
    "triggerEventRef": "0x89ab...cdef"
  }
  ```
- **On-Chain Anchor:** `ClaimManager.sol` (`registerClaimWithEvaluation`)

### D. Payout Authorization Receipt
- **Canonical Schema:**
  ```json
  {
    "algorithm": "SHA-256",
    "amount": 750,
    "authorizedAtUnix": 1720182900,
    "claimId": "CLM-2026-9102",
    "currency": "INR",
    "payoutMethod": "INTERNAL_SIMULATED_WALLET",
    "payoutReference": "VR-PAY-2026-4431",
    "policyId": "VR-POL-2026-001",
    "pseudonymousRider": "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    "schemaVersion": "1.0.0"
  }
  ```
- **On-Chain Anchor:** `PayoutAuthorizer.sol` (`authorizePayoutWithReceipt`)

---

## 4. Avalanche Effect Demonstration

The cryptographic hash function guarantees high entropy and avalanche resistance.
If a malicious actor alters a single term—such as increasing `totalCoverageLimit` from ₹5,000 to ₹5,001—over 50% of the bits in the 256-bit digest invert:

- **Original SHA-256:** `0x71a2bc89...34fe`
- **Tampered SHA-256:** `0x19df43a1...88bc`
- **Smart Contract Verification:** Immediately reverts or flags `HASH MISMATCH`.
