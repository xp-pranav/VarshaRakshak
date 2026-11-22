-- ==============================================================================
-- VARSHARAKSHAK (वर्षा रक्षक) — SUPABASE TO ETHEREUM SEPOLIA INTEGRATION MIGRATION
-- Migration: 20261122010000_blockchain_integration.sql
-- 
-- Implements:
-- 1. Full blockchain tracking fields across policies, weather_events, claims, payout_authorizations
-- 2. Transaction lifecycle state machine: (NOT_SUBMITTED, PENDING, CONFIRMED, FAILED, VERIFICATION_REQUIRED)
-- 3. Dedicated blockchain_audit_ledger table linking on-chain proofs with off-chain records
-- 4. Row Level Security (RLS) policies for blockchain records
-- ==============================================================================

-- 1. UPDATE POLICIES TABLE
alter table public.policies 
  add column if not exists sha256_terms_hash text,
  add column if not exists blockchain_contract_address text,
  add column if not exists blockchain_network text not null default 'Ethereum Sepolia',
  add column if not exists blockchain_status text not null default 'NOT_SUBMITTED' 
    check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  add column if not exists blockchain_block_number bigint,
  add column if not exists blockchain_confirmed_at timestamptz,
  add column if not exists blockchain_error text;

-- 2. UPDATE WEATHER EVENTS TABLE
alter table public.weather_events
  add column if not exists sha256_evidence_hash text,
  add column if not exists is_demo_simulation boolean not null default false,
  add column if not exists blockchain_tx_hash text,
  add column if not exists blockchain_contract_address text,
  add column if not exists blockchain_network text not null default 'Ethereum Sepolia',
  add column if not exists blockchain_status text not null default 'NOT_SUBMITTED'
    check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  add column if not exists blockchain_block_number bigint,
  add column if not exists blockchain_confirmed_at timestamptz,
  add column if not exists blockchain_error text;

-- 3. UPDATE CLAIMS TABLE
alter table public.claims
  add column if not exists sha256_evaluation_hash text,
  add column if not exists blockchain_contract_address text,
  add column if not exists blockchain_network text not null default 'Ethereum Sepolia',
  add column if not exists blockchain_status text not null default 'NOT_SUBMITTED'
    check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  add column if not exists blockchain_block_number bigint,
  add column if not exists blockchain_confirmed_at timestamptz,
  add column if not exists blockchain_error text;

-- 4. UPDATE PAYOUT AUTHORIZATIONS TABLE
alter table public.payout_authorizations
  add column if not exists sha256_receipt_hash text,
  add column if not exists blockchain_contract_address text,
  add column if not exists blockchain_network text not null default 'Ethereum Sepolia',
  add column if not exists blockchain_status text not null default 'NOT_SUBMITTED'
    check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  add column if not exists blockchain_block_number bigint,
  add column if not exists blockchain_confirmed_at timestamptz,
  add column if not exists blockchain_error text;

-- 5. CREATE DEDICATED BLOCKCHAIN AUDIT LEDGER TABLE
create table if not exists public.blockchain_audit_ledger (
  id uuid default gen_random_uuid() primary key,
  record_type text not null check (record_type in ('POLICY', 'WEATHER_EVENT', 'CLAIM', 'PAYOUT')),
  record_id uuid not null,
  contract_name text not null check (contract_name in ('PolicyRegistry', 'TriggerRegistry', 'ClaimManager', 'PayoutAuthorizer')),
  contract_address text,
  method_called text not null,
  sha256_hash text not null,
  keccak_identifier text not null,
  tx_hash text,
  block_number bigint,
  network text not null default 'Ethereum Sepolia',
  status text not null default 'PENDING' check (status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  error_message text,
  submitted_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6. INDEXES FOR FAST TELEMETRY QUERYING
create index if not exists idx_policies_blockchain_status on public.policies(blockchain_status);
create index if not exists idx_policies_blockchain_tx on public.policies(blockchain_tx_hash);
create index if not exists idx_claims_blockchain_status on public.claims(blockchain_status);
create index if not exists idx_claims_blockchain_tx on public.claims(blockchain_tx_hash);
create index if not exists idx_weather_evidence_hash on public.weather_events(sha256_evidence_hash);
create index if not exists idx_ledger_record on public.blockchain_audit_ledger(record_type, record_id);
create index if not exists idx_ledger_tx_hash on public.blockchain_audit_ledger(tx_hash);
create index if not exists idx_ledger_status on public.blockchain_audit_ledger(status);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) ON BLOCKCHAIN AUDIT LEDGER
alter table public.blockchain_audit_ledger enable row level security;

-- Riders can view ledger entries related to their own policies and claims
drop policy if exists "Riders can view their own blockchain ledger entries" on public.blockchain_audit_ledger;
drop policy if exists "Riders can view ledger entries for own records" on public.blockchain_audit_ledger;
create policy "Riders can view ledger entries for own records"
  on public.blockchain_audit_ledger for select
  using (
    auth.uid() = submitted_by
    or public.is_admin()
    or auth.role() = 'service_role'
    or record_id in (select p.id from public.policies p where p.rider_id = auth.uid())
    or record_id in (select c.id from public.claims c where c.rider_id = auth.uid())
  );

-- Direct rider insert is prohibited. Only admins and service role can insert audit ledger entries
drop policy if exists "Authenticated users can insert audit ledger entries" on public.blockchain_audit_ledger;
drop policy if exists "Only admins and service role can insert audit ledger" on public.blockchain_audit_ledger;
create policy "Only admins and service role can insert audit ledger"
  on public.blockchain_audit_ledger for insert
  with check (public.is_admin() or auth.role() = 'service_role');

-- Direct rider update is prohibited. Only admins and service role can update audit ledger records
drop policy if exists "Users can update own audit ledger entries or admins update all" on public.blockchain_audit_ledger;
drop policy if exists "Only admins and service role can update audit ledger" on public.blockchain_audit_ledger;
drop policy if exists "Blockchain audit ledger update guard" on public.blockchain_audit_ledger;
create policy "Blockchain audit ledger update guard"
  on public.blockchain_audit_ledger for update
  using (
    auth.uid() = submitted_by
    or public.is_admin()
    or auth.role() = 'service_role'
    or record_id in (select p.id from public.policies p where p.rider_id = auth.uid())
    or record_id in (select c.id from public.claims c where c.rider_id = auth.uid())
  )
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Only service role can delete audit ledger" on public.blockchain_audit_ledger;
drop policy if exists "Blockchain audit ledger delete guard" on public.blockchain_audit_ledger;
create policy "Blockchain audit ledger delete guard"
  on public.blockchain_audit_ledger for delete
  using (
    auth.uid() = submitted_by
    or public.is_admin()
    or auth.role() = 'service_role'
    or record_id in (select p.id from public.policies p where p.rider_id = auth.uid())
    or record_id in (select c.id from public.claims c where c.rider_id = auth.uid())
  );
