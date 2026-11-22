# API Specification & OpenAPI Contracts
## VarshaRakshak — Smart Insurance for Every Delivery Rider
**Document Version:** 1.0.0 (Milestone 0)  
**Base URI:** `/api/v1`  
**Protocol:** HTTPS / JSON REST

---

## 1. Authentication & Security Headers

All authenticated endpoints require standard Bearer token authentication:
```http
Authorization: Bearer <jwt_session_token>
Content-Type: application/json
Accept: application/json
X-Client-Language: en | hi | mr
X-Idempotency-Key: <uuid_or_unique_client_hash>  # (Required on POST /claims, POST /payouts)
```

---

## 2. API Endpoints Catalog

### 2.1 Authentication (`/auth`)
- `POST /auth/send-otp`
  - **Body:** `{ "phone_number": "+919876543210" }`
  - **Response (200):** `{ "success": true, "message": "OTP sent successfully (Demo OTP: 123456)", "session_id": "sess_uuid" }`
- `POST /auth/verify-otp`
  - **Body:** `{ "phone_number": "+919876543210", "otp": "123456", "session_id": "sess_uuid" }`
  - **Response (200):** `{ "token": "jwt_token", "profile": { "id": "uuid", "full_name": "Raju Sharma", "is_rider": true } }`
- `POST /auth/logout`
  - **Response (200):** `{ "success": true }`
- `GET /auth/me`
  - **Response (200):** `{ "user": { "id": "uuid", "phone": "...", "role": "RIDER" } }`

### 2.2 Rider Management (`/riders`)
- `GET /riders/me`
  - Retrieves active profile, delivery platform (`ZOMATO`, `SWIGGY`, etc.), primary PIN code, and current coordinates.
- `PUT /riders/me`
  - Update vehicle details, emergency contact, preferred language (`en`, `hi`, `mr`), or GPS coordinates.
- `GET /riders/dashboard`
  - Consolidated rider payload: active weather alerts, active policy summary, today's income, pending claim status, safe route recommendations.

### 2.3 Weather & Rain Alerts (`/weather`)
- `GET /weather/current?lat=19.0760&lng=72.8777&pincode=400053`
  - Returns current precipitation (mm/h), temperature (°C), weather condition, alert severity (`Normal`, `Moderate Rain`, `Heavy Rain`, `Extreme Rain`), is_demo_data flag.
- `GET /weather/forecast?pincode=400053`
  - Hourly forecast for the next 12 hours with rainfall probabilities.
- `GET /weather/alerts?pincode=400053`
  - Active high rainfall or heatwave warnings.

### 2.4 Waterlogging Monitoring (`/waterlogging`)
- `GET /waterlogging?pincode=400053`
  - List of active waterlogged spots, coordinates, severity (`LOW`, `MODERATE`, `HIGH`, `SEVERE`), depth in cm, data source (`ADMIN_ENTRY`, `MUNICIPAL_SENSOR`, `DEMO_SIMULATION`), reported timestamp.
- `GET /waterlogging/nearby?lat=19.1136&lng=72.8697&radius_km=5`
  - Spatial radius search for flood hazards.
- `POST /waterlogging/report`
  - Rider crowdsourced report submission (creates `UNVERIFIED` waterlogging entry).

### 2.5 Safe Route Suggestions (`/routes`)
- `POST /routes/suggest`
  - **Body:** `{ "origin": { "lat": 19.1136, "lng": 72.8697 }, "destination": { "lat": 19.1250, "lng": 72.8450 } }`
  - **Response (200):**
    ```json
    {
      "recommended_route": {
        "route_id": "safe_alt_1",
        "distance_km": 4.2,
        "duration_mins": 14,
        "risk_score": 12,
        "explanation": "Alternative route via Link Road avoids severe waterlogging at Milan Subway.",
        "waypoints": [[19.1136, 72.8697], [19.1180, 72.8600], [19.1250, 72.8450]],
        "is_safe": true
      },
      "direct_route": {
        "route_id": "direct_1",
        "distance_km": 3.4,
        "duration_mins": 28,
        "risk_score": 85,
        "hazard_conflicts": ["Milan Subway (SEVERE - 45cm waterlogging)"],
        "is_safe": false
      }
    }
    ```

### 2.6 Daily Income Tracker (`/income`)
- `POST /income`
  - **Body:** `{ "record_date": "2026-11-21", "gross_earnings_amount": 850.00, "delivery_trips_count": 12, "online_hours_count": 6.5, "platform": "ZOMATO" }`
- `GET /income/daily?date=2026-11-21`
- `GET /income/weekly?start_date=2026-11-15`
- `GET /income/monthly?year=2026&month=11`
- `GET /income/summary`
  - Aggregated 30-day average earnings, estimated disruption loss vs eligible insurance payouts.

### 2.7 Policy Management & Marketplace (`/policies`)
- `GET /policies`
  - Available insurance plans and active user policies.
- `POST /policies/purchase`
  - Activate simulated policy: `{ "plan_id": "uuid", "pincode": "400053", "duration_days": 30 }`.
- `GET /policies/:id`
  - Full terms snapshot, remaining coverage balance, start/expiry dates, trigger criteria.
- `GET /policies/:id/verify`
  - On-chain policy hash verification against Ethereum Sepolia.

### 2.8 Payout Calculator (`/payout-calculator`)
- `POST /payout-calculator/evaluate`
  - **Body:** `{ "policy_id": "uuid", "event_type": "HEAVY_RAIN", "intensity_value": 45, "duration_hours": 3, "pincode": "400053" }`
  - **Response (200):**
    ```json
    {
      "eligible": true,
      "estimated_payout": 750.00,
      "breakdown": {
        "base_wage_rate_per_hour": 150.00,
        "disrupted_hours": 3,
        "severity_multiplier": 1.66,
        "calculated_compensation": 750.00,
        "policy_coverage_limit_remaining": 2000.00,
        "maximum_payout_per_day": 1000.00
      },
      "disclaimer": "Calculated compensation is an estimate until confirmed by automated parametric claim validation."
    }
    ```

### 2.9 Claims Lifecycle (`/claims`)
- `POST /claims`
  - Initiate parametric claim evaluation (or manual claim submission with evidence).
- `GET /claims`
  - List of past rider claims with statuses (`SUBMITTED`, `TRIGGER_DETECTED`, `APPROVED`, `PAID`, etc.).
- `GET /claims/:id`
  - Detailed claim breakdown, formula evaluation, weather proof, Sepolia tx hash.
- `GET /claims/:id/history`
  - State machine transition timeline and audit logs.

### 2.10 Payouts (`/payouts`)
- `GET /payouts`
  - List of completed simulated payouts credited to rider balance.
- `GET /payouts/:id`
  - Payout receipt, on-chain authorization reference, breakdown.

### 2.11 Multilingual Voice Assistant (`/voice`)
- `POST /voice/intent`
  - **Body:** `{ "text": "Aaj barish ka alert hai kya?", "language": "hi" }`
  - **Response (200):**
    ```json
    {
      "intent": "check_rain_alert",
      "detected_language": "hi",
      "confidence": 0.98,
      "response_text": "अंधेरी पश्चिम में भारी बारिश का येलो अलर्ट है। शाम 4 से 7 बजे तक 45 मिमी बारिश का अनुमान है।",
      "action_data": { "alert_level": "Heavy Rain", "pincode": "400053" }
    }
    ```
- `POST /voice/query`
  - Voice audio stream upload with transcription, intent resolution, and synthesis response.

### 2.12 Admin Portal APIs (`/admin`)
- `GET /admin/dashboard`: Platform KPIs, active policies, claim rates, payout aggregates.
- `CRUD /admin/policies`: Plan definitions and versioning.
- `CRUD /admin/trigger-rules`: Parametric thresholds (rainfall mm, temperature °C).
- `CRUD /admin/pincodes`: Serviceable coverage areas.
- `CRUD /admin/waterlogging`: Road flood depth reports and verification.
- `GET /admin/weather-events`: Ingested real and simulated weather events.
- `POST /admin/trigger-simulations`: Fire synthetic weather event to test automated claim triggering across registered riders.
- `GET /admin/claims`: Review queue of submitted claims.
- `POST /admin/claims/:id/approve`: Manual claim approval with decision audit rationale.
- `POST /admin/claims/:id/reject`: Rejection with mandatory justification note.
- `GET /admin/payouts`: Ledger view of disbursements.
- `POST /admin/payouts/:id/simulate`: Trigger simulated ledger payout with Sepolia hash dispatch.
- `GET /admin/fraud-flags`: Review suspicious claims flagged by fraud rules.
- `GET /admin/blockchain/transactions`: Sepolia transaction monitoring, block receipts, and status.
- `GET /admin/income-analytics`: Aggregate platform income patterns.
- `GET /admin/audit-logs`: Comprehensive compliance logs.
