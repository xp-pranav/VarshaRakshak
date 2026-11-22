# Deployment, Environment & Operations Guide
## VarshaRakshak — Smart Insurance for Every Delivery Rider
**Document Version:** 1.0.0 (Milestone 0)

---

## 1. Environment Variables Specification (`.env.example`)

```ini
# ==============================================================================
# ENVIRONMENT & GENERAL SETTINGS
# ==============================================================================
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# ==============================================================================
# SUPABASE / DATABASE SETTINGS
# ==============================================================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# ==============================================================================
# BLOCKCHAIN / ETHEREUM SEPOLIA
# ==============================================================================
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
RELAYER_PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
POLICY_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
TRIGGER_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
CLAIM_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
PAYOUT_AUTHORIZATION_ADDRESS=0x0000000000000000000000000000000000000000
ETHERSCAN_API_KEY=your-etherscan-key

# ==============================================================================
# WEATHER & MAPPING PROVIDERS
# ==============================================================================
WEATHER_PROVIDER=open-meteo # Options: open-meteo, mock
OPEN_METEO_API_URL=https://api.open-meteo.com/v1/forecast
MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token # Optional, fallback to OpenStreetMap

# ==============================================================================
# VOICE ASSISTANT
# ==============================================================================
VOICE_SYNTHESIS_ENGINE=browser # Options: browser, cloud
DEFAULT_LANGUAGE=hi # Options: en, hi, mr

# ==============================================================================
# SIMULATION FLAGS
# ==============================================================================
ENABLE_WEATHER_SIMULATOR=true
ENABLE_DEMO_DATA_LABELS=true
ENABLE_AUTO_PAYOUT_DISPATCH=true
```

---

## 2. Monorepo Setup & Quickstart

```bash
# 1. Install root dependencies
pnpm install

# 2. Setup Supabase Database
# Apply migrations from supabase/migrations/
pnpm db:migrate
pnpm db:seed

# 3. Compile and test Smart Contracts
cd blockchain
pnpm compile
pnpm test
pnpm deploy:sepolia

# 4. Start Development Services
pnpm dev:api      # Starts API on http://localhost:4000
pnpm dev:web      # Starts Rider Web on http://localhost:3000
pnpm dev:admin    # Starts Admin Portal on http://localhost:3001
pnpm dev:mobile   # Starts Expo Dev Server
```

---

## 3. Testing & Verification Runbook

```bash
# Run all unit and integration tests across services
pnpm test

# Run blockchain Hardhat test suite
pnpm test:blockchain

# Run backend API tests
pnpm test:api

# Run E2E user flow tests
pnpm test:e2e
```
