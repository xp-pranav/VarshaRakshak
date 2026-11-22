# Database Architecture & Schema Specification (Supabase PostgreSQL)
## VarshaRakshak — Smart Insurance for Every Delivery Rider
**Document Version:** 1.0.0 (Milestone 0)  
**Database Engine:** PostgreSQL 15+ (Supabase) with Extensions (`uuid-ossp`, `pgcrypto`)

---

## 1. Relational Entity-Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│    profiles     │◄──────┤ rider_profiles  │◄──────┤     income_records     │
│  (Auth & User)  │       │ (Delivery/Zones)│       │  (Rider daily logs)    │
└────────┬────────┘       └────────┬────────┘       └────────────────────────┘
         │                         │
         │                         │ 1:N
         │                         ▼
┌────────▼────────┐       ┌─────────────────┐       ┌────────────────────────┐
│   admin_users   │       │    policies     ├──────►│ policy_terms_snapshots │
│  (RBAC Admins)  │       │ (Active Insur.) │       │  (Immutable version)   │
└────────┬────────┘       └────────┬────────┘       └────────────────────────┘
         │                         │
         │ 1:N                     │ 1:N
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│role_permissions │       │     claims      ├──────►│    claim_evidence      │
│(Fine-grained)   │       │(Lifecycle state)│       │ (Photos, telemetry)    │
└─────────────────┘       └────────┬────────┘       └────────────────────────┘
                                   │
                                   │ 1:1
                                   ▼
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  weather_events ├──────►│claim_evaluations│◄──────┤     trigger_rules      │
│ (Raw/Simulated) │       │(Deterministic)  │       │ (Rainfall, Temp specs) │
└────────┬────────┘       └────────┬────────┘       └────────────────────────┘
         │                         │
         │                         ▼
┌────────▼────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  waterlogging_  │       │     payouts     ├──────►│blockchain_transactions │
│    reports      │       │(Simulated ledg.)│       │(Ethereum Sepolia txs)  │
└─────────────────┘       └─────────────────┘       └────────────────────────┘
```

---

## 2. Complete 28 Normalized Table Definitions

### 1. `profiles`
Primary identity table linking to Supabase Auth (`auth.users`).
- `id`: UUID (Primary Key, matches auth.uid)
- `phone_number`: VARCHAR(15) UNIQUE NOT NULL
- `email`: VARCHAR(255)
- `full_name`: VARCHAR(100) NOT NULL
- `preferred_language`: VARCHAR(5) DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr'))
- `is_active`: BOOLEAN DEFAULT true
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 2. `rider_profiles`
Operational delivery profile.
- `id`: UUID (Primary Key)
- `profile_id`: UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE
- `delivery_platform`: VARCHAR(50) NOT NULL CHECK (delivery_platform IN ('ZOMATO', 'SWIGGY', 'BLINKIT', 'ZEPTO', 'OTHER'))
- `partner_rider_id`: VARCHAR(50) NOT NULL
- `vehicle_type`: VARCHAR(30) DEFAULT 'MOTORCYCLE' CHECK (vehicle_type IN ('BICYCLE', 'EV_SCOOTER', 'MOTORCYCLE', 'OTHER'))
- `vehicle_registration_number`: VARCHAR(20)
- `primary_pincode`: VARCHAR(10) NOT NULL REFERENCES serviceable_pincodes(pincode)
- `emergency_contact_phone`: VARCHAR(15)
- `current_latitude`: NUMERIC(10, 7)
- `current_longitude`: NUMERIC(10, 7)
- `location_updated_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 3. `admin_users`
Internal operations and claims personnel.
- `id`: UUID (Primary Key)
- `profile_id`: UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE
- `role_id`: UUID NOT NULL REFERENCES roles(id)
- `department`: VARCHAR(50) NOT NULL
- `employee_id`: VARCHAR(50) UNIQUE NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 4. `roles`
Role-based access control definitions.
- `id`: UUID (Primary Key)
- `name`: VARCHAR(50) UNIQUE NOT NULL
- `description`: TEXT
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 5. `permissions`
Fine-grained system access actions.
- `id`: UUID (Primary Key)
- `action`: VARCHAR(100) UNIQUE NOT NULL (e.g., `claims:approve`, `policies:create`, `payouts:execute`)
- `module`: VARCHAR(50) NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 6. `role_permissions`
Cross-table mapping roles to permissions.
- `id`: UUID (Primary Key)
- `role_id`: UUID REFERENCES roles(id) ON DELETE CASCADE
- `permission_id`: UUID REFERENCES permissions(id) ON DELETE CASCADE
- UNIQUE(role_id, permission_id)

### 7. `serviceable_pincodes`
Geographic boundary dictionary for active insurance zones.
- `pincode`: VARCHAR(10) PRIMARY KEY
- `locality_name`: VARCHAR(100) NOT NULL
- `city`: VARCHAR(50) NOT NULL
- `state`: VARCHAR(50) NOT NULL
- `center_latitude`: NUMERIC(10, 7) NOT NULL
- `center_longitude`: NUMERIC(10, 7) NOT NULL
- `boundary_geojson`: JSONB
- `is_serviceable`: BOOLEAN DEFAULT true
- `high_flood_risk_zone`: BOOLEAN DEFAULT false
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 8. `income_records`
Rider daily logged income and system disruption estimation.
- `id`: UUID (Primary Key)
- `rider_id`: UUID REFERENCES rider_profiles(id) ON DELETE CASCADE
- `record_date`: DATE NOT NULL
- `gross_earnings_amount`: NUMERIC(10, 2) NOT NULL
- `delivery_trips_count`: INT NOT NULL DEFAULT 0
- `online_hours_count`: NUMERIC(4, 2) NOT NULL DEFAULT 0
- `platform`: VARCHAR(50) NOT NULL
- `estimated_disruption_hours`: NUMERIC(4, 2) DEFAULT 0
- `estimated_income_loss`: NUMERIC(10, 2) DEFAULT 0
- `is_rider_reported`: BOOLEAN DEFAULT true
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(rider_id, record_date, platform)

### 9. `insurance_plans`
Base master weekly insurance plan catalog (Strict ₹49–₹99 MVP Constraints).
- `id`: UUID (Primary Key)
- `plan_code`: VARCHAR(50) UNIQUE NOT NULL (e.g. `VR-WEEKLY-BASIC`, `VR-WEEKLY-STANDARD`, `VR-WEEKLY-PREMIUM`)
- `name`: VARCHAR(100) NOT NULL
- `plan_type`: VARCHAR(20) NOT NULL CHECK (plan_type IN ('BASIC', 'STANDARD', 'PREMIUM'))
- `billing_frequency`: VARCHAR(20) DEFAULT 'weekly' CHECK (billing_frequency = 'weekly')
- `duration_days`: INT DEFAULT 7 CHECK (duration_days = 7)
- `weekly_premium_amount`: NUMERIC(10, 2) NOT NULL CHECK (weekly_premium_amount >= 49 AND weekly_premium_amount <= 99)
- `coverage_limit`: NUMERIC(10, 2) NOT NULL
- `max_daily_coverage_amount`: NUMERIC(10, 2) NOT NULL
- `waiting_period_hours`: INT DEFAULT 2
- `covered_triggers`: JSONB NOT NULL DEFAULT '["HEAVY_RAIN"]'::jsonb
- `is_active`: BOOLEAN DEFAULT true
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 10. `policy_versions`
Versioned terms and actuarial rules of plans.
- `id`: UUID (Primary Key)
- `plan_id`: UUID REFERENCES insurance_plans(id)
- `version_number`: INT NOT NULL
- `duration_days`: INT DEFAULT 7 CHECK (duration_days = 7)
- `weekly_premium`: NUMERIC(10, 2) NOT NULL CHECK (weekly_premium >= 49 AND weekly_premium <= 99)
- `terms_document_hash`: VARCHAR(66) NOT NULL
- `terms_markdown`: TEXT NOT NULL
- `effective_from`: TIMESTAMPTZ NOT NULL
- `effective_until`: TIMESTAMPTZ
- `is_current`: BOOLEAN DEFAULT true
- UNIQUE(plan_id, version_number)

### 11. `policies`
Individual active and historical 7-day policy contracts for riders.
- `id`: UUID (Primary Key)
- `policy_number`: VARCHAR(50) UNIQUE NOT NULL
- `rider_id`: UUID REFERENCES rider_profiles(id)
- `plan_id`: UUID REFERENCES insurance_plans(id)
- `plan_type`: VARCHAR(20) NOT NULL CHECK (plan_type IN ('BASIC', 'STANDARD', 'PREMIUM'))
- `billing_frequency`: VARCHAR(20) DEFAULT 'weekly' CHECK (billing_frequency = 'weekly')
- `duration_days`: INT DEFAULT 7 CHECK (duration_days = 7)
- `policy_version_id`: UUID REFERENCES policy_versions(id)
- `pincode`: VARCHAR(10) REFERENCES serviceable_pincodes(pincode)
- `premium_amount`: NUMERIC(10, 2) NOT NULL CHECK (premium_amount >= 49 AND premium_amount <= 99)
- `coverage_limit`: NUMERIC(10, 2) NOT NULL
- `coverage_limit_remaining`: NUMERIC(10, 2) NOT NULL CHECK (coverage_limit_remaining >= 0 AND coverage_limit_remaining <= coverage_limit)
- `activation_date`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `expiry_date`: TIMESTAMPTZ NOT NULL CHECK (expiry_date = activation_date + INTERVAL '7 days')
- `renewal_status`: VARCHAR(20) DEFAULT 'ACTIVE' CHECK (renewal_status IN ('ACTIVE', 'ELIGIBLE', 'RENEWED', 'LAPSED'))
- `payment_status`: VARCHAR(20) DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED'))
- `payment_reference`: VARCHAR(100)
- `status`: VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'EXHAUSTED'))
- `onchain_policy_hash`: VARCHAR(66)
- `blockchain_registered`: BOOLEAN DEFAULT false
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- CONSTRAINT prevent_duplicate_active_policy UNIQUE(rider_id, plan_id, status) -- Prevents duplicate active policy of same plan

### 12. `policy_terms_snapshots`
Immutable JSON snapshot of policy clauses bound at time of issuance (preserves historical terms).
- `id`: UUID (Primary Key)
- `policy_id`: UUID REFERENCES policies(id) UNIQUE
- `terms_snapshot`: JSONB NOT NULL
- `deductible_amount`: NUMERIC(10, 2) DEFAULT 0
- `formula_definition`: JSONB NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 13. `weather_events`
Ingested and simulated environmental triggers.
- `id`: UUID (Primary Key)
- `event_reference`: VARCHAR(100) UNIQUE NOT NULL
- `event_type`: VARCHAR(50) NOT NULL CHECK (event_type IN ('HEAVY_RAIN', 'EXTREME_RAIN', 'EXTREME_HEAT', 'EXTREME_COLD'))
- `pincode`: VARCHAR(10) REFERENCES serviceable_pincodes(pincode)
- `latitude`: NUMERIC(10, 7) NOT NULL
- `longitude`: NUMERIC(10, 7) NOT NULL
- `intensity_value`: NUMERIC(6, 2) NOT NULL
- `intensity_unit`: VARCHAR(10) NOT NULL
- `duration_minutes`: INT NOT NULL
- `start_time`: TIMESTAMPTZ NOT NULL
- `end_time`: TIMESTAMPTZ
- `is_demo_data`: BOOLEAN DEFAULT false
- `data_source`: VARCHAR(50) NOT NULL
- `verification_status`: VARCHAR(30) DEFAULT 'VERIFIED'
- `onchain_event_hash`: VARCHAR(66)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 14. `waterlogging_reports`
Hyperlocal flood depth reports.
- `id`: UUID (Primary Key)
- `road_name`: VARCHAR(150) NOT NULL
- `landmark`: VARCHAR(150)
- `pincode`: VARCHAR(10) REFERENCES serviceable_pincodes(pincode)
- `latitude`: NUMERIC(10, 7) NOT NULL
- `longitude`: NUMERIC(10, 7) NOT NULL
- `severity_level`: VARCHAR(20) NOT NULL CHECK (severity_level IN ('LOW', 'MODERATE', 'HIGH', 'SEVERE'))
- `water_depth_cm`: INT
- `is_demo_data`: BOOLEAN DEFAULT false
- `data_source`: VARCHAR(50) NOT NULL CHECK (data_source IN ('MUNICIPAL_SENSOR', 'ADMIN_ENTRY', 'RIDER_REPORT', 'DEMO_SIMULATION'))
- `verification_status`: VARCHAR(30) DEFAULT 'UNVERIFIED'
- `verified_by`: UUID REFERENCES admin_users(id)
- `reported_at`: TIMESTAMPTZ DEFAULT NOW()

### 15. `trigger_rules`
Parametric triggers governing automated claim generation.
- `id`: UUID (Primary Key)
- `plan_id`: UUID REFERENCES insurance_plans(id)
- `event_type`: VARCHAR(50) NOT NULL
- `threshold_operator`: VARCHAR(10) NOT NULL CHECK (threshold_operator IN ('>=', '>', '<=', '<'))
- `threshold_value`: NUMERIC(6, 2) NOT NULL
- `min_duration_minutes`: INT DEFAULT 60
- `benefit_multiplier`: NUMERIC(6, 2) DEFAULT 1.00
- `fixed_benefit_amount`: NUMERIC(10, 2)
- `is_active`: BOOLEAN DEFAULT true
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 16. `trigger_evaluations`
Audit logs of parametric engine evaluations.
- `id`: UUID (Primary Key)
- `weather_event_id`: UUID REFERENCES weather_events(id)
- `policy_id`: UUID REFERENCES policies(id)
- `is_triggered`: BOOLEAN NOT NULL
- `evaluation_reason`: TEXT NOT NULL
- `calculated_payout_amount`: NUMERIC(10, 2) DEFAULT 0
- `evaluated_at`: TIMESTAMPTZ DEFAULT NOW()

### 17. `claims`
The core insurance claim record.
- `id`: UUID (Primary Key)
- `claim_number`: VARCHAR(50) UNIQUE NOT NULL
- `policy_id`: UUID REFERENCES policies(id)
- `rider_id`: UUID REFERENCES rider_profiles(id)
- `weather_event_id`: UUID REFERENCES weather_events(id)
- `trigger_rule_id`: UUID REFERENCES trigger_rules(id)
- `claim_type`: VARCHAR(50) NOT NULL
- `status`: VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'TRIGGER_DETECTED', 'VERIFICATION_PENDING', 'APPROVED', 'REJECTED', 'PAYOUT_PROCESSING', 'PAID'))
- `requested_amount`: NUMERIC(10, 2) NOT NULL
- `approved_amount`: NUMERIC(10, 2) DEFAULT 0
- `idempotency_key`: VARCHAR(100) UNIQUE NOT NULL
- `rejection_reason`: TEXT
- `onchain_claim_hash`: VARCHAR(66)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

### 18. `claim_evaluations`
Breakdown of rules applied to claim approval/rejection.
- `id`: UUID (Primary Key)
- `claim_id`: UUID REFERENCES claims(id) ON DELETE CASCADE
- `rule_results`: JSONB NOT NULL
- `waiting_period_passed`: BOOLEAN NOT NULL
- `geographic_match`: BOOLEAN NOT NULL
- `formula_output`: JSONB NOT NULL
- `evaluator_version`: VARCHAR(20) NOT NULL
- `evaluated_at`: TIMESTAMPTZ DEFAULT NOW()

### 19. `claim_evidence`
Photographs, GPS logs, or delivery app screenshots uploaded by riders.
- `id`: UUID (Primary Key)
- `claim_id`: UUID REFERENCES claims(id) ON DELETE CASCADE
- `evidence_type`: VARCHAR(50) NOT NULL
- `storage_path`: TEXT NOT NULL
- `sha256_hash`: VARCHAR(64) NOT NULL
- `uploaded_at`: TIMESTAMPTZ DEFAULT NOW()

### 20. `payouts`
Simulated double-entry ledger credit to rider account.
- `id`: UUID (Primary Key)
- `payout_reference`: VARCHAR(50) UNIQUE NOT NULL
- `claim_id`: UUID REFERENCES claims(id)
- `rider_id`: UUID REFERENCES rider_profiles(id)
- `amount`: NUMERIC(10, 2) NOT NULL
- `currency`: VARCHAR(5) DEFAULT 'INR'
- `payout_mode`: VARCHAR(30) DEFAULT 'SIMULATED_WALLET' CHECK (payout_mode IN ('SIMULATED_WALLET', 'UPI_MOCK', 'BANK_MOCK'))
- `status`: VARCHAR(30) DEFAULT 'SUCCESS' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'))
- `idempotency_key`: VARCHAR(100) UNIQUE NOT NULL
- `onchain_authorization_hash`: VARCHAR(66)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 21. `payments`
Demo premium collections paid by riders to activate insurance policies.
- `id`: UUID (Primary Key)
- `payment_reference`: VARCHAR(50) UNIQUE NOT NULL
- `policy_id`: UUID REFERENCES policies(id)
- `amount`: NUMERIC(10, 2) NOT NULL
- `status`: VARCHAR(20) DEFAULT 'CAPTURED'
- `payment_method`: VARCHAR(50) DEFAULT 'SIMULATED_UPI'
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 22. `blockchain_transactions`
Auditable record of transactions dispatched to Ethereum Sepolia.
- `id`: UUID (Primary Key)
- `transaction_hash`: VARCHAR(66) UNIQUE NOT NULL
- `contract_address`: VARCHAR(42) NOT NULL
- `function_name`: VARCHAR(100) NOT NULL
- `network`: VARCHAR(30) DEFAULT 'SEPOLIA'
- `status`: VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED'))
- `block_number`: BIGINT
- `gas_used`: BIGINT
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 23. `blockchain_events`
Parsed smart contract event logs.
- `id`: UUID (Primary Key)
- `transaction_id`: UUID REFERENCES blockchain_transactions(id)
- `event_name`: VARCHAR(100) NOT NULL
- `event_signature`: VARCHAR(100) NOT NULL
- `payload`: JSONB NOT NULL
- `emitted_at`: TIMESTAMPTZ DEFAULT NOW()

### 24. `fraud_flags`
Risk detection alerts generated by rules engine.
- `id`: UUID (Primary Key)
- `claim_id`: UUID REFERENCES claims(id)
- `rider_id`: UUID REFERENCES rider_profiles(id)
- `flag_rule`: VARCHAR(100) NOT NULL
- `severity`: VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
- `description`: TEXT NOT NULL
- `investigation_status`: VARCHAR(30) DEFAULT 'PENDING' CHECK (investigation_status IN ('PENDING', 'CLEARED', 'CONFIRMED_FRAUD'))
- `admin_notes`: TEXT
- `reviewed_by`: UUID REFERENCES admin_users(id)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 25. `notifications`
Push, SMS, and in-app alert log for riders.
- `id`: UUID (Primary Key)
- `rider_id`: UUID REFERENCES rider_profiles(id)
- `title`: VARCHAR(150) NOT NULL
- `message`: TEXT NOT NULL
- `channel`: VARCHAR(20) DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'PUSH', 'SMS'))
- `category`: VARCHAR(30) NOT NULL CHECK (category IN ('WEATHER_ALERT', 'CLAIM_UPDATE', 'PAYOUT_SUCCESS', 'POLICY_EXPIRY'))
- `is_read`: BOOLEAN DEFAULT false
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 26. `voice_assistant_logs`
Intent tracking, transcription, and telemetry for Hindi/Marathi/English queries.
- `id`: UUID (Primary Key)
- `rider_id`: UUID REFERENCES rider_profiles(id)
- `transcribed_text`: TEXT NOT NULL
- `detected_intent`: VARCHAR(50) NOT NULL
- `confidence_score`: NUMERIC(4, 3)
- `detected_language`: VARCHAR(5) NOT NULL CHECK (detected_language IN ('en', 'hi', 'mr'))
- `response_text`: TEXT NOT NULL
- `execution_latency_ms`: INT
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 27. `audit_logs`
Immutable compliance and operational record.
- `id`: UUID (Primary Key)
- `actor_id`: UUID
- `actor_type`: VARCHAR(30) NOT NULL CHECK (actor_type IN ('RIDER', 'ADMIN', 'SYSTEM_WORKER'))
- `action`: VARCHAR(100) NOT NULL
- `resource_type`: VARCHAR(50) NOT NULL
- `resource_id`: UUID
- `old_state`: JSONB
- `new_state`: JSONB
- `ip_address`: VARCHAR(45)
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### 28. `system_settings`
Global configuration and feature flags.
- `key`: VARCHAR(100) PRIMARY KEY
- `value`: JSONB NOT NULL
- `description`: TEXT
- `updated_by`: UUID REFERENCES admin_users(id)
- `updated_at`: TIMESTAMPTZ DEFAULT NOW()

---

## 3. Database Indexes & Constraints
- `CREATE INDEX idx_rider_pincode ON rider_profiles(primary_pincode);`
- `CREATE INDEX idx_policies_rider_active ON policies(rider_id, status);`
- `CREATE INDEX idx_claims_rider_status ON claims(rider_id, status);`
- `CREATE INDEX idx_claims_idempotency ON claims(idempotency_key);`
- `CREATE INDEX idx_payouts_idempotency ON payouts(idempotency_key);`
- `CREATE INDEX idx_weather_pincode_time ON weather_events(pincode, start_time);`
- `CREATE INDEX idx_waterlogging_pincode ON waterlogging_reports(pincode, severity_level);`
- `CREATE INDEX idx_income_rider_date ON income_records(rider_id, record_date);`
