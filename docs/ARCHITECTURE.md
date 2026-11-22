# System Architecture Specification
## VarshaRakshak — Smart Insurance for Every Delivery Rider
**Document Version:** 1.0.0 (Milestone 0)  
**System Topology:** Event-driven Monorepo with Microservices Architecture

---

## 1. High-Level Architecture Overview

VarshaRakshak is engineered as a modern, resilient, event-driven reactive system combining:
1. **Rider Frontends:** Responsive Progressive Web App (Next.js / React Native Expo) optimized for low-end mobile devices and one-thumb rider operation.
2. **Admin Portal:** Rich Next.js data application featuring real-time telemetry, map visualizations, simulation controls, and fraud auditing.
3. **Core Backend Service:** Node.js / Express TypeScript REST and WebSocket API layer enforcing strict role-based access control (RBAC) and row-level security.
4. **Parametric & Weather Evaluation Engine:** Background worker pipeline continuously evaluating spatial weather events against active insurance policies.
5. **Database & Storage Layer:** Supabase PostgreSQL with geospatial indexing (PostGIS concepts), RLS policies, and encrypted object storage for evidence.
6. **Blockchain Layer (Ethereum Sepolia):** Solidity smart contracts providing non-repudiable audit trails for policy registrations, trigger confirmations, and payout authorizations.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS LAYER                             │
│                                                                                 │
│   ┌────────────────────────────────┐         ┌──────────────────────────────┐   │
│   │     Rider Mobile / Web App     │         │      Admin Portal (Web)      │   │
│   │   (React Native Expo / PWA)    │         │    (Next.js 14 App Router)   │   │
│   │   - 22 Responsive Screens      │         │    - 11 Management Modules   │   │
│   │   - Voice Assistant (En/Hi/Mr) │         │    - Weather Simulator       │   │
│   │   - Leaflet / Mapbox Map UI    │         │    - Fraud & Claims Console  │   │
│   └───────────────▲────────────────┘         └──────────────▲───────────────┘   │
└───────────────────┼─────────────────────────────────────────┼───────────────────┘
                    │ HTTPS / WSS / REST APIs                 │
┌───────────────────▼─────────────────────────────────────────▼───────────────────┐
│                              API GATEWAY LAYER                                  │
│                                                                                 │
│   - JWT / Supabase Session Authentication Middleware                            │
│   - Rate Limiting & Helmet Security Headers                                     │
│   - Idempotency Interceptor (`X-Idempotency-Key`)                              │
│   - Zod Request Validation & Error Formatting                                   │
│   - Multilingual Voice Query & Intent Router                                    │
└───────────────────┬─────────────────────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────────────────────┐
│                            CORE APPLICATION SERVICES                            │
│                                                                                 │
│   ┌────────────────────────────────┐         ┌──────────────────────────────┐   │
│   │    Weather & Hazard Service    │         │    Income & Profile Service  │   │
│   │    - Open-Meteo / Mock Adapter │         │    - Rider Earnings Logger   │   │
│   │    - Waterlogging Reporter     │         │    - Disruption Calculator   │   │
│   │    - Safe Route Scorer         │         │    - Zone Eligibility Verifier│  │
│   └───────────────┬────────────────┘         └──────────────┬───────────────┘   │
│                   │                                         │                   │
│   ┌───────────────▼────────────────┐         ┌──────────────▼───────────────┐   │
│   │   Parametric Trigger Engine    │         │    Fraud Detection Engine    │   │
│   │   - Spatial PIN Polygon Match  │         │    - Duplicate Event Checker │   │
│   │   - Rainfall & Temp Evaluator  │         │    - Velocity & Claim Spike  │   │
│   │   - Exclusion & Waiting Check  │         │    - Geo-Fencing Validator   │   │
│   └───────────────┬────────────────┘         └──────────────┬───────────────┘   │
│                   │                                         │                   │
│   ┌───────────────▼─────────────────────────────────────────▼───────────────┐   │
│   │                   Claims & Payout Workflow Service                      │   │
│   │                   - 14-Step Automated Claim Lifecycle                   │   │
│   │                   - Internal Simulated Ledger (Double Entry)            │   │
│   │                   - Real-time Notifications Dispatcher                  │   │
│   └───────────────────────────────┬─────────────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴────────────────────────┐
          │                                                  │
┌─────────▼──────────────────────────┐   ┌───────────────────▼────────────────────┐
│      DATABASE & STORAGE LAYER      │   │       BLOCKCHAIN SETTLEMENT LAYER      │
│         (Supabase / PostgreSQL)    │   │        (Ethereum Sepolia Testnet)      │
│                                    │   │                                        │
│ - 28 Relational Normalized Tables  │   │ - PolicyRegistry.sol                   │
│ - Row-Level Security (RLS)         │   │ - TriggerRegistry.sol                  │
│ - Spatial & Compound Indexes       │   │ - ClaimRegistry.sol                    │
│ - Immutable Audit Logs             │   │ - PayoutAuthorization.sol              │
│ - Secure Claim Proof Storage       │   │ - Ethers.js Wallet Oracle / Relayer    │
└────────────────────────────────────┘   └────────────────────────────────────────┘
```

---

## 2. Directory & Monorepo Structure

```
varsha-rakshak/
├── apps/
│   ├── mobile/             # React Native Expo rider application
│   │   ├── src/
│   │   │   ├── screens/    # 22 Rider screens
│   │   │   ├── components/ # Branded UI components
│   │   │   ├── navigation/ # Tabs & stack routes
│   │   │   ├── hooks/      # Geolocation, TanStack queries, voice hooks
│   │   │   └── i18n/       # Marathi, Hindi, English translation files
│   │   └── app.json
│   ├── web/                # Responsive Next.js Web App (PWA + Rider web portal)
│   │   ├── app/            # App router pages for riders
│   │   ├── components/     # UI cards, route maps, charts
│   │   └── public/         # Icons, manifests, sound assets
│   └── admin/              # Next.js 14 Admin Portal
│       ├── app/            # 11 Operational Modules
│       │   ├── dashboard/  # Executive metrics
│       │   ├── weather/    # Weather event & simulation console
│       │   ├── waterlogging/# Waterlogging report management
│       │   ├── policies/   # Plan creation & versioning
│       │   ├── claims/     # Claims review queue
│       │   ├── payouts/    # Simulated ledger & payout approvals
│       │   ├── fraud/      # Suspicious activity dashboard
│       │   └── blockchain/ # Sepolia tx explorer & contract state
│       └── components/     # Admin-specific tables, map layers, widgets
│
├── services/
│   ├── api/                # Core Node.js / Express REST API
│   │   ├── src/
│   │   │   ├── controllers/# Auth, Rider, Weather, Route, Policy, Claim, Admin
│   │   │   ├── middleware/ # Auth, RBAC, Idempotency, Logger, RateLimiter
│   │   │   ├── routes/     # Versioned /api/v1 routes
│   │   │   ├── services/   # Business logic implementations
│   │   │   └── server.ts   # Express server bootstrap
│   ├── weather-engine/     # Weather polling & mock simulation engine
│   │   ├── src/
│   │   │   ├── providers/  # Open-Meteo adapter, IMD mock, simulator
│   │   │   └── poller.ts   # Continuous telemetry collector
│   ├── trigger-engine/     # Parametric rule evaluator & fraud analyzer
│   │   ├── src/
│   │   │   ├── rules/      # Rainfall, heatwave, coldwave formula logic
│   │   │   ├── fraud/      # Heuristics & rule scoring engine
│   │   │   └── evaluator.ts# 14-step claim processor
│   └── workers/            # Background scheduled jobs (expiry, cleanup, digests)
│
├── packages/
│   ├── shared-types/       # Universal TypeScript interfaces & enums
│   ├── validation/         # Shared Zod schemas (API requests, policies)
│   ├── ui/                 # Reusable Tailwind / shadcn design components
│   └── config/             # Shared constants, PIN codes, threshold defaults
│
├── blockchain/
│   ├── contracts/          # Solidity 0.8.24 contracts (OpenZeppelin v5)
│   │   ├── PolicyRegistry.sol
│   │   ├── TriggerRegistry.sol
│   │   ├── ClaimRegistry.sol
│   │   └── PayoutAuthorization.sol
│   ├── scripts/            # Deploy, seed, and simulate scripts
│   ├── test/               # Comprehensive Hardhat Chai test suite
│   └── hardhat.config.ts   # Sepolia & Local Hardhat network config
│
├── supabase/
│   ├── migrations/         # 28 table schema DDL, RLS, triggers & functions
│   └── seed.sql            # Demo riders, PIN codes, waterlogging spots, policies
│
├── docs/                   # PRD, Architecture, Database, API, Blockchain, etc.
├── tests/                  # Integration and E2E test suites (Vitest / Playwright)
├── .env.example            # Canonical environment variable specification
├── package.json            # Monorepo root workspace configuration
└── README.md               # Quickstart and developer documentation
```

---

## 3. End-to-End Reactive Data Pipeline

The central end-to-end integration flow operates as follows:

```
[External Weather API / Admin Simulation Console]
                    │
                    ▼
          [Weather Ingestion Event]
     (Timestamp, Lat/Lng, PIN, mm/hr, °C)
                    │
                    ▼
     [Waterlogging Overlay & Route Scoring]
  (Calculates Safe vs Flood Road Hazard Segments)
                    │
                    ▼
        [Rider Push & In-App Alerts]
                    │
                    ▼
       [Parametric Rule Engine Evaluation]
 ┌─────────────────────────────────────────────────────────┐
 │ 1. Find active policies matching PIN & Validity Window  │
 │ 2. Evaluate trigger: Rainfall >= Threshold OR Temp Spec │
 │ 3. Check exclusions, waiting periods & remaining cap    │
 └──────────────────────────┬──────────────────────────────┘
                            │
                            ▼
               [Fraud Prevention Heuristics]
 ┌─────────────────────────────────────────────────────────┐
 │ - Check duplicate claim by rider for same event         │
 │ - Check velocity limit (< 3 claims/7 days)              │
 │ - Verify rider telemetry inside affected PIN zone       │
 └──────────────────────────┬──────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
     [Flagged as Suspicious]      [Verified Eligible]
               │                         │
               ▼                         ▼
     [Admin Review Queue]        [Claim Approved (Auto)]
                                         │
                                         ▼
                            [Record Payout Authorization]
                                         │
                                         ▼
                         [Relay Tx to Ethereum Sepolia]
                        (Emit PayoutAuthorized Event)
                                         │
                                         ▼
                            [Internal Ledger Credit]
                            (Simulated Balance ₹ Added)
                                         │
                                         ▼
                           [Rider Notified & Dashboard Updated]
```

---

## 4. Provider Abstraction Architecture

To ensure zero hard-locking to single vendors and graceful offline/demo fallbacks, all external services implement strict provider interfaces:

1. **WeatherProvider Interface:**
   - `getCurrentWeather(lat: number, lng: number): Promise<WeatherData>`
   - `getForecast(pincode: string): Promise<WeatherForecast>`
   - `simulateWeatherEvent(event: WeatherEventInput): Promise<WeatherEvent>`
   - Implementations: `OpenMeteoProvider`, `MockWeatherProvider`, `AdminSimulationProvider`.

2. **WaterloggingProvider Interface:**
   - `getReportsByPincode(pincode: string): Promise<WaterloggingReport[]>`
   - `submitReport(report: ReportInput): Promise<WaterloggingReport>`
   - `updateReportSeverity(id: string, severity: Severity): Promise<void>`
   - Implementations: `MunicipalApiProvider`, `AdminManagedProvider`, `SimulatedHazardProvider`.

3. **RouteProvider Interface:**
   - `calculateSafeRoute(origin: Coordinates, destination: Coordinates, hazards: WaterloggingReport[]): Promise<RouteRecommendation>`
   - Implementations: `MapboxRouteProvider`, `GoogleMapsRouteProvider`, `HaversineGridRouteProvider`.

4. **SpeechProvider Interface:**
   - `transcribe(audioBlob: Blob, language: 'en' | 'hi' | 'mr'): Promise<string>`
   - `synthesize(text: string, language: 'en' | 'hi' | 'mr'): Promise<AudioBuffer>`
   - Implementations: `WebSpeechAPIProvider`, `ConfigurableCloudSpeechProvider`.

5. **BlockchainRelayer Interface:**
   - `registerPolicyOnChain(policyHash: string, start: number, expiry: number): Promise<string>`
   - `recordTriggerOnChain(eventHash: string, pincode: string, metric: number): Promise<string>`
   - `authorizePayoutOnChain(claimHash: string, riderRef: string, amount: number): Promise<string>`
   - Implementations: `SepoliaEthersProvider`, `HardhatLocalRelayer`, `MockBlockchainRelayer`.
