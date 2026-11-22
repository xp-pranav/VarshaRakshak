# VarshaRakshak — Technical Architecture & System Design
**Full-Stack Parametric Web3 Insurance Platform Specification**  
*Bajaj Technology Prototype • Judge Briefing Document 3*

---

## 1. High-Level System Architecture

VarshaRakshak is engineered as a **hybrid multi-tier architecture** that combines high-performance cloud databases, client-side cryptography, and decentralized blockchain verification:

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Client Application Layer (Bilingual Mobile-First Web App)"]
        UI["17 HTML5/CSS3 Views<br/>(Dark Theme, Emil Kowalski Motion)"]
        Guard["VRAuthGuard<br/>(Synchronous Zero-FOUC Barrier)"]
        Storage["VRStorage<br/>(Local Cache & Identity Manager)"]
        Voice["VRVoice Assistant<br/>(Web Speech API: HI, MR, EN)"]
        Hasher["VRPolicyHasher<br/>(FIPS 180-4 SHA-256 Engine)"]
    end

    subgraph CloudLayer ["2. Cloud & Database Layer (Supabase PostgreSQL 15+)"]
        Auth["Supabase Auth<br/>(JWT Token & User Identity)"]
        DB["11 Relational Tables<br/>(Strict Row Level Security)"]
        Trigger["DB Trigger: handle_new_user()<br/>(Unconditional RIDER Role Assignment)"]
        SecurityDefiner["Security Definer RPCs<br/>(Server-Side Admin Role Provisioning)"]
    end

    subgraph OracleLayer ["3. Weather Telemetry & Oracle Engine"]
        OWM["OpenWeatherMap API<br/>(Rainfall Rate, Temp, Wind)"]
        OM["Open-Meteo API<br/>(Precipitation & Flash-Flood Fallback)"]
        Simulator["Admin Weather Simulator<br/>(Controlled Anomaly Injection)"]
    end

    subgraph Web3Layer ["4. Decentralized Blockchain Layer (Ethereum Sepolia)"]
        Web3["VRWeb3 Adapter (Ethers.js v6)"]
        PR["PolicyRegistry.sol<br/>(7-Day Validity & SHA-256 Terms)"]
        TR["TriggerRegistry.sol<br/>(Weather Anomaly Evidence Digests)"]
        CM["ClaimManager.sol<br/>(Evaluation Digests & Anti-Duplicate)"]
        PA["PayoutAuthorizer.sol<br/>(Disbursal Receipts & Idempotency)"]
    end

    UI --> Guard
    Guard --> Auth
    Guard --> DB
    UI --> Storage
    UI --> Hasher
    UI --> Voice

    Simulator --> OracleLayer
    OWM --> CloudLayer
    OM --> CloudLayer

    Hasher --> DB
    Hasher --> Web3
    Web3 --> PR
    Web3 --> TR
    Web3 --> CM
    Web3 --> PA
```

---

## 2. On-Chain vs. Off-Chain Data Segregation (Privacy-by-Design)

A critical architectural achievement of VarshaRakshak is its **strict data privacy segregation**. Personal Identifiable Information (PII) is never broadcasted to the public Ethereum ledger:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATA SEGREGATION: OFF-CHAIN VS. ON-CHAIN                     │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│ OFF-CHAIN (Supabase PostgreSQL + RLS) │ ON-CHAIN (Ethereum Sepolia Contracts)   │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ • Rider Full Legal Name & Phone       │ • Pseudonymous Hash: keccak256(riderId) │
│ • Complete Residential Street Address │ • 6-digit delivery PIN code only        │
│ • Vehicle Registration & Driving Lic. │ • Policy ID bytes32                     │
│ • Delivery Platform ID (e.g. ZOM-812) │ • 7-Day Start & Expiry Unix Timestamps  │
│ • Raw GPS Telemetry & Coordinates     │ • Max Coverage Limit & Premium (₹49-99) │
│ • Emergency Contact Details           │ • SHA-256 Digest of Canonical Terms     │
│ • Financial Bank Account / UPI Details│ • SHA-256 Digest of Weather Evidence    │
│ • Full Audit Logs & Operator Comments │ • SHA-256 Digest of Settlement Receipt  │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

### Why this matters to judges:
1. **GDPR / DPDP Act 2023 Compliance:** Indian and global data privacy regulations mandate the "Right to Erasure". Blockchains are immutable. By keeping PII in Supabase, a rider's personal data can be deleted upon request (`ON DELETE SET NULL`), while the financial audit hashes remain tamper-proof on-chain.
2. **Minimal Gas Footprint:** Storing strings like full names or raw telemetry on Ethereum incurs massive gas costs. Storing compact 32-byte SHA-256 digests reduces transaction gas by over 80%.

---

## 3. Cryptographic Hashing Architecture: SHA-256 vs. Keccak-256

VarshaRakshak implements a mathematically sound **dual-layer cryptographic strategy**:

```
                                  RIDER POLICY TERMS
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
                   ▼                                             ▼
     Canonical String Normalization                 EVM Identifier Transformation
                   │                                             │
                   ▼                                             ▼
            FIPS 180-4 SHA-256                            Ethereum Keccak-256
                   │                                             │
                   ▼                                             ▼
        sha256_terms_hash (bytes32)                    policyId / riderHash (bytes32)
   "0x3089e3b8ff23db1b75fa599bc5943a41..."       "0x7a8b9c0d1e2f3a4b5c6d7e8f4b78a9c3..."
                   │                                             │
                   ▼                                             ▼
       DOCUMENT INTEGRITY ANCHOR                       SMART CONTRACT STORAGE KEY
```

1. **SHA-256 (FIPS 180-4 NIST Standard):**
   - Implemented via `VRPolicyHasher.js` using browser-native Web Cryptography API (`crypto.subtle.digest("SHA-256")`).
   - Normalizes JSON properties into a canonical, alphabetically-sorted string before hashing.
   - Exhibits full **avalanche effect**: changing a single digit in the premium or coverage limit flips ~50% of the output bits, making any post-issuance tampering immediately detectable.
2. **Keccak-256 (Ethereum Native):**
   - Used for Solidity mappings, event topics, compound unique keys (`keccak256(abi.encodePacked(policyId, eventHash))`), and pseudonymous user obfuscation.

---

## 4. End-to-End Parametric Evaluation & Settlement Lifecycle

The flowchart below traces the 10-step automated pipeline executed when severe weather strikes:

```mermaid
sequenceDiagram
    autonumber
    actor Rider as Delivery Partner (Raju)
    participant App as VarshaRakshak Client
    participant DB as Supabase PostgreSQL
    participant Oracle as Weather Oracle Engine
    participant Contracts as Ethereum Smart Contracts

    Rider->>App: Purchases 7-Day Standard Plan (₹69)
    App->>DB: Stores Policy in public.policies (NOT_SUBMITTED)
    App->>Contracts: PolicyRegistry.registerPolicyWithTerms(SHA-256 Terms)
    Contracts-->>App: Confirmed (Sepolia Tx Hash)
    App->>DB: Updates status to CONFIRMED

    Note over Oracle,DB: Real-time Weather Telemetry Monitoring (OpenWeatherMap / Open-Meteo)
    Oracle->>App: Cloudburst Alert: 68 mm/hr in PIN 400053
    App->>Contracts: TriggerRegistry.recordTriggerWithEvidence(SHA-256 Evidence)

    Note over App,DB: 10-Step Automated Parametric Settlement Pipeline
    App->>DB: 1. Validate active policy validity (within 7-day window)
    App->>DB: 2. Check waiting period & PIN code match (400053)
    App->>App: 3. Verify weather threshold (68mm/hr >= 35mm/hr trigger)
    App->>App: 4. Fraud Check: GPS location vs PIN code consistency
    App->>App: 5. Fraud Check: Compound anti-duplicate check (Policy + Event)
    App->>App: 6. Calculate compensation: ₹750 based on 3-hr disruption
    App->>DB: 7. Record claim in public.claims (APPROVED)
    App->>Contracts: ClaimManager.registerClaimWithEvaluation(SHA-256 Evaluation)
    App->>DB: 8. Authorize payout in public.payout_authorizations
    App->>Contracts: PayoutAuthorizer.authorizePayoutWithReceipt(SHA-256 Receipt)
    App->>App: 9. Credit ₹750 to Rider Digital Balance
    App-->>Rider: 10. Voice Alert in Hindi: "₹750 का क्लेम मंजूर हो गया है।"
```

---

## 5. Security Architecture & Threat Mitigations

| Security Domain | Threat Vector | Technical Defense Implemented | Status |
| :--- | :--- | :--- | :--- |
| **Authentication** | Direct URL tampering to access `/admin.html` | `VRAuthGuard` synchronous pre-render barrier + server-side role check | `VERIFIED ON SUPABASE` |
| **Privilege Escalation** | User tampering with browser storage or signup metadata | Role strictly derived from `public.profiles`. Trigger unconditionally assigns `RIDER`. | `VERIFIED ON SUPABASE` |
| **Flash of Private Data** | Back-button navigation restoring cached dashboard (bfcache) | `pageshow` event listener verifies session on persisted restorations | `VERIFIED ON SUPABASE` |
| **Cross-Tenant Privacy** | Rider A attempting to read or modify Rider B's policies/claims | Supabase Row Level Security: `auth.uid() = rider_id` enforced on all tables | `VERIFIED ON SUPABASE` |
| **Oracle Spoofing** | Rider crafting fake weather reports to trigger fake claims | Direct rider INSERT disabled on `weather_events`. Only admin or service role can insert. | `VERIFIED ON SUPABASE` |
| **Contract Reentrancy** | Attacker draining balances via recursive payout requests | Idempotency guard: `keccak256(claimId, receiptHash)` prevents re-execution | `TESTED LOCALLY` |
| **Terms Tampering** | Insurer modifying policy coverage or premium post-issuance | Document SHA-256 hash anchored in `PolicyRegistry`; mismatches fail validation | `TESTED LOCALLY` |

---

*Next Document:* [Features & Step-by-Step Demo Guide](file:///Users/pranav/🧑‍💻/v1/docs/judges/FEATURES_AND_DEMO.md)
