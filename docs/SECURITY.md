# Security Architecture & Risk Mitigation
## VarshaRakshak — Smart Insurance for Every Delivery Rider

**Document Version:** 2.0.0 (Post-Audit Hardening & SHA-256 Implementation)

---

## 1. Threat Modeling & Mitigation Matrix

| Threat Category | Potential Attack Vector | System Defense & Mitigation |
| :--- | :--- | :--- |
| **Duplicate Claim Fraud** | Rider or bot submits multiple claims for the same rain event. | Strict compound unique constraint `keccak256(policyId, triggerEventHash)` in `ClaimManager.sol` + 6 client/backend anti-fraud heuristics. |
| **Spoofed Telemetry** | Rider fakes GPS coordinates to appear in a flooded area while outside it. | Two-factor verification: (1) Rider's primary registered delivery hub PIN code, and (2) Cellular network / IP geolocation cross-reference + Fraud velocity scoring. |
| **Unauthorized Payouts** | Attacker calls payout authorization without privileges. | Only authorized disbursers (`onlyDisburser`) can invoke `PayoutAuthorizer.sol`. All calls verify approved claim status and deduct policy capacity. |
| **PII Data Leak** | Sensitive rider information exposed on public blockchain or open APIs. | Zero PII on-chain. Only pseudonymous `keccak256(riderId)` hashes and SHA-256 canonical terms digests stored on Sepolia. Original PII remains encrypted off-chain. |
| **Replay Attacks** | Attacker replays valid API request with same auth token to drain funds. | Idempotency keys (`X-Idempotency-Key`) stored in DB + on-chain `claimPayoutExecuted[claimId]` idempotency flag. |
| **Contract Pausing / Circuit Breakers** | Malicious bug discovered in contract logic during execution. | All 4 contracts implement `pause()` / `unpause()` and `whenNotPaused` modifier, enabling the owner to halt state changes instantly. |
| **Credential Exposure** | Public repository or frontend JS leaks private keys or API secrets. | Private keys strictly forbidden from frontend; public keyless RPC fallback used; `.env` gitignored; key rotation protocol enforced. |

---

## 2. Credential Exposure Remediation & Key Rotation Protocols

### A. Remediation Summary (Milestone 2 Hardening)
1. **Frontend Architecture:** Frontend JavaScript operates in zero-privilege client mode. Privileged operations (contract deployment, oracle attestation, claim approval) must be signed via MetaMask by an authorized administrative account.
2. **Git Hygiene:** Added comprehensive `.gitignore` preventing `.env`, `.env.local`, and build artifacts from entering version control.
3. **Template Sanitization:** Sanitized `.env.example` to remove any hardcoded private keys or production secrets.
4. **Keyless RPC Fallback:** If custom Alchemy or Infura keys are unavailable, `js/contracts-config.js` falls back to keyless public Sepolia RPCs (`https://rpc.sepolia.org`, `https://eth-sepolia.public.blastapi.io`, `https://1rpc.io/sepolia`).

### B. Required API Key Rotation Protocol
The external API keys referenced during early development prototyping must be rotated prior to any production launch:
- **Alchemy Sepolia RPC Key:** Rotate and set domain allowlists inside the Alchemy Developer Dashboard (`https://dashboard.alchemy.com`).
- **Etherscan Developer API Key:** Rotate on [etherscan.io/myapikey](https://etherscan.io/myapikey).
- **OpenWeatherMap API Key:** Regenerate via [home.openweathermap.org/api_keys](https://home.openweathermap.org/api_keys).

---

## 3. Rules-Based Fraud Detection Engine

Every claim evaluation triggers the fraud rules pipeline before payout authorization:
1. **Rule F-01: Duplicate Event Check** — Does a paid or approved claim already exist for this rider and weather event ID?
2. **Rule F-02: Policy Status Check** — Was the policy in `ACTIVE` state at the event timestamp? (Rejects claims on expired policies past 7 days).
3. **Rule F-03: Waiting Period Check** — Did the weather event occur within the waiting period post-purchase?
4. **Rule F-04: Frequency / Velocity Anomaly** — Has the rider submitted > 3 claims in the last 7 calendar days?
5. **Rule F-05: Geographic Zone Verification** — Does the event PIN code match the rider's primary registered delivery cluster?
6. **Rule F-06: Coverage Cap Check** — Does requested payout exceed `coverage_limit_remaining`?

If any rule fails:
- Risk score increases.
- If score >= 60, status set to `UNDER_REVIEW` for manual investigation.
- Auto-rejection occurs if policy is expired or duplicate event is confirmed (Risk Score >= 80).

---

## 4. Cryptographic Record Integrity vs. Encryption

VarshaRakshak draws a sharp boundary between integrity verification and encryption:
- **SHA-256 (FIPS 180-4):** Used strictly for **one-way document integrity digests**. Hashing does not encrypt plaintext data; rather, it produces a non-repudiable fingerprint proving whether an off-chain record was altered after on-chain anchoring.
- **AES-256-GCM:** Recommended for protecting off-chain database columns holding rider personal details (PAN/Aadhaar references, mobile numbers, bank UPI IDs) in production backends.
