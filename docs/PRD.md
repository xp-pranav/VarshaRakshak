# Product Requirements Document (PRD)
## VarshaRakshak — Smart Insurance for Every Delivery Rider
**Project Code:** VR-BAJAJ-2026  
**Document Version:** 1.0.0 (Milestone 0)  
**Status:** Approved for Implementation  
**Target Delivery Platforms:** Mobile (Android/iOS via Expo React Native), Web & Admin Portal (Next.js TypeScript)

---

## 1. Executive Summary & Vision

### 1.1 Product Identity
- **Product Name:** VarshaRakshak (वर्षा रक्षक / Varsha Rakshak)
- **Tagline:** Smart Insurance for Every Delivery Rider.
- **Product Category:** Hyperlocal Parametric Weather Insurance & Rider Safety Intelligence.
- **Sponsor / Initiative:** Bajaj Technology Project Prototype.
- **Primary Value Proposition:** Protect gig-economy delivery riders from catastrophic income disruption caused by hyperlocal torrential rain, severe waterlogging, flash floods, and extreme temperature conditions through automated parametric evaluation, transparent blockchain-backed verification, real-time safe route navigation, and instant simulated payouts.

### 1.2 Target Audience
1. **Food Delivery Partners:** Zomato, Swiggy, EatClub riders.
2. **Quick Commerce Partners:** Blinkit, Zepto, Instamart, BB Now riders.
3. **E-Commerce & Courier Riders:** Amazon Flex, Flipkart, Shadowfax, Porter, Dunzo delivery riders.
4. **Operations & Claims Administrators:** Bajaj claims officers, risk analysts, operations supervisors, and finance teams.

### 1.3 Disclaimer & Regulatory Stance (MVP Scope)
> **IMPORTANT REGULATORY NOTICE:**  
> VarshaRakshak is a demonstration MVP prototype developed for demonstration and technology validation. All insurance policies, premium collections, coverage terms, claim evaluations, and payouts are illustrative and simulated. Real insurance underwriting, policy issuance, risk retention, and claim disbursements must only be executed through an authorized, IRDAI-licensed insurance partner (e.g., Bajaj Allianz General Insurance) via compliant enterprise integrations. Simulated payouts use an internal ledger and testnet blockchain references; no fiat/UPI money transfers occur in this prototype.

---

## 2. Core Problem & Market Opportunity

Gig delivery workers are remunerated per delivery or hourly surge rates. In Indian metropolitan regions (such as Mumbai, Pune, Bengaluru, Delhi NCR, Chennai):
1. **Monsoon & Flash Floods:** Heavy rain (>50mm in 2 hours) waterlogs roads, creates vehicle breakdowns, causes route gridlocks, or prompts platform apps to pause operations, causing zero daily earnings.
2. **Lack of Hyperlocal Risk Awareness:** Generic municipal weather forecasts do not capture street-level waterlogged underpasses, potholes, or flooded arterial roads.
3. **Traditional Insurance Failure:** Traditional indemnity insurance requires proof of physical loss, paper bills, Surveyor inspections, and takes weeks. It never covers lost daily working wage due to bad weather.
4. **Parametric Insurance Advantage:** Pre-agreed triggers (e.g., Rainfall > 45mm/hr in PIN code 400053 between 14:00 and 17:00) automatically trigger pre-calculated compensation directly to the rider's balance, verified on Ethereum Sepolia public ledger for tamper-proof transparency.

---

## 3. The 12 Exclusive Core Features

### Feature 1: Hyperlocal Safe Route Suggestions
- **Functionality:** Map-based routing interface evaluating road segments against active weather and waterlogging reports.
- **Capabilities:**
  - Secure permission-gated rider geolocation tracking.
  - Interactive route preview between origin and delivery destination.
  - Overlay of active waterlogging zones (color-coded by severity: Low, Moderate, High, Severe).
  - Identification of rainfall-affected streets.
  - Dynamic alternative route recommendation avoiding flood hotspots.
  - Route metrics: Distance (km), estimated duration (mins), risk score (0-100), and human-readable explanation (e.g., *"Alternative route via Link Road avoids severe waterlogging at Milan Subway"*).
  - Clear label: **"DEMO DATA"** on all simulated road hazard overlays.

### Feature 2: Rain Alerts
- **Functionality:** Real-time push & in-app alerts based on rider's active PIN code and GPS coordinates.
- **Severity Levels:**
  - `Normal` (0 - 5 mm/hr): Safe conditions.
  - `Moderate Rain` (5 - 25 mm/hr): Caution advised, wet roads.
  - `Heavy Rain` (25 - 60 mm/hr): High disruption risk; parametric triggers monitoring.
  - `Extreme Rain` (> 60 mm/hr): Red alert; delivery halt recommended; automated claim trigger evaluation initiated.
- **Metadata:** Affected PIN codes, duration forecast, precipitation volume, timestamp, safety recommendations.

### Feature 3: Policy-Based Payout Calculator
- **Functionality:** Interactive tool for riders to calculate estimated compensation for past or hypothetical weather events.
- **Inputs:** Active Policy ID, Event Type (Rainfall, Heatwave, Coldwave), Recorded Weather Intensity (mm or °C), Event Duration (hours), Affected PIN code.
- **Evaluation Criteria:**
  - Policy active status and validity window.
  - Waiting period clearance (e.g., 24h from purchase).
  - Geographic eligibility (PIN code match).
  - Tiered benefit formula: $Compensation = \min(\text{TierBenefit}(\text{Severity}, \text{Duration}), \text{RemainingCoverageLimit})$.
  - Clear breakdown of daily wage base, severity multiplier, deductible, and remaining policy balance.
  - Prominent disclaimer: *"Calculated compensation is an estimate until confirmed by automated parametric claim validation."*

### Feature 4: Multilingual Voice Assistant
- **Supported Languages:** English, Hindi (हिंदी), and Marathi (मराठी).
- **Core Intents:**
  1. `check_weather`: "Aaj ka mausam kaisa hai?" / "हवामान कसे आहे?"
  2. `check_rain_alert`: "Barish ka alert hai kya?" / "पावसाचा इशारा आहे का?"
  3. `check_waterlogging`: "Kidhar paani bhara hai?" / "कुठे पाणी साचले आहे?"
  4. `check_policy_status`: "Mera insurance active hai?" / "माझे पॉलिसी स्टेटस काय आहे?"
  5. `calculate_payout`: "2 ghante heavy rain hua toh kitna milega?" / "२ तास मुसळधार पाऊस झाला तर किती भरपाई मिळेल?"
  6. `check_claims`: "Mera claim pass hua kya?" / "माझा क्लेम मंजूर झाला का?"
  7. `safety_advice`: "Surakshit rasta batao" / "सुरक्षित रस्ता सांगा"
- **Architecture:** Web Speech API / native STT adapter, regex + keyword intent parser with semantic fallback, localized response generation, and TTS synthesis. Guarded: Voice assistant cannot directly disburse funds or override claim approvals without authorized backend execution.

### Feature 5: Claim History Dashboard
- **Lifecycle Statuses:**
  - `Submitted` -> `Under Review` -> `Trigger Detected` -> `Verification Pending` -> `Approved` / `Rejected` -> `Payout Processing` -> `Paid`.
- **Display Fields:** Unique Claim ID, Policy ID, Trigger Event Type, Recorded Weather Metrics, Evaluation Timestamp, Approved Amount, Internal Payout Ref, Ethereum Sepolia Tx Hash, Etherscan link, and audit log notes.

### Feature 6: Rules-Based Fraud Prevention Engine
- **Automated Detection Rules:**
  1. *Duplicate Claim:* Multiple claims for the same policy under the same weather event ID.
  2. *Duplicate Weather Event:* Re-submitting identical coordinates/timestamps.
  3. *Policy Expiry Violation:* Claims on policies expired before the event timestamp.
  4. *Velocity / Frequency Abuse:* Exceeding max claim limits per rider per rolling 7-day window.
  5. *Geographic Mismatch:* Rider GPS coordinates inconsistent with claimed affected PIN code.
  6. *Reused Evidence:* Reusing photo or telemetry proof hashes.
  7. *Unauthorized Overrides:* Non-whitelisted attempts to invoke payout APIs.
- **Admin Workflow:** Flags classified into `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Suspicious claims flagged for Claims Officer manual review rather than immediate auto-rejection, keeping full audit logs.

### Feature 7: Full Hindi & Marathi Localization (i18n)
- Seamless switching between English, Hindi, and Marathi with zero page reload.
- Comprehensive translations covering all 22 screens, navigation tabs, error messages, toast alerts, status badges, voice prompts, and disclaimer footers.

### Feature 8: Configurable Parametric Rainfall Coverage
- Parametric policy templates:
  - *Standard Monsoon Shield:* 30 mm/hr threshold, 2-hour window, max ₹1,000/day.
  - *Torrential Flood Guard:* 60 mm/hr threshold, 1-hour window, max ₹2,500/day.
  - *Zepto/Blinkit Ultra-Fast Delivery Guard:* 20 mm/hr threshold, 1-hour window, max ₹600/day.
- Clear exclusions (curfew, vehicle mechanical defect unrelated to rain, claims outside registered zone).

### Feature 9: Automated Parametric Evaluation & Simulated Payout
- 14-step automated processing pipeline:
  1. Ingest weather event from provider/simulator.
  2. Authenticate source & timestamp signature.
  3. Map affected geo-coordinates to PIN code polygon.
  4. Query active policies registered in target PIN code.
  5. Evaluate trigger rules (intensity, duration, threshold).
  6. Verify policy exclusion criteria and waiting period.
  7. Run fraud prevention checks (duplicate event/claim, velocity).
  8. Calculate eligible compensation amount.
  9. Generate deterministic `ClaimEvaluation` record.
  10. Create internal payout authorization with idempotency token.
  11. Submit payout authorization hash to Ethereum Sepolia smart contract.
  12. Execute internal ledger credit to rider demo balance.
  13. Update claim record to `PAID` with blockchain transaction reference.
  14. Dispatch push & in-app notification to the rider.

### Feature 10: Extreme Heat and Cold Protection
- **Summer Heatwave Guard:** Triggered when ambient temperature exceeds 42°C for ≥ 3 consecutive hours.
- **Winter Coldwave Guard:** Triggered when ambient temperature drops below 5°C in northern delivery zones.
- Provides health-break compensation and hydration hazard allowance.

### Feature 11: Hyperlocal Waterlogging Monitoring
- Interactive map interface showing live & simulated waterlogging spots.
- Severity levels:
  - `LOW`: 6–12 inches (Passable for heavy two-wheelers, slippery).
  - `MODERATE`: 12–24 inches (Silencer submerged risk, avoid low mopeds).
  - `HIGH`: 24–36 inches (Engine stall risk, dangerous underpass).
  - `SEVERE`: > 36 inches (Impassable road, life hazard, delivery suspended).
- Data source tags: `OFFICIAL_MUNICIPAL`, `ADMIN_VERIFIED`, `RIDER_REPORTED`, `DEMO_SIMULATION`.

### Feature 12: Daily Income & Disruption Tracker
- Rider earnings logging interface:
  - Daily gross earnings, order count, hours logged, platform (Zomato, Swiggy, Blinkit, Zepto).
  - Aggregated daily, weekly, and monthly earning trends with interactive charts.
  - Calculated average hourly earnings.
  - Weather disruption loss estimation ($LostWage = AvgHourlyWage \times HoursDisrupted$).
  - Direct comparison with parametric insurance payout eligibility.
  - Clear label distinguishing Rider-Reported Income vs System-Calculated Disruption.

---

## 4. Platform Screens & User Journeys

### 4.1 Rider Application Screens (22 Screens)
1. `Splash Screen` (Branded Bajaj & VarshaRakshak splash with animation)
2. `Welcome / Onboarding Screen` (Value prop walkthrough)
3. `Login Screen` (Mobile number / Demo rider quick-login)
4. `Registration Screen` (Name, vehicle type, delivery platform selection)
5. `OTP Verification Screen` (Interactive 6-digit verification)
6. `Rider Profile Screen` (Platform ID, vehicle details, emergency contact)
7. `PIN Code Verification Screen` (Primary operational delivery zone)
8. `Main Dashboard` (Active status, weather snapshot, quick actions, earnings)
9. `Weather and Rain Alerts Screen` (Live radars, warnings, PIN forecasts)
10. `Safe Route Suggestions Screen` (Map navigation, hazard bypass, route score)
11. `Waterlogging Map Screen` (Interactive street-level waterlogging map)
12. `Daily Income Tracker Screen` (Earnings log, weekly charts, disruption stats)
13. `Insurance Plans Marketplace Screen` (Plan catalog, terms, pricing)
14. `Policy Details Screen` (Active policy card, coverage limit, expiry, terms)
15. `Payout Calculator Screen` (Interactive simulation slider & formulas)
16. `Claim History Screen` (Timeline list of past claims and statuses)
17. `Individual Claim Details Screen` (Full breakdown, weather proof, tx hash)
18. `Payout History Screen` (Ledger of simulated credits, balance, receipts)
19. `Voice Assistant Screen` (Multilingual voice interface with mic & TTS)
20. `Language Settings Screen` (English, Hindi, Marathi selector)
21. `Notification Centre Screen` (Weather alerts, claim updates, security notices)
22. `General Settings Screen` (Theme toggle, permissions, offline mode, about)

### 4.2 Admin Portal Modules (11 Modules)
1. `Executive Overview Dashboard` (KPIs, active riders, claim volume, payout tally)
2. `Weather Management & Simulation Engine` (Inject mock weather, threshold tuning)
3. `Waterlogging Management` (CRUD reports, severity verification, PIN mapping)
4. `Route and Location Management` (PIN code serviceability boundaries)
5. `Policy Plan Management` (Create/edit plans, trigger rules, deductible versioning)
6. `Claims Management Console` (Review queue, evidence inspection, approve/reject)
7. `Payout Operations` (Ledger overview, manual retry, transaction receipts)
8. `Fraud Detection & Audit Console` (Suspicious claim queue, risk scoring)
9. `Blockchain Sepolia Explorer` (Contract state, tx log, Etherscan link viewer)
10. `Income & Disruption Analytics` (Macro trends across delivery platforms)
11. `User & Role-Based Access Control` (Super Admin, Claims Officer, Auditor)

---

## 5. Non-Negotiable Operational Constraints
1. **Strict Type Safety:** 100% TypeScript with Zod runtime validation.
2. **Idempotency:** Unique idempotency keys on all claim creation and payout operations to prevent duplicate disbursements.
3. **Audit Trail:** Every state change in claims, policies, and payouts logged to `audit_logs`.
4. **Privacy & Security:** Zero PII on Ethereum blockchain; only cryptographic hashes (`keccak256`) and alphanumeric UUID references stored on-chain.
5. **Clear Data Attribution:** All mock weather and simulated hazards explicitly labeled with **DEMO DATA** badges in user interfaces.
