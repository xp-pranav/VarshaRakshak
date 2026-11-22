# VarshaRakshak — Features & Live Demonstration Guide
**Judge-Focused Feature Catalog & Exact Step-by-Step Demo Script**  
*Bajaj Technology Prototype • Judge Briefing Document 4*

---

## 1. Feature Catalog (Judge-Friendly Overview)

### Feature 1: Instant Rider Onboarding & Identity
- **Judge Summary:** A frictionless 6-step progressive registration flow designed for mobile phones. Riders input their vehicle type, delivery platform (Zomato/Swiggy/Zepto/Blinkit), and operating PIN code.
- **Behind the Scenes:** Backed by Supabase Auth with Row Level Security. All new registrations automatically receive the `RIDER` role, preventing unauthorized access to administrative functions.

### Feature 2: Strict 7-Day Weekly Micro-Insurance Plans
- **Judge Summary:** Flexible weekly coverage matching gig workers' weekly paychecks. Riders choose from three transparent, fixed-price plans:
  - **Basic Shield (₹49/week):** Essential rainfall coverage ($\ge 35\text{ mm/hr}$), up to ₹2,500 total weekly protection.
  - **Standard Shield (₹69/week):** Comprehensive coverage for heavy rain, cloudbursts ($\ge 55\text{ mm/hr}$), extreme heat ($\ge 42^\circ\text{C}$), and extreme cold ($\le 5^\circ\text{C}$), up to ₹5,000 total weekly protection.
  - **Premium Shield (₹99/week):** Maximum coverage including street waterlogging depth ($\ge 25\text{ cm}$), zero waiting period, and priority settlement, up to ₹8,000 total weekly protection.
- **Behind the Scenes:** Premiums are bounded by smart contract constraints (`require(premium >= 49 && premium <= 99)`), preventing arbitrary price manipulation.

### Feature 3: Hyperlocal Safe Route Radar & Hazard Avoidance
- **Judge Summary:** An interactive map displaying active delivery corridors, street-level flood risks, and waterlogging alerts.
- **Behind the Scenes:** Powered by Leaflet.js with dynamic risk scoring (0–100) and color-coded road segment alerts, advising riders on safe bypass routes (e.g., avoiding submerged underpasses).

### Feature 4: Real-Time Weather Monitoring & Cloudburst Alerts
- **Judge Summary:** Continuous tracking of precipitation rate, temperature, humidity, and wind speed in the rider's active postal code.
- **Behind the Scenes:** Pulls live telemetry from OpenWeatherMap and Open-Meteo APIs, displaying severity badges (*Normal, Moderate, Heavy, Extreme*).

### Feature 5: Hands-Free Multilingual Voice Assistant
- **Judge Summary:** Blue-collar riders cannot easily type on rain-splattered smartphone screens with gloved or wet hands. The voice assistant allows riders to speak in their native tongue:
  - Hindi: *"Aaj barish ka alert hai kya?"*
  - Marathi: *"माझे पॉलिसी स्टेटस काय आहे?"*
  - English: *"Check my claim status."*
- **Behind the Scenes:** Uses Web Speech API SpeechRecognition (STT) and SpeechSynthesis (TTS) with regex and keyword intent parsing.

### Feature 6: 10-Step Automated Parametric Claim Evaluation
- **Judge Summary:** Zero claim adjusters, zero paperwork. When an extreme weather event is recorded, the engine automatically checks policy validity, geographic match, and fraud rules, approving compensation in seconds.
- **Behind the Scenes:** Evaluates coverage caps, deductibles, waiting periods, and fraud risk scores.

### Feature 7: Rules-Based Fraud Prevention Engine
- **Judge Summary:** Protects the insurer against fraud by automatically flagging suspicious behaviors:
  - GPS-to-PIN code mismatch.
  - Multiple claims filed under the same policy for the same storm.
  - Velocity abuse (exceeding maximum permitted claims per rolling 7 days).
  - Post-expiry claim attempts.

### Feature 8: Blockchain Explorer & SHA-256 Verification Cockpit
- **Judge Summary:** An interactive audit page where riders, insurers, and auditors can verify that policy terms, weather reports, and payout receipts have not been altered.
- **Behind the Scenes:** Calculates canonical SHA-256 hashes in real-time and compares them against Ethereum Sepolia on-chain digests, returning clear status badges (*VERIFIED, HASH MISMATCH, RECORD NOT FOUND*).

### Feature 9: Simulated Instant Payout Disbursal
- **Judge Summary:** Demonstrates instant compensation credited to the rider's digital wallet upon claim approval.
- **Status Clarification:** Real-world banking/UPI payouts are simulated in this prototype via an internal balance ledger.

---

## 2. Step-by-Step Hackathon Judge Demonstration Script

Follow these exact steps to test every capability of VarshaRakshak live:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEMO TIMELINE (TOTAL RUNTIME: ~6 MINS)                   │
├─────────┬──────────────────────┬────────────────────────────────────────────────┤
│ STEP    │ SCREEN / URL         │ ACTION                                         │
├─────────┼──────────────────────┼────────────────────────────────────────────────┤
│ Step 1  │ login.html           │ Sign in with 1-click Demo Rider credentials   │
│ Step 2  │ rider.html           │ Review Rider Dashboard, live weather & policy  │
│ Step 3  │ rider.html           │ Click "Simulate Heavy Rain Event"              │
│ Step 4  │ rider.html           │ Test Multilingual Voice Assistant (HI/MR/EN)   │
│ Step 5  │ routes.html          │ Inspect Safe Routes & Waterlogging Hazard Map  │
│ Step 6  │ policies.html        │ Review 7-day Weekly Plans (₹49, ₹69, ₹99)      │
│ Step 7  │ blockchain.html      │ Run interactive SHA-256 record verification    │
│ Step 8  │ rider.html           │ Click "🚪 Logout" -> confirm session purge    │
│ Step 9  │ login.html           │ Sign in with 1-click Ops Admin credentials     │
│ Step 10 │ admin.html           │ Test Fraud Engine & Weather Anomaly Injector   │
└─────────┴──────────────────────┴────────────────────────────────────────────────┘
```

---

### Step 1: Login via Verified Test Credentials
1. Open [`login.html`](file:///Users/pranav/🧑‍💻/v1/login.html) in the browser.
2. Scroll to the **"Demo Credentials"** section at the bottom of the card.
3. Click the **"🛵 Demo Rider"** button.
   - *Expected Behavior:* Email (`raju.sharma@varsharakshak.demo`) and password (`RiderPass2026!`) prefill automatically.
   - *Result:* Form authenticates against live Supabase Auth and smoothly redirects to [`rider.html`](file:///Users/pranav/🧑‍💻/v1/rider.html).

---

### Step 2: Rider Dashboard Inspection
1. Observe the top navigation bar:
   - Displays real authenticated identity: `👤 raju sharma [RIDER]`.
   - The visible **"🚪 Logout"** button is pinned on the right.
   - Notice that the administrative link (`admin.html`) is **completely hidden** from riders.
2. Observe the active policy card:
   - Plan: **Standard Weekly Shield** (₹69/week).
   - Remaining Coverage: **₹4,250 / ₹5,000**.
   - Validity: Active 7-day duration countdown.
3. Observe live weather telemetry for Mumbai PIN 400053.

---

### Step 3: Trigger Live Cloudburst Simulation & Automated Payout
1. On [`rider.html`](file:///Users/pranav/🧑‍💻/v1/rider.html), locate the blue action button:
   - **"Simulate Heavy Rain Event (68mm/hr)"**
2. Click the button.
3. Observe the immediate automated pipeline execution:
   - Weather banner updates to `EXTREME RAIN (68 mm/hr)`.
   - A success toast appears: `Automated Parametric Payout Approved: ₹750 credited to your wallet!`.
   - The Claims table immediately updates with a new approved claim.
   - The digital balance increases by ₹750.
   - Coverage remaining decrements from ₹4,250 to ₹3,500.

---

### Step 4: Test Hands-Free Voice Assistant
1. On [`rider.html`](file:///Users/pranav/🧑‍💻/v1/rider.html), locate the **Voice Assistant Cockpit** in the right column.
2. Select your preferred language: **हिंदी (Hindi)**, **मराठी (Marathi)**, or **English**.
3. Type into the text query fallback or click the mic button:
   - Query: `"Mera claim pass hua kya?"`
   - *Expected Output:* Speech synthesis audio plays aloud and response displays: *"हाँ, आपका नवीनतम क्लेम मंजूर हो चुका है और ₹750 आपके बैलेंस में ट्रांसफर कर दिए गए हैं।"*

---

### Step 5: Safe Routes & Waterlogging Map
1. Navigate to [`routes.html`](file:///Users/pranav/🧑‍💻/v1/routes.html).
2. Review the interactive Leaflet map:
   - Displays active waterlogging zones in Mumbai (Andheri Subway, Milan Subway, S.V. Road).
   - Highlights the recommended alternative route avoiding flooded corridors.
   - Displays Route Safety Score (e.g., `85/100: Safe alternative via Link Road`).

---

### Step 6: 7-Day Weekly Policy Engine
1. Navigate to [`policies.html`](file:///Users/pranav/🧑‍💻/v1/policies.html).
2. Review the three standardized weekly plans:
   - **Basic Weekly Shield:** ₹49 / 7 days (₹2,500 max coverage).
   - **Standard Weekly Shield:** ₹69 / 7 days (₹5,000 max coverage).
   - **Premium Weekly Shield:** ₹99 / 7 days (₹8,000 max coverage).
3. Test the **Interactive Payout Calculator**:
   - Select rainfall intensity: `65 mm/hr`.
   - Select disruption duration: `3 hours`.
   - Click "Calculate Benefit" -> Shows exact transparent math: ₹750 compensation.

---

### Step 7: Blockchain Explorer & SHA-256 Verification
1. Navigate to [`blockchain.html`](file:///Users/pranav/🧑‍💻/v1/blockchain.html).
2. Locate the **Interactive SHA-256 Document Verification** module.
3. Select Record Type: `POLICY` and identifier: `VR-POL-2026-00812`.
4. Click **"Verify On-Chain Integrity"**.
   - *Expected Output:* The engine recalculates the FIPS 180-4 SHA-256 digest over the local policy fields and matches it against the stored hash, returning:
   - **`STATUS: VERIFIED (On-Chain Hash Matches Calculated SHA-256)`**.
5. Test Tamper Detection:
   - Alter any parameter in simulation -> Click verify -> Displays **`HASH MISMATCH: Document Altered Post-Issuance`**.

---

### Step 8: Safe Logout & Back-Button Protection
1. Click the visible **"🚪 Logout"** button in the navbar.
2. Confirm that you are securely signed out and redirected to `login.html?logged_out=true`.
3. **The Back-Button Test:** Click the browser's Back button (`Alt + ←` or browser arrow).
   - *Expected Behavior:* The synchronous pre-render barrier activates immediately. The session check detects that you are logged out and immediately bounces back to `login.html`. **Zero flash of private dashboard content occurs.**

---

### Step 9 & 10: Operations Admin Console & Fraud Engine
1. On [`login.html`](file:///Users/pranav/🧑‍💻/v1/login.html), click **"⚡ Ops Admin"**.
2. Form authenticates with `admin@varsharakshak.com` (`AdminPass2026!`).
3. You are redirected to [`admin.html`](file:///Users/pranav/🧑‍💻/v1/admin.html).
4. Observe the **Admin Operations Console**:
   - Citywide weather anomaly injector (simulate rain from 0 to 120 mm/hr).
   - Live Fraud Monitor: displays risk score breakdown (0–100) and flags suspicious attempts.
   - Claims approval queue with one-click administrative overrides.
   - Blockchain transaction telemetry feed.

---

*Next Document:* [Business Model & Unit Economics](file:///Users/pranav/🧑‍💻/v1/docs/judges/BUSINESS_MODEL.md)
