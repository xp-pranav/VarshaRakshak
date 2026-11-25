# VarshaRakshak (वर्षा रक्षक)
## Smart Insurance for Every Delivery Rider — Web3 & Parametric Product Simulation
**Project Type:** Bajaj Technology Prototype  
**Architecture:** Pure HTML5, CSS3, Vanilla JavaScript (ES6+), Ethers.js v6 CDN & Solidity Smart Contracts on Ethereum Sepolia Testnet  
**Network:** Ethereum Sepolia (Chain ID `11155111` / `0xaa36a7`)

---

> **IMPORTANT REGULATORY & DEMONSTRATION NOTICE:**  
> VarshaRakshak is an interactive browser-based technology prototype designed to demonstrate how hyperlocal weather intelligence, street-level waterlogging monitoring, safe route suggestions, daily gig earnings tracking, rules-based fraud prevention, and Ethereum Sepolia smart contracts work together in a parametric insurance architecture.  
> All insurance policies, premium payments, coverage caps, and payouts in this prototype are **simulated and illustrative demonstration data**. No real currency, bank transfer, or operational insurance underwriting takes place.

---

## 1. Architectural Principles & Technology Restraints

Strictly engineered without frontend frameworks (No React, Angular, Vue, Next.js), without mobile runtimes (No React Native, Expo, Flutter), without TypeScript compilation, without Tailwind CSS, and without Node.js/Express backend servers:

- **Frontend Core:** Pure Semantic HTML5, CSS3 Custom Properties (Design System with Dark/Light Themes), and Vanilla ES6+ JavaScript modules.
- **Web3 & Blockchain:**
  - Four Solidity 0.8.20 smart contracts deployed on Ethereum Sepolia Testnet.
  - Ethers.js v6 integration loaded via official CDN (`https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.umd.min.js`).
  - MetaMask wallet connection handler (`window.ethereum`) with automatic Sepolia (Chain ID `11155111`) detection, network switching, and account change listeners.
  - Cryptographic policy terms hashing and verification via deterministic `keccak256`.
  - Zero PII stored on-chain: Rider identity is pseudonymized as `keccak256(riderId)`.
- **Mapping & Geolocation:** Leaflet.js and OpenStreetMap CDN integration with custom road hazard overlays and alternative route path calculations.
- **Analytics & Data Visualizations:** Chart.js CDN for 7-day earnings trends and weather disruption comparisons.
- **Voice Intelligence:** Native browser Web Speech API (`SpeechRecognition` & `speechSynthesis`) supporting Hindi, Marathi, and English with fallback text console.
- **Persistence & Portability:** High-fidelity state management via browser `localStorage` with pre-seeded demo delivery clusters (Andheri West, Bandra West, Andheri East). The application runs cleanly either by opening `index.html` directly in any modern browser (`file://`) or through any standard static HTTP server (`http://localhost`).

---

## 2. The 12 Exclusive Core Features

| # | Feature Name | Implementation Overview |
| :---: | :--- | :--- |
| **1** | **Hyperlocal Safe Route Suggestions** | Leaflet.js interactive map identifying flood hotspots (e.g. Milan Subway) and calculating a safe alternative corridor via Link Road, scoring road risks (12 vs 88). |
| **2** | **Rain Alerts** | Four-tier weather alerting (`Normal`, `Moderate Rain`, `Heavy Rain`, `Extreme Rain`) with postal PIN code targeting and Open-Meteo live API integration with mock fallback. |
| **3** | **Policy-Based Payout Calculator** | Interactive multi-factor calculator factoring event type, rainfall rate (mm/hr) or temperature (°C), disruption duration (hours), and policy coverage caps with full formula breakdowns. |
| **4** | **Multilingual Voice Assistant** | Hands-free Web Speech API assistant recognizing speech in Hindi, Marathi, and English. Queries weather alerts, active policy status, waterlogging, and estimated payouts. |
| **5** | **Claim History Dashboard** | Full lifecycle tracking across 8 distinct states (`Submitted`, `Under Review`, `Trigger Detected`, `Verification Pending`, `Approved`, `Rejected`, `Payout Processing`, `Paid`) with Sepolia Etherscan transaction links. |
| **6** | **Fraud Prevention Engine** | Deterministic 6-rule detection engine checking duplicate claims, duplicate weather events, expired policies, velocity spikes (>3 claims/week), and geo-fencing mismatches. |
| **7** | **Marathi & Hindi Support** | Centralized localization dictionary in `js/localization.js` supporting instant, reload-free runtime switching between English, Hindi (हिंदी), and Marathi (मराठी). |
| **8** | **Parametric Rainfall Coverage** | Objective parametric terms (Monsoon Shield: ≥35mm/hr for 60m; Torrential Flood Guard: ≥55mm/hr or >30cm flood depth) with zero manual paperwork requirements. |
| **9** | **Automatic Payout Workflow** | Reactive 10-step automated pipeline connecting weather anomaly detection, policy matching, fraud scoring, smart contract settlement, and simulated wallet credit. |
| **10** | **Extreme Heat & Cold Protection** | Climate anomaly coverage for severe summer heatwaves (≥42°C) and winter coldwaves (≤5°C) to compensate mandatory downtime and hydration rest. |
| **11** | **Hyperlocal Waterlogging Monitoring** | Street-level flood depth registry classifying hazard severity (`LOW`, `MODERATE`, `HIGH`, `SEVERE`) with explicit source attribution and `DEMO DATA` labels. |
| **12** | **Daily Income Tracker** | Rider daily earnings logger with Chart.js weekly trend charts, average daily wage benchmarking, and weather disruption loss comparisons against insurance caps. |

---

## 3. Project Directory Structure

```
v1/
├── index.html                   # Main portal overview & feature showcase
├── rider.html                   # Rider main dashboard (Weather, policy, voice, quick claims)
├── admin.html                   # Admin simulation console (Anomaly triggers, fraud review)
├── blockchain.html              # Web3 explorer (Contracts, MetaMask, tx logs, Etherscan, verifier)
├── claims.html                  # Claims history dashboard & lifecycle audit modal
├── routes.html                  # Hyperlocal waterlogging map & safe route suggestions
├── income.html                  # Daily earnings tracker & Chart.js disruption analytics
├── policies.html                # Insurance plan marketplace & interactive payout calculator
│
├── css/
│   ├── style.css                # Global typography, color palette, badges, buttons, shell
│   ├── dashboard.css            # Cards, tables, weather hero banner, voice mic widget
│   └── responsive.css           # Breakpoints for desktop, tablet, and mobile browsers
│
├── js/
│   ├── storage.js               # LocalStorage state persistence & seed initialization
│   ├── localization.js          # English, Hindi & Marathi translation dictionaries
│   ├── contracts-config.js      # Sepolia addresses, RPC configs & contract address manager
│   ├── abis.js                  # Full ABI definitions for all 4 contracts (JSON & Human-Readable)
│   ├── policy-hasher.js         # Deterministic canonical policy hashing & avalanche verifier
│   ├── web3.js                  # Ethers.js v6 loader, MetaMask connect, live Sepolia contract calls
│   ├── blockchain.js            # Blockchain explorer UI, transaction stream, hash verifier UI
│   ├── weather.js               # Weather engine (Open-Meteo live API + simulation engine)
│   ├── waterlogging.js          # Flood depth reports CRUD & severity classification
│   ├── routes.js                # Leaflet.js map renderer, hazard avoidance & route comparison
│   ├── income.js                # Income logger, Chart.js trends, disruption loss calculator
│   ├── insurance.js             # Policy purchase, active policy manager & on-chain hashes
│   ├── calculator.js            # Parametric payout calculator formula engine
│   ├── claims.js                # 10-Step automated payout pipeline execution
│   ├── fraud.js                 # Rules-based fraud detection engine (6 rules)
│   ├── voice.js                 # Multilingual Web Speech STT/TTS adapter
│   ├── app.js                   # Universal navigation, header, theme toggle, toast system
│   ├── rider.js                 # Rider dashboard orchestrator
│   └── admin.js                 # Admin simulation console orchestrator
│
├── contracts/
│   ├── PolicyRegistry.sol        # Policy registration, terms hash, expiry & coverage caps
│   ├── TriggerRegistry.sol       # Oracle weather trigger recording (Rain, Heat, Cold, Flood)
│   ├── ClaimManager.sol          # Claims lifecycle & duplicate prevention rules
│   ├── PayoutAuthorizer.sol      # Idempotent payout approvals & on-chain settlement
│   └── abis/                     # Deployed ABI files for Remix/Hardhat import
│       ├── PolicyRegistry.json
│       ├── TriggerRegistry.json
│       ├── ClaimManager.json
│       └── PayoutAuthorizer.json
│
├── scripts/
│   └── deploy-sepolia.js        # Formal deployment sequence & permission authorization script
│
├── tests/
│   └── web3-verification-test.js # Automated 31-point test suite for Web3 & smart contracts
│
├── data/
│   ├── riders.json               # Seed delivery partners (Zomato, Swiggy, Zepto, Blinkit)
│   ├── policies.json             # Master plans & active policy snapshot
│   ├── weather.json              # Rainfall thresholds & postal zone forecasts
│   ├── waterlogging.json         # Real Mumbai flood spots (Milan Subway, SV Road, etc.)
│   └── demo-events.json          # Pre-configured weather anomaly simulation scenarios
│
└── README.md
```

---

## 4. Web3 & Blockchain Architecture

### 4.1 On-Chain vs Off-Chain Trust Boundary

To ensure complete regulatory compliance with Indian data privacy frameworks (DPDP Act 2023) and GDPR, **zero personally identifiable information (PII) is ever written to the blockchain**.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OFF-CHAIN / PRIVATE STORAGE                           │
│  (Browser LocalStorage / Secure Private Cloud / Delivery Partner Integration)   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Rider Legal Name (e.g. Raju Sharma)                                          │
│  • Contact Details (Phone +91 98765 43210, Email)                               │
│  • Vehicle Registration Number (MH-02-CB-4821) & Driving License                │
│  • Live GPS Breadcrumbs & Historical Travel Trails                              │
│  • Daily Shift Delivery Earnings & Platform Settlement Receipts                 │
│  • Internal Bank Account / UPI VPA Payout Details                               │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Deterministic Keccak-256 Hashing &
                                       │ Pseudonymization [keccak256(riderId)]
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ON-CHAIN / PUBLIC ETHEREUM SEPOLIA (11155111)                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PolicyRegistry.sol    │ bytes32 policyHash, pseudonymousRider, limits, dates  │
│  TriggerRegistry.sol   │ bytes32 triggerEventHash, eventType, pinCode, metric   │
│  ClaimManager.sol      │ keccak256(policyId, triggerEventHash), status tracking │
│  PayoutAuthorizer.sol  │ bytes32 payoutHash, idempotent settlement records       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Solidity Smart Contracts Audit & Specifications

All four contracts are written in Solidity `^0.8.20` with `MIT` license.

### 5.1 Contract Summary

| Contract | Purpose | Key State Variables | Core Functions | Access Control |
| :--- | :--- | :--- | :--- | :--- |
| **`PolicyRegistry.sol`** | Policy terms registration, validity checking & coverage deduction | `policies`, `isAuthorizedIssuer` | `registerPolicy`, `deductCoverage`, `isPolicyValid`, `getPolicy` | `onlyOwner`, `onlyAuthorizedIssuer` |
| **`TriggerRegistry.sol`** | Oracle-attested weather anomalies | `triggers`, `isAuthorizedOracle` | `recordTrigger`, `isTriggerVerified`, `getTrigger` | `onlyOwner`, `onlyAuthorizedOracle` |
| **`ClaimManager.sol`** | Claim lifecycle & duplicate prevention | `claims`, `claimByEvent`, `isOfficer` | `registerClaim`, `updateClaimStatus`, `getClaim` | `onlyOwner`, `onlyOfficer` |
| **`PayoutAuthorizer.sol`** | Idempotent payout approvals & on-chain settlement | `payouts`, `policyRegistry`, `claimManager` | `authorizePayout`, `isPayoutAuthorized`, `getPayout` | `onlyOwner`, `onlyAuthorizedApprover` |

### 5.2 Inter-Contract Security & Permissions

1. **`PayoutAuthorizer` calls `PolicyRegistry.deductCoverage`:**
   - In `PolicyRegistry.sol`, `deductCoverage` is guarded by the `onlyAuthorizedIssuer` modifier.
   - Therefore, `PayoutAuthorizer` must be whitelisted via `PolicyRegistry.setAuthorizedIssuer(payoutAuthorizerAddress, true)`.
2. **`PayoutAuthorizer` calls `ClaimManager.updateClaimStatus`:**
   - In `ClaimManager.sol`, `updateClaimStatus` is guarded by the `onlyOfficer` modifier.
   - Therefore, `PayoutAuthorizer` must be whitelisted via `ClaimManager.setOfficer(payoutAuthorizerAddress, true)`.
3. **Compound Key Duplicate Claim Prevention:**
   - In `ClaimManager.sol`, every claim is indexed by `claimByEvent[policyId][triggerEventHash]`. Any attempt to file a second claim for the same policy against the same weather event reverts with `"Duplicate claim for this trigger"`.
4. **Idempotent Payout Authorization:**
   - In `PayoutAuthorizer.sol`, re-submitting a payout with an existing `payoutHash` reverts with `"Payout already authorized"`.

---

## 6. Smart Contract Deployment Guide (Ethereum Sepolia)

### 6.1 Prerequisites
1. MetaMask browser extension installed.
2. Ethereum Sepolia testnet ETH from a public faucet:
   - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

### 6.2 Deployment Sequence & Dependencies

Deploy the contracts in the following exact order:

```
Step 1: Deploy PolicyRegistry.sol
Step 2: Deploy TriggerRegistry.sol
Step 3: Deploy ClaimManager.sol (Pass PolicyRegistry & TriggerRegistry addresses)
Step 4: Deploy PayoutAuthorizer.sol (Pass PolicyRegistry & ClaimManager addresses)
Step 5: Authorize PayoutAuthorizer on PolicyRegistry & ClaimManager
```

### 6.3 Deployment via Remix IDE

1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a workspace and import the four `.sol` files from the `contracts/` directory:
   - `PolicyRegistry.sol`
   - `TriggerRegistry.sol`
   - `ClaimManager.sol`
   - `PayoutAuthorizer.sol`
3. Under **Solidity Compiler**:
   - Compiler: `0.8.20`
   - EVM Version: `default (shanghai/cancun)`
   - Enable Optimization: `200 runs`
   - Click **Compile** on each contract.
4. Under **Deploy & Run Transactions**:
   - Environment: Select **Injected Provider - MetaMask**.
   - Ensure MetaMask is switched to **Sepolia (Chain ID 11155111)**.
5. **Execute Deployments:**
   - **Contract 1:** Select `PolicyRegistry` → Click `Deploy`.  
     *Record Address:* `0xPOLICY_REGISTRY_ADDRESS`
   - **Contract 2:** Select `TriggerRegistry` → Click `Deploy`.  
     *Record Address:* `0xTRIGGER_REGISTRY_ADDRESS`
   - **Contract 3:** Select `ClaimManager`.  
     *Constructor Arguments:* `_policyRegistry = 0xPOLICY_REGISTRY_ADDRESS`, `_triggerRegistry = 0xTRIGGER_REGISTRY_ADDRESS` → Click `Deploy`.  
     *Record Address:* `0xCLAIM_MANAGER_ADDRESS`
   - **Contract 4:** Select `PayoutAuthorizer`.  
     *Constructor Arguments:* `_policyRegistry = 0xPOLICY_REGISTRY_ADDRESS`, `_claimManager = 0xCLAIM_MANAGER_ADDRESS` → Click `Deploy`.  
     *Record Address:* `0xPAYOUT_AUTHORIZER_ADDRESS`
6. **Execute Post-Deployment Permissions (CRITICAL):**
   - On deployed `PolicyRegistry`: Call `setAuthorizedIssuer(0xPAYOUT_AUTHORIZER_ADDRESS, true)`.
   - On deployed `ClaimManager`: Call `setOfficer(0xPAYOUT_AUTHORIZER_ADDRESS, true)`.
7. **Configure Frontend:**
   - Open `blockchain.html` in your browser.
   - In the **Custom Contract Address Configuration** section, paste the deployed addresses and click **"Save & Connect Custom Contracts"**.
   - Alternatively, edit `js/contracts-config.js` directly.

---

## 7. Deterministic Policy Hashing & Avalanche Effect

### 7.1 Canonical Normalization Protocol
To guarantee that identical policy terms always yield identical cryptographic hashes across any operating system or programming environment, `js/policy-hasher.js` implements a strict canonical normalization standard:

1. **Deterministic Key Sorting:** All object keys are sorted alphabetically.
2. **Standardized Units:** Dates are converted to Unix timestamps (seconds since epoch, integer numbers).
3. **Identity Pseudonymization:** Personal details are hashed: `pseudonymousRider = keccak256(riderId)`.
4. **Canonical JSON Serialization:** Stringified without extraneous whitespace.

### 7.2 Avalanche Effect Verification
The Keccak-256 algorithm ensures that any unauthorized modification of policy terms—even changing a single digit—produces an entirely distinct hash:

- **Original Terms (Coverage Limit: ₹5,000):**  
  `Hash: 0x3089e3b8ff23db1b75fa599bc5943a41b538724d209be35f609e257cfc239458`
- **Tampered Terms (Coverage Limit: ₹5,001 — single unit change):**  
  `Hash: 0x7003b30e17fc30a47eb9f81df9e2c6509f61b0453303d27457d1fc06b4b2cb0f`
- **Tamper Detection:**  
  When an altered policy is presented for claims processing, the calculated hash does not match the on-chain registry, immediately reverting the transaction with `HASH_TAMPERED_OR_NOT_FOUND`.

---

## 8. Failure & Edge Case Handling Matrix

The Web3 integration in `js/web3.js` provides graceful handling and diagnostic feedback for all common failure modes:

| Failure Mode | Trigger / Condition | Web3 Code | User / UI Feedback |
| :--- | :--- | :--- | :--- |
| **User Rejection** | User clicks "Reject" in MetaMask popup | `ACTION_REJECTED` (4001) | Friendly notice: *"Transaction rejected by user. The operation was cancelled without spending gas."* |
| **Insufficient Gas** | Wallet balance too low for Sepolia gas | `-32000` / `INSUFFICIENT_FUNDS` | Informative prompt with direct links to free Sepolia faucets. |
| **Wrong Network** | User is on Mainnet, Polygon, or Arbitrum | Chain ID != `11155111` | Modal request: *"Please switch to Ethereum Sepolia Testnet (Chain ID 11155111)"* with automatic `wallet_switchEthereumChain` request. |
| **Duplicate Claim** | Attempting to file second claim for same event | `ClaimManager` Revert | Anti-Fraud alert: *"Duplicate claim detected for this weather trigger. Compound key already exists on-chain."* |
| **Expired Policy** | Filing claim after policy expiry timestamp | `PolicyRegistry` Revert | Claim rejection: *"Policy expired on [date]. Parametric claims can only be filed during active coverage window."* |
| **Tampered Policy Terms** | Policy coverage altered in client localStorage | Hash mismatch | Security alert: *"Policy terms do not match on-chain cryptographic registry. Transaction aborted."* |
| **No MetaMask Installed** | Browser lacks Web3 injection (`window.ethereum`) | `NO_PROVIDER` | Banner notice: *"MetaMask not detected. Seamlessly falling back to verified Simulation Mode."* |

---

## 9. Comprehensive Round 2 Judge Walkthrough Script (14 Steps)

This script provides an exact 5-to-7 minute demonstration path designed specifically for Bajaj evaluators and hackathon judges.

### Step 1: Portal Overview & Regulatory Framing
- **Action:** Open `index.html`.
- **Narration:** *"Welcome to VarshaRakshak — Smart Parametric Insurance for Every Delivery Partner. This prototype demonstrates how hyperlocal weather telemetry, street-level flood monitoring, and Ethereum Sepolia smart contracts create transparent, zero-paperwork income protection for gig riders."*
- **Visual:** Point to the active rider profile (*Raju Sharma, Zomato Partner in Andheri West PIN 400053*) and the prominent regulatory simulation disclaimers.

### Step 2: Rider Real-Time Operations
- **Action:** Click **"Open Rider Dashboard"** or navigate to `rider.html`.
- **Narration:** *"The rider sees their real-time working status: today's income (₹750), active Monsoon Shield policy with ₹4,250 coverage remaining, and local weather telemetry showing Moderate Rain (14 mm/hr)."*

### Step 3: Hyperlocal Hazard Avoidance Map
- **Action:** Scroll down to the safe route map on `rider.html` (or open `routes.html`).
- **Narration:** *"VarshaRakshak ingests real-time waterlogging reports. Here, the direct route through Milan Subway is blocked by 48cm severe waterlogging with an 88/100 risk score. The system automatically computes a safe alternative via Link Road with only 12/100 risk, keeping the rider out of danger."*

### Step 4: Multilingual Voice Assistant
- **Action:** Click the microphone icon 🎤 on the dashboard or type in the voice console: *"Aaj barish ka alert hai kya?"*
- **Narration:** *"For riders on motorcycles, hands-free voice interaction is essential. The Web Speech API provides real-time spoken guidance in Hindi, Marathi, and English."*
- **Visual:** Notice the transcribed reply and voice audio synthesis informing the rider about rainfall levels.

### Step 5: Instant Language Switching (Marathi & Hindi)
- **Action:** Click the language selector in the top navbar and switch to **मराठी (Marathi)**, then **हिंदी (Hindi)**.
- **Narration:** *"Localization is 100% client-side and instantaneous without reloading the page, ensuring full accessibility for grassroots gig workers."*

### Step 6: Interactive Parametric Payout Calculator
- **Action:** Navigate to `policies.html` and scroll to the **Parametric Payout Calculator**.
- **Narration:** *"Parametric insurance eliminates adjusters and claim forms. Riders can test exact triggers: entering 60 mm/hr rainfall over 2.5 hours immediately calculates the exact compensation of ₹625 based on transparent formulas."*

### Step 7: Explore Blockchain Architecture & Contracts
- **Action:** Navigate to **Blockchain Explorer** (`blockchain.html`).
- **Narration:** *"Here is our Web3 architecture. Notice the four Solidity smart contracts deployed for PolicyRegistry, TriggerRegistry, ClaimManager, and PayoutAuthorizer. We strictly enforce zero PII on-chain: rider identities are pseudonymized, and only cryptographic hashes and numerical parameters touch the ledger."*

### Step 8: Policy Hash & Avalanche Effect Verification
- **Action:** Scroll to the **"Cryptographic Policy Hash Verifier"** on `blockchain.html`.
- **Narration:** *"Every policy has a unique Keccak-256 hash. Click 'Demonstrate Avalanche Effect (Tamper Simulation)'. Notice that changing the coverage limit by just ₹1 from ₹5,000 to ₹5,001 completely mutates the hash from 0x3089... to 0x7003... Any tampered policy will be instantly rejected on-chain."*

### Step 9: MetaMask Wallet Connection (Dual Operating Modes)
- **Action:** Click the **"Connect MetaMask"** button in the header or on `blockchain.html`.
- **Narration:** *"VarshaRakshak supports dual operating modes. In Simulation Mode, it provides full deterministic testing without gas. When MetaMask is connected on Ethereum Sepolia (Chain ID 11155111), the application interacts directly with live testnet contracts."*
- **Visual:** Show wallet address pill and Sepolia network badge.

### Step 10: Trigger Severe Cloudburst Simulation
- **Action:** Navigate to `admin.html` (or click "Simulate Heavy Rain Event" on `rider.html`).
- **Narration:** *"Now, let us simulate a severe monsoon cloudburst in Mumbai. In the Admin Simulation console, we trigger the 'Mumbai Torrential Cloudburst' scenario: 62.5 mm/hr rainfall in Andheri West PIN 400053."*

### Step 11: Observe the 10-Step Automated Claim Pipeline
- **Action:** Click **"Simulate & Ingest Event"** and watch the live execution modal.
- **Narration:** *"Watch the autonomous 10-step pipeline in real time:*
  1. *Weather anomaly ingested from simulated Oracle.*
  2. *Raju's active policy matched in PIN 400053.*
  3. *Threshold breached (62.5 mm/hr ≥ 35 mm/hr).*
  4. *Disruption payout calculated: ₹750.*
  5. *Fraud Prevention Engine executes 6 checks (Velocity, GPS, Expiry, Duplicates) — Risk score: 0/100 (PASSED).*
  6. *Claim created and registered.*
  7. *Trigger recorded on TriggerRegistry.*
  8. *Payout authorized via PayoutAuthorizer.*
  9. *Rider simulated wallet credited immediately.*
  10. *Claim status finalized as PAID."*

### Step 12: Anti-Fraud Engine Demonstration
- **Action:** On `admin.html`, immediately click the same trigger button again.
- **Narration:** *"What happens if a rider attempts to claim twice for the same storm? The fraud engine immediately intercepts it! Rule 1 flags a duplicate event hash, scoring a risk of 90/100 and auto-rejecting the claim before on-chain execution."*

### Step 13: Verify On-Chain Transaction & Etherscan
- **Action:** Return to `blockchain.html` and filter transactions by **"ALL"** or **"LIVE"**.
- **Narration:** *"Every transaction is logged with its transaction hash, block number, gas used, and function signature. Clicking the Etherscan icon opens the transaction directly on sepolia.etherscan.io."*

### Step 14: Daily Income Protection & Disruption Analytics
- **Action:** Navigate to `income.html`.
- **Narration:** *"Finally, the Income Tracker proves the ultimate value proposition: the rider's weekly earnings chart highlights the weather disruption gap and demonstrates how the ₹750 parametric payout restored their target daily wage of ₹1,000, keeping their livelihood secure."*

---

## 10. Technical Defense Q&A for Evaluators

### Q1: How do you prevent high Ethereum gas fees from making micro-insurance uneconomical?
> **Answer:** In a commercial production rollout, the smart contracts are architected for deployment on Ethereum Layer 2 rollups (such as Arbitrum, Base, or Polygon PoS), where transaction fees are fractions of a cent ($0.001–$0.01). Furthermore, policies and triggers can be batched using Merkle roots (EIP-712 typed data signatures), requiring only a single on-chain root update for thousands of daily policies while maintaining individual cryptographic provability.

### Q2: What prevents weather data manipulation or compromised Oracle feeds?
> **Answer:** In our architecture, the `TriggerRegistry` accepts triggers only from authorized oracle accounts. In production, this integrates decentralized oracle networks such as Chainlink Any API / Decentralized Data Feeds, aggregating multiple independent weather providers (Open-Meteo, IMD, AccuWeather). A multi-signature threshold is required to post a severe anomaly, preventing any single point of failure.

### Q3: How do you handle privacy and GDPR / DPDP compliance with an immutable public ledger?
> **Answer:** We enforce a strict on-chain / off-chain segregation model. Zero PII ever touches the blockchain. Personal identities are stored strictly off-chain and referenced on-chain solely via one-way cryptographic hashes (`keccak256(riderId)`). If a rider requests data deletion under the DPDP Act 2023, their off-chain profile is erased, rendering the pseudonymized hash on-chain permanently anonymized and un-linkable to any natural person.

### Q4: Why use parametric insurance instead of indemnity insurance for gig workers?
> **Answer:** Traditional indemnity insurance requires physical damage proof, police reports, surveyor visits, and takes weeks or months to settle. A gig rider losing ₹500 in daily wages due to a 3-hour monsoon cloudburst cannot afford adjusters or waiting periods. Parametric insurance relies on objective, verifiable triggers (e.g. >35 mm/hr rain) that settle autonomously in seconds, protecting immediate daily cash flow.

### Q5: What happens if a rider's phone battery dies or internet disconnects during a flood?
> **Answer:** Because the system is **parametric and oracle-driven**, claims are not dependent on rider submission during the storm. The centralized Oracle engine monitors active delivery zones. When a threshold breach is recorded for PIN 400053, all active policies in that zone are automatically credited, ensuring riders receive their payouts even if their mobile devices were offline during the disruption.

---

## 11. Automated Test Suite Execution

The repository includes a comprehensive 31-point headless verification test suite in `tests/web3-verification-test.js`.

To run the verification suite:
```bash
node tests/web3-verification-test.js
```

### Verification Output:
```
==================================================================
   VARSHARAKSHAK — ROUND 2 WEB3 & BLOCKCHAIN TEST SUITE
==================================================================

[TEST 1] Auditing Solidity Smart Contracts Structure & Syntax...
  ✓ PASS: Contract file exists: PolicyRegistry.sol
  ✓ PASS: PolicyRegistry.sol has MIT license identifier
  ✓ PASS: PolicyRegistry.sol specifies Solidity 0.8.20 compiler
  ✓ PASS: PolicyRegistry.sol has zero PII on-chain
  ✓ PASS: Contract file exists: TriggerRegistry.sol
  ✓ PASS: TriggerRegistry.sol has MIT license identifier
  ✓ PASS: TriggerRegistry.sol specifies Solidity 0.8.20 compiler
  ✓ PASS: TriggerRegistry.sol has zero PII on-chain
  ✓ PASS: Contract file exists: ClaimManager.sol
  ✓ PASS: ClaimManager.sol has MIT license identifier
  ✓ PASS: ClaimManager.sol specifies Solidity 0.8.20 compiler
  ✓ PASS: ClaimManager.sol has zero PII on-chain
  ✓ PASS: Contract file exists: PayoutAuthorizer.sol
  ✓ PASS: PayoutAuthorizer.sol has MIT license identifier
  ✓ PASS: PayoutAuthorizer.sol specifies Solidity 0.8.20 compiler
  ✓ PASS: PayoutAuthorizer.sol has zero PII on-chain

[TEST 2] Testing Deterministic Policy Hashing & Avalanche Effect...
  ✓ PASS: Policy hashing is 100% deterministic regardless of input key ordering
  ✓ PASS: Avalanche effect verified: changing coverage ₹5000->₹5001 completely altered hash (0x3089e3b8... vs 0x7003b30e...)

[TEST 3] Validating ABIs & Sepolia Network Configuration...
  ✓ PASS: Sepolia chain ID 11155111 defined in config
  ✓ PASS: Sepolia hex chain ID 0xaa36a7 defined in config
  ✓ PASS: PolicyRegistry ABI contains registerPolicy
  ✓ PASS: TriggerRegistry ABI contains recordTrigger
  ✓ PASS: ClaimManager ABI contains registerClaim
  ✓ PASS: PayoutAuthorizer ABI contains authorizePayout

[TEST 4] Testing Fraud Prevention & Duplicate Claim Detection...
  ✓ PASS: Fraud Engine rejects duplicate claim for identical weather event
  ✓ PASS: Duplicate claim is classified as auto-rejected (Risk Score >= 80)
  ✓ PASS: Fraud Engine rejects claims submitted against expired policies

[TEST 5] Testing Web3 Failure Handlers & Informative Messages...
  ✓ PASS: Web3 module includes parseContractError handler
  ✓ PASS: Web3 handles code 4001 user cancellation gracefully
  ✓ PASS: Web3 handles gas exhaustion with informative faucet instructions
  ✓ PASS: Web3 verifies chain ID 11155111 before live execution

==================================================================
TEST SUMMARY: 31 PASSED, 0 FAILED
==================================================================
✓ All Web3, Solidity, Anti-Fraud and Cryptographic tests PASSED successfully!
```

---

## 12. Transparent Status & Project Limitations

- **Smart Contracts:** Fully coded, audited, and compatible with Solidity `^0.8.20`. Individual ABIs and deployment scripts are provided in `contracts/abis/` and `scripts/deploy-sepolia.js`.
- **Live Sepolia vs Simulation Mode:** Live on-chain execution requires a MetaMask user wallet funded with Sepolia test ETH. When contracts are not yet deployed or gas is unavailable, the application operates in **Simulation Mode**, providing full deterministic cryptographic hashing and automated claim lifecycle demonstrations with zero false claims or broken states.
- **Regulatory Nature:** As stated throughout the product, this is an illustrative technology prototype built to showcase parametric and Web3 capabilities for delivery partners. Real-world commercial underwriting requires licensed insurance entities and IRDAI sandbox regulatory approvals.
# versa



#Comtributor
1. Paritosh Singh
