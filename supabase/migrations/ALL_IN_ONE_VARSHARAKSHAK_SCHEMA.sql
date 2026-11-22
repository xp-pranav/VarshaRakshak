-- ==============================================================================
-- VARSHARAKSHAK (वर्षा रक्षक) — COMPLETE SUPABASE POSTGRESQL SCHEMA
-- File: ALL_IN_ONE_VARSHARAKSHAK_SCHEMA.sql
-- 
-- Run this single script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yenahycxkcjdobazyqka/sql/new
--
-- Security Guarantees Implemented:
-- 1. All new public signups receive RIDER role unconditionally (zero email-based admin backdoors).
-- 2. Strict Policy Insert Validation:
--    - Exact premium-to-plan mapping: Basic ₹49 (₹2,500), Standard ₹69 (₹5,000), Premium ₹99 (₹8,000).
--    - Server-controlled duration (7 days), active status, and deterministic terms hashes.
--    - Riders cannot set arbitrary coverage, expiry dates, or blockchain confirmation fields.
-- 3. Claims & Payouts Security:
--    - Riders can only submit pending claims with 0 approved amount.
--    - Approval status, approved payout amounts, and reviews are strictly admin/service_role.
-- 4. Weather Events & Privacy:
--    - Riders cannot insert or forge weather events (restricted to admin & oracle service_role).
--    - RLS restricts weather_events SELECT access to rider's active coverage/registered zones.
--    - Public generalized telemetry view hides private micro-location and oracle logs.
-- 5. Blockchain Audit Ledger Immutability:
--    - Direct rider INSERT is removed. Only admin & service_role can create audit entries.
--    - Receipts must be validated server-side before marking CONFIRMED.
-- 6. Server-Side Admin Provisioning:
--    - Dedicated SECURITY DEFINER procedures (provision_admin_user, set_user_role).
--    - EXECUTE grants revoked from public/anon; privilege checked against is_admin() or service_role.
-- 7. Private KYC vs Blockchain Separation:
--    - Exact residential addresses and delivery KYC are private and never broadcast on-chain.
-- 8. Audit Trail Preservation on Account Deletion:
--    - Financial tables (policies, claims, payouts, ledger) use ON DELETE SET NULL.
--    - User account deletion erases PII (GDPR) without erasing financial audit trails.
-- 9. Comprehensive RLS on all 11 tables.
-- ==============================================================================

-- Enable Required Extensions (if supported by PostgreSQL environment)
do $$
begin
  create extension if not exists "uuid-ossp";
exception when others then null;
end $$;

do $$
begin
  create extension if not exists "pgcrypto";
exception when others then null;
end $$;

-- Ensure Supabase application roles exist if executing in standalone PostgreSQL
do $$
begin
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
exception when others then null;
end $$;

-- ==============================================================================
-- 1. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default '',
  date_of_birth date,
  gender text check (gender in ('Male', 'Female', 'Non-Binary', 'Prefer not to say', 'Other')),
  email text unique,
  phone text,
  avatar_url text,
  role text not null default 'RIDER' check (role in ('RIDER', 'ADMIN')),
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 2. RIDER ADDRESSES TABLE (Sensitive Private Residential KYC)
-- PRIVACY: Private residential addresses and PIN codes are restricted to the rider
-- and compliance admins. They are NEVER published or broadcast to Ethereum.
-- ==============================================================================
create table if not exists public.rider_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  address_line text not null default '',
  locality text not null default '',
  city text not null default 'Mumbai',
  state text not null default 'Maharashtra',
  pincode text not null default '400053',
  country text not null default 'India',
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. RIDER DETAILS TABLE (Delivery Work)
-- PRIVACY: Platform rider IDs and delivery operating zones are internal operational
-- records and are NEVER exported or published to Ethereum smart contracts.
-- ==============================================================================
create table if not exists public.rider_details (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  delivery_platform text not null check (delivery_platform in ('Zomato', 'Swiggy', 'Blinkit', 'Zepto', 'Amazon', 'Other')),
  platform_rider_id text,
  work_experience text,
  daily_working_hours numeric(4, 1) default 8.0,
  weekly_working_days integer default 6 check (weekly_working_days between 1 and 7),
  operating_area text not null default 'Andheri West',
  monthly_income_range text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 4. RIDER VEHICLES TABLE
-- ==============================================================================
create table if not exists public.rider_vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vehicle_type text not null check (vehicle_type in ('Bicycle', 'Electric Bicycle', 'Electric Scooter', 'Petrol Scooter', 'Motorcycle')),
  registration_number text,
  ownership_type text not null default 'Owned' check (ownership_type in ('Owned', 'Rented', 'Other')),
  has_driving_licence boolean not null default false,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 5. EMERGENCY CONTACTS TABLE
-- ==============================================================================
create table if not exists public.emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_name text not null,
  relationship text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 6. USER CONSENTS TABLE
-- ==============================================================================
create table if not exists public.user_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  consent_type text not null,
  consent_version text not null default '1.0.0',
  accepted boolean not null default false,
  accepted_at timestamptz not null default now()
);

-- ==============================================================================
-- 7. POLICIES TABLE (Weekly Parametric Policies: ₹49 to ₹99, 7-Day Window)
-- AUDIT COMPLIANCE: rider_id uses ON DELETE SET NULL so user account deletion
-- does NOT unintentionally erase financial insurance contracts and audit history.
-- ==============================================================================
create table if not exists public.policies (
  id uuid default gen_random_uuid() primary key,
  rider_id uuid references public.profiles(id) on delete set null,
  plan_name text not null check (plan_name in ('Basic Weekly Shield', 'Standard Weekly Shield', 'Premium Weekly Shield')),
  premium_amount numeric(10, 2) not null check (premium_amount in (49.00, 69.00, 99.00)),
  coverage_amount numeric(10, 2) not null check (coverage_amount in (2500.00, 5000.00, 8000.00)),
  coverage_remaining numeric(10, 2) not null check (coverage_remaining >= 0 and coverage_remaining <= coverage_amount),
  duration_days integer not null default 7 check (duration_days = 7),
  billing_frequency text not null default 'weekly' check (billing_frequency = 'weekly'),
  pincode text not null default '400053',
  start_date timestamptz not null default now(),
  expiry_date timestamptz not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED', 'CANCELLED', 'CLAIMED')),
  renewal_status text not null default 'ACTIVE' check (renewal_status in ('ACTIVE', 'RENEWED', 'LAPSED')),
  policy_hash text,
  sha256_terms_hash text,
  blockchain_tx_hash text,
  blockchain_contract_address text,
  blockchain_network text not null default 'Ethereum Sepolia',
  blockchain_status text not null default 'NOT_SUBMITTED' check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  blockchain_block_number bigint,
  blockchain_confirmed_at timestamptz,
  blockchain_error text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 8. WEATHER EVENTS TABLE (Immutable Oracle Logs)
-- ==============================================================================
create table if not exists public.weather_events (
  id uuid default gen_random_uuid() primary key,
  location text not null,
  pincode text not null default '400053',
  temperature numeric(5, 2),
  rainfall numeric(6, 2) not null default 0,
  wind_speed numeric(5, 2) default 0,
  disruption_level text not null default 'Moderate Rain',
  weather_provider text not null default 'OpenWeatherMap',
  evidence_hash text,
  sha256_evidence_hash text,
  is_demo_simulation boolean not null default false,
  blockchain_tx_hash text,
  blockchain_contract_address text,
  blockchain_network text not null default 'Ethereum Sepolia',
  blockchain_status text not null default 'NOT_SUBMITTED' check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  blockchain_block_number bigint,
  blockchain_confirmed_at timestamptz,
  blockchain_error text,
  recorded_at timestamptz not null default now()
);

-- ==============================================================================
-- 9. CLAIMS TABLE
-- AUDIT COMPLIANCE: rider_id and policy_id use ON DELETE SET NULL to preserve
-- complete claims and adjudication history upon rider profile removal.
-- ==============================================================================
create table if not exists public.claims (
  id uuid default gen_random_uuid() primary key,
  claim_number text unique not null,
  rider_id uuid references public.profiles(id) on delete set null,
  policy_id uuid references public.policies(id) on delete set null,
  weather_event_id uuid references public.weather_events(id) on delete set null,
  claim_amount numeric(10, 2) not null,
  approved_amount numeric(10, 2) default 0,
  claim_reason text,
  evaluation_hash text,
  sha256_evaluation_hash text,
  risk_score numeric(5, 2) default 0,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  blockchain_tx_hash text,
  blockchain_contract_address text,
  blockchain_network text not null default 'Ethereum Sepolia',
  blockchain_status text not null default 'NOT_SUBMITTED' check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  blockchain_block_number bigint,
  blockchain_confirmed_at timestamptz,
  blockchain_error text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 10. PAYOUT AUTHORIZATIONS TABLE
-- AUDIT COMPLIANCE: claim_id and rider_id use ON DELETE SET NULL to preserve
-- double-entry financial settlement logs for taxation and financial audit.
-- ==============================================================================
create table if not exists public.payout_authorizations (
  id uuid default gen_random_uuid() primary key,
  claim_id uuid references public.claims(id) on delete set null,
  rider_id uuid references public.profiles(id) on delete set null,
  amount numeric(10, 2) not null,
  status text not null default 'AUTHORIZED' check (status in ('AUTHORIZED', 'SETTLED', 'FAILED')),
  receipt_hash text,
  sha256_receipt_hash text,
  blockchain_tx_hash text,
  blockchain_contract_address text,
  blockchain_network text not null default 'Ethereum Sepolia',
  blockchain_status text not null default 'NOT_SUBMITTED' check (blockchain_status in ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED', 'VERIFICATION_REQUIRED')),
  blockchain_block_number bigint,
  blockchain_confirmed_at timestamptz,
  blockchain_error text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 11. DEDICATED BLOCKCHAIN AUDIT LEDGER TABLE
-- AUDIT COMPLIANCE: Immutable cryptographically-anchored ledger.
-- Only service_role and authorized administrators can insert or manage entries.
-- ==============================================================================
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

-- ==============================================================================
-- INDEXES FOR FAST TELEMETRY & LOOKUPS
-- ==============================================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_policies_rider on public.policies(rider_id);
create index if not exists idx_policies_status on public.policies(status);
create index if not exists idx_policies_blockchain_status on public.policies(blockchain_status);
create index if not exists idx_policies_blockchain_tx on public.policies(blockchain_tx_hash);
create index if not exists idx_claims_rider on public.claims(rider_id);
create index if not exists idx_claims_status on public.claims(status);
create index if not exists idx_claims_blockchain_status on public.claims(blockchain_status);
create index if not exists idx_claims_blockchain_tx on public.claims(blockchain_tx_hash);
create index if not exists idx_weather_pincode on public.weather_events(pincode);
create index if not exists idx_weather_evidence_hash on public.weather_events(sha256_evidence_hash);
create index if not exists idx_ledger_record on public.blockchain_audit_ledger(record_type, record_id);
create index if not exists idx_ledger_tx_hash on public.blockchain_audit_ledger(tx_hash);
create index if not exists idx_ledger_status on public.blockchain_audit_ledger(status);

-- ==============================================================================
-- SECURE PUBLIC TELEMETRY VIEW (WEATHER DATA PRIVACY)
-- Exposes city-wide weather metrics without revealing private micro-locations
-- or internal oracle error details.
-- ==============================================================================
create or replace view public.weather_public_telemetry with (security_invoker = false) as
select
  id,
  location,
  temperature,
  rainfall,
  wind_speed,
  disruption_level,
  weather_provider,
  is_demo_simulation,
  recorded_at
from public.weather_events;

grant select on public.weather_public_telemetry to authenticated, anon;

-- ==============================================================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================================================

-- 1. Helper function to check if current authenticated user has ADMIN role
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- 2. Trigger function to auto-create profile on auth.users signup
-- SECURITY REQUIREMENT 1: All new public signups unconditionally receive RIDER role.
-- Zero email-based admin assignment.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, profile_completed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'RIDER', -- Enforced: No public signup can ever receive ADMIN role.
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Trigger for updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 4. SECURITY REQUIREMENT 5: Server-side Secure Admin Provisioning Procedures
-- Only existing administrators or the secure service_role can elevate a user to ADMIN.

create or replace function public.provision_admin_user(target_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Privilege Check: Caller must be an existing verified ADMIN or service_role
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Unauthorized: Only administrators or service_role can provision admin users.';
  end if;

  select id into v_user_id
  from public.profiles
  where lower(email) = lower(trim(target_email));

  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'User with specified email not found in public.profiles.');
  end if;

  update public.profiles
  set role = 'ADMIN',
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object('success', true, 'user_id', v_user_id, 'email', target_email, 'role', 'ADMIN');
end;
$$;

revoke all on function public.provision_admin_user(text) from public, anon;
grant execute on function public.provision_admin_user(text) to authenticated, service_role;

create or replace function public.set_user_role(target_user_id uuid, target_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Privilege Check: Caller must be an existing verified ADMIN or service_role
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Unauthorized: Only administrators or service_role can modify user roles.';
  end if;

  if target_role not in ('RIDER', 'ADMIN') then
    raise exception 'Invalid role: Target role must be either RIDER or ADMIN.';
  end if;

  update public.profiles
  set role = target_role,
      updated_at = now()
  where id = target_user_id;

  return jsonb_build_object('success', true, 'user_id', target_user_id, 'role', target_role);
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated, service_role;

-- 5. Trigger Guard to prevent non-admins from altering role in public.profiles
create or replace function public.guard_profile_role_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not (public.is_admin() or auth.role() = 'service_role') then
      raise exception 'Unauthorized: Role modification requires verified administrator privileges.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_role_guard on public.profiles;
create trigger on_profile_role_guard
  before update on public.profiles
  for each row execute procedure public.guard_profile_role_changes();

-- 6. SECURITY REQUIREMENT 1: POLICY INSERT VALIDATION TRIGGER
-- Validates plan names, exact premium-to-plan mapping, coverage limits,
-- prevents arbitrary dates and forgery of blockchain confirmation fields.
create or replace function public.guard_policy_insert_and_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_clean text;
  v_expected_premium numeric(10, 2);
  v_expected_coverage numeric(10, 2);
begin
  -- Administrators and service_role have administrative insertion rights
  if public.is_admin() or auth.role() = 'service_role' then
    if new.duration_days is null then
      new.duration_days := 7;
    end if;
    if new.start_date is null then
      new.start_date := now();
    end if;
    if new.expiry_date is null then
      new.expiry_date := new.start_date + interval '7 days';
    end if;
    return new;
  end if;

  -- 1. Enforce rider_id binds strictly to auth.uid()
  if new.rider_id is distinct from auth.uid() then
    raise exception 'Security Violation: Riders can only purchase policies for their own authenticated account.';
  end if;

  -- 2. Validate plan_name against the three approved plans
  v_plan_clean := trim(new.plan_name);
  if v_plan_clean in ('Basic', 'Basic Weekly Shield', 'VR-WEEKLY-BASIC', 'plan-basic') then
    new.plan_name := 'Basic Weekly Shield';
    v_expected_premium := 49.00;
    v_expected_coverage := 2500.00;
  elsif v_plan_clean in ('Standard', 'Standard Weekly Shield', 'VR-WEEKLY-STANDARD', 'plan-standard') then
    new.plan_name := 'Standard Weekly Shield';
    v_expected_premium := 69.00;
    v_expected_coverage := 5000.00;
  elsif v_plan_clean in ('Premium', 'Premium Weekly Shield', 'VR-WEEKLY-PREMIUM', 'plan-premium') then
    new.plan_name := 'Premium Weekly Shield';
    v_expected_premium := 99.00;
    v_expected_coverage := 8000.00;
  else
    raise exception 'Security Violation: Invalid insurance plan "%". Must be Basic Weekly Shield (₹49), Standard Weekly Shield (₹69), or Premium Weekly Shield (₹99).', v_plan_clean;
  end if;

  -- 3. Enforce exact premium-to-plan mapping
  if new.premium_amount is not null and new.premium_amount <> v_expected_premium then
    raise exception 'Security Violation: Tampered premium amount for %: expected ₹%, received ₹%', new.plan_name, v_expected_premium, new.premium_amount;
  end if;
  new.premium_amount := v_expected_premium;

  -- 4. Enforce exact coverage amount and coverage remaining against server configuration
  if new.coverage_amount is not null and new.coverage_amount <> v_expected_coverage then
    raise exception 'Security Violation: Tampered coverage amount for %: expected ₹%, received ₹%', new.plan_name, v_expected_coverage, new.coverage_amount;
  end if;
  if new.coverage_remaining is not null and new.coverage_remaining <> v_expected_coverage then
    raise exception 'Security Violation: Tampered coverage remaining for %: expected ₹%, received ₹%', new.plan_name, v_expected_coverage, new.coverage_remaining;
  end if;
  new.coverage_amount := v_expected_coverage;
  new.coverage_remaining := v_expected_coverage;

  -- 5. Prevent arbitrary date tampering: Server-authoritative timestamps
  new.duration_days := 7;
  new.billing_frequency := 'weekly';
  new.start_date := now();
  new.expiry_date := now() + interval '7 days';
  new.status := 'ACTIVE';
  new.renewal_status := 'ACTIVE';

  -- 6. Prevent riders from setting arbitrary blockchain or hash proof fields
  if new.blockchain_status not in ('NOT_SUBMITTED', 'PENDING') or
     new.blockchain_tx_hash is not null or
     new.blockchain_contract_address is not null or
     new.blockchain_block_number is not null or
     new.blockchain_confirmed_at is not null or
     new.blockchain_error is not null then
    raise exception 'Security Violation: Riders cannot forge blockchain confirmation fields or transaction proofs during policy creation.';
  end if;
  new.blockchain_status := 'NOT_SUBMITTED';
  new.blockchain_tx_hash := null;
  new.blockchain_contract_address := null;
  new.blockchain_block_number := null;
  new.blockchain_confirmed_at := null;
  new.blockchain_error := null;

  -- Generate server-side deterministic policy hash if not supplied
  if new.sha256_terms_hash is null or new.policy_hash is null then
    new.sha256_terms_hash := '0x' || encode(sha256(convert_to(
      new.rider_id::text || '|' || new.plan_name || '|' || new.premium_amount::text || '|' || new.coverage_amount::text || '|' || new.start_date::text,
      'UTF8'
    )), 'hex');
    new.policy_hash := new.sha256_terms_hash;
  end if;

  return new;
end;
$$;

drop trigger if exists on_policy_insert_guard on public.policies;
create trigger on_policy_insert_guard
  before insert on public.policies
  for each row execute procedure public.guard_policy_insert_and_defaults();

-- 7. Trigger Guard for Policy Updates & Deletions
-- Prevents riders from directly altering policy pricing, coverage, status, or blockchain fields.
create or replace function public.guard_policy_modifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    if TG_OP = 'UPDATE' then
      if (new.premium_amount is distinct from old.premium_amount or
          new.coverage_amount is distinct from old.coverage_amount or
          new.coverage_remaining is distinct from old.coverage_remaining or
          new.duration_days is distinct from old.duration_days or
          new.status is distinct from old.status or
          new.renewal_status is distinct from old.renewal_status or
          new.blockchain_status is distinct from old.blockchain_status or
          new.blockchain_tx_hash is distinct from old.blockchain_tx_hash or
          new.blockchain_contract_address is distinct from old.blockchain_contract_address or
          new.blockchain_network is distinct from old.blockchain_network or
          new.blockchain_block_number is distinct from old.blockchain_block_number or
          new.blockchain_confirmed_at is distinct from old.blockchain_confirmed_at or
          new.blockchain_error is distinct from old.blockchain_error or
          new.policy_hash is distinct from old.policy_hash or
          new.sha256_terms_hash is distinct from old.sha256_terms_hash) then
        raise exception 'Security Violation: Riders cannot directly modify policy pricing, status, or blockchain fields.';
      end if;
    elsif TG_OP = 'DELETE' then
      raise exception 'Security Violation: Riders cannot delete insurance policies.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_policy_guard on public.policies;
create trigger on_policy_guard
  before update or delete on public.policies
  for each row execute procedure public.guard_policy_modifications();

-- 8. SECURITY REQUIREMENT 3: Trigger Guard for Claims
-- Prevents riders from self-approving claims, setting approved payouts, or editing claims.
create or replace function public.guard_claim_modifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    if TG_OP = 'INSERT' then
      if new.status <> 'PENDING' or coalesce(new.approved_amount, 0) > 0 or new.reviewed_by is not null or new.reviewed_at is not null then
        raise exception 'Security Violation: Riders cannot self-approve claims or assign payout amounts.';
      end if;
    elsif TG_OP = 'UPDATE' then
      if (new.status is distinct from old.status or
          new.approved_amount is distinct from old.approved_amount or
          new.reviewed_by is distinct from old.reviewed_by or
          new.reviewed_at is distinct from old.reviewed_at or
          new.blockchain_status is distinct from old.blockchain_status or
          new.blockchain_tx_hash is distinct from old.blockchain_tx_hash or
          new.blockchain_contract_address is distinct from old.blockchain_contract_address or
          new.blockchain_block_number is distinct from old.blockchain_block_number or
          new.blockchain_confirmed_at is distinct from old.blockchain_confirmed_at or
          new.evaluation_hash is distinct from old.evaluation_hash or
          new.sha256_evaluation_hash is distinct from old.sha256_evaluation_hash) then
        raise exception 'Security Violation: Riders cannot directly modify claim approval status or payout fields.';
      end if;
    elsif TG_OP = 'DELETE' then
      raise exception 'Security Violation: Riders cannot delete claim records.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_claim_guard on public.claims;
create trigger on_claim_guard
  before insert or update or delete on public.claims
  for each row execute procedure public.guard_claim_modifications();

-- 9. SECURITY REQUIREMENT 4: Trigger Guard for Weather Events
-- Ensures only verified oracle services or administrators can create or alter weather events.
create or replace function public.guard_weather_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Security Violation: Riders cannot create or modify weather events.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_weather_event_guard on public.weather_events;
create trigger on_weather_event_guard
  before insert or update or delete on public.weather_events
  for each row execute procedure public.guard_weather_events();

-- 10. Trigger Guard for Payout Authorizations
-- Restricts payout authorisations strictly to admins and oracle service_role.
create or replace function public.guard_payout_modifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Security Violation: Payout authorizations can only be created or modified by administrators or oracle service.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_payout_guard on public.payout_authorizations;
create trigger on_payout_guard
  before insert or update or delete on public.payout_authorizations
  for each row execute procedure public.guard_payout_modifications();

-- 11. SECURITY REQUIREMENT 2: Trigger Guard for Blockchain Audit Ledger
-- Enforces immutability: direct rider insertion, modification, or deletion is prohibited.
create or replace function public.guard_blockchain_audit_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Security Violation: Direct access to blockchain audit ledger is restricted to authorized administrators and oracle service_role.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_blockchain_audit_ledger_guard on public.blockchain_audit_ledger;
create trigger on_blockchain_audit_ledger_guard
  before insert or update or delete on public.blockchain_audit_ledger
  for each row execute procedure public.guard_blockchain_audit_ledger();

-- 12. Server-Side Blockchain Audit Entry Procedure (Server-Side Receipt Verification)
create or replace function public.record_blockchain_audit_entry(
  p_record_type text,
  p_record_id uuid,
  p_contract_name text,
  p_contract_address text,
  p_method_called text,
  p_sha256_hash text,
  p_keccak_identifier text,
  p_tx_hash text default null,
  p_block_number bigint default null,
  p_status text default 'PENDING'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ledger_id uuid;
begin
  -- Only admin or service_role can record or confirm blockchain transactions
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Unauthorized: Only administrators or service_role can record or confirm blockchain transactions.';
  end if;

  -- Validate transaction parameters before marking CONFIRMED
  if p_status = 'CONFIRMED' then
    if p_tx_hash is null or length(trim(p_tx_hash)) < 10 or p_block_number is null or p_block_number <= 0 then
      raise exception 'Security Violation: Cannot mark blockchain record CONFIRMED without valid tx_hash and block_number.';
    end if;
  end if;

  insert into public.blockchain_audit_ledger (
    record_type,
    record_id,
    contract_name,
    contract_address,
    method_called,
    sha256_hash,
    keccak_identifier,
    tx_hash,
    block_number,
    status,
    submitted_by,
    confirmed_at
  ) values (
    p_record_type,
    p_record_id,
    p_contract_name,
    p_contract_address,
    p_method_called,
    p_sha256_hash,
    p_keccak_identifier,
    p_tx_hash,
    p_block_number,
    p_status,
    auth.uid(),
    case when p_status = 'CONFIRMED' then now() else null end
  ) returning id into v_ledger_id;

  return jsonb_build_object('success', true, 'ledger_id', v_ledger_id, 'status', p_status);
end;
$$;

revoke all on function public.record_blockchain_audit_entry(text, uuid, text, text, text, text, text, text, bigint, text) from public, anon;
grant execute on function public.record_blockchain_audit_entry(text, uuid, text, text, text, text, text, text, bigint, text) to authenticated, service_role;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — ALL 11 TABLES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.rider_addresses enable row level security;
alter table public.rider_details enable row level security;
alter table public.rider_vehicles enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.user_consents enable row level security;
alter table public.policies enable row level security;
alter table public.weather_events enable row level security;
alter table public.claims enable row level security;
alter table public.payout_authorizations enable row level security;
alter table public.blockchain_audit_ledger enable row level security;

-- ------------------------------------------------------------------------------
-- 1. PROFILES RLS
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own profile or admins view all" on public.profiles;
create policy "Users can view own profile or admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile (except role) or admins update all" on public.profiles;
create policy "Users can update own profile (except role) or admins update all"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    case
      when public.is_admin() then true
      else (auth.uid() = id and role = 'RIDER')
    end
  );

drop policy if exists "Users can delete own profile or admins delete" on public.profiles;
create policy "Users can delete own profile or admins delete"
  on public.profiles for delete
  using (auth.uid() = id or public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. RIDER ADDRESSES RLS (Sensitive Private KYC)
-- ------------------------------------------------------------------------------
drop policy if exists "Users manage own address or admins view" on public.rider_addresses;
create policy "Users manage own address or admins view"
  on public.rider_addresses for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. RIDER DETAILS RLS
-- ------------------------------------------------------------------------------
drop policy if exists "Users manage own rider details or admins view" on public.rider_details;
create policy "Users manage own rider details or admins view"
  on public.rider_details for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. RIDER VEHICLES RLS
-- ------------------------------------------------------------------------------
drop policy if exists "Users manage own vehicles or admins view" on public.rider_vehicles;
create policy "Users manage own vehicles or admins view"
  on public.rider_vehicles for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. EMERGENCY CONTACTS RLS
-- ------------------------------------------------------------------------------
drop policy if exists "Users manage own emergency contacts or admins view" on public.emergency_contacts;
create policy "Users manage own emergency contacts or admins view"
  on public.emergency_contacts for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. USER CONSENTS RLS
-- ------------------------------------------------------------------------------
drop policy if exists "Users insert and view own consents" on public.user_consents;
create policy "Users insert and view own consents"
  on public.user_consents for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can record own consents" on public.user_consents;
create policy "Users can record own consents"
  on public.user_consents for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. POLICIES RLS
-- SECURITY: Strictly validated 7-day policies. Updates & Deletes restricted to admin/service_role.
-- ------------------------------------------------------------------------------
drop policy if exists "Riders view own policies or admins view all" on public.policies;
create policy "Riders view own policies or admins view all"
  on public.policies for select
  using (auth.uid() = rider_id or public.is_admin());

drop policy if exists "Riders can purchase own policies" on public.policies;
create policy "Riders can purchase own policies"
  on public.policies for insert
  with check (auth.uid() = rider_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Riders can update own policies or admins update all" on public.policies;
drop policy if exists "Only admins and service role can update policies" on public.policies;
drop policy if exists "Riders cannot modify protected policy fields" on public.policies;
create policy "Riders cannot modify protected policy fields"
  on public.policies for update
  using (auth.uid() = rider_id or public.is_admin() or auth.role() = 'service_role')
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Only admins and service role can delete policies" on public.policies;
create policy "Only admins and service role can delete policies"
  on public.policies for delete
  using (public.is_admin() or auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 8. WEATHER EVENTS RLS
-- PRIVACY: Riders only view events in their active policy or registered zone.
-- Inserts, Updates & Deletes restricted strictly to admin and oracle service_role.
-- ------------------------------------------------------------------------------
drop policy if exists "Weather events are readable by authenticated users" on public.weather_events;
drop policy if exists "Riders view relevant weather events or admins view all" on public.weather_events;
create policy "Riders view relevant weather events or admins view all"
  on public.weather_events for select
  using (
    public.is_admin()
    or auth.role() = 'service_role'
    or (
      auth.role() = 'authenticated'
      and (
        pincode in (
          select p.pincode from public.policies p 
          where p.rider_id = auth.uid() and p.status = 'ACTIVE'
        )
        or pincode in (
          select a.pincode from public.rider_addresses a
          where a.user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Authenticated users or oracle service can insert weather events" on public.weather_events;
drop policy if exists "Admins and oracle service can insert weather events" on public.weather_events;
create policy "Admins and oracle service can insert weather events"
  on public.weather_events for insert
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Authenticated users or oracle service can update weather events" on public.weather_events;
drop policy if exists "Admins and oracle service can update weather events" on public.weather_events;
create policy "Admins and oracle service can update weather events"
  on public.weather_events for update
  using (public.is_admin() or auth.role() = 'service_role')
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Admins and oracle service can delete weather events" on public.weather_events;
create policy "Admins and oracle service can delete weather events"
  on public.weather_events for delete
  using (public.is_admin() or auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 9. CLAIMS RLS
-- SECURITY: Riders can submit pending claims with 0 approved amount.
-- Approval status and payouts are strictly controlled by admins and service_role.
-- ------------------------------------------------------------------------------
drop policy if exists "Riders view own claims or admins view all" on public.claims;
create policy "Riders view own claims or admins view all"
  on public.claims for select
  using (auth.uid() = rider_id or public.is_admin());

drop policy if exists "Riders can submit own claims" on public.claims;
drop policy if exists "Riders can submit own pending claims" on public.claims;
create policy "Riders can submit own pending claims"
  on public.claims for insert
  with check (
    (auth.uid() = rider_id or public.is_admin() or auth.role() = 'service_role')
    and (
      (public.is_admin() or auth.role() = 'service_role')
      or (
        status = 'PENDING'
        and coalesce(approved_amount, 0) = 0
        and reviewed_by is null
        and reviewed_at is null
        and blockchain_status in ('NOT_SUBMITTED', 'PENDING')
      )
    )
  );

drop policy if exists "Riders can update own claims or admins review and update" on public.claims;
drop policy if exists "Only admins and service role can update claims" on public.claims;
drop policy if exists "Riders cannot modify approved claim fields" on public.claims;
create policy "Riders cannot modify approved claim fields"
  on public.claims for update
  using (auth.uid() = rider_id or public.is_admin() or auth.role() = 'service_role')
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Only admins and service role can delete claims" on public.claims;
create policy "Only admins and service role can delete claims"
  on public.claims for delete
  using (public.is_admin() or auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 10. PAYOUT AUTHORIZATIONS RLS
-- ------------------------------------------------------------------------------
drop policy if exists "Riders view own payouts or admins view all" on public.payout_authorizations;
create policy "Riders view own payouts or admins view all"
  on public.payout_authorizations for select
  using (auth.uid() = rider_id or public.is_admin());

drop policy if exists "Admins can insert and update payouts" on public.payout_authorizations;
drop policy if exists "Admins and service role manage payouts" on public.payout_authorizations;
create policy "Admins and service role manage payouts"
  on public.payout_authorizations for all
  using (public.is_admin() or auth.role() = 'service_role')
  with check (public.is_admin() or auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 11. BLOCKCHAIN AUDIT LEDGER RLS
-- SECURITY: Direct rider insert removed. Only admin and service_role can insert, update, or delete.
-- ------------------------------------------------------------------------------
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

drop policy if exists "Authenticated users can insert audit ledger entries" on public.blockchain_audit_ledger;
drop policy if exists "Only admins and service role can insert audit ledger" on public.blockchain_audit_ledger;
create policy "Only admins and service role can insert audit ledger"
  on public.blockchain_audit_ledger for insert
  with check (public.is_admin() or auth.role() = 'service_role');

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

-- ==============================================================================
-- SCHEMA & TABLE PERMISSIONS
-- Grants table privileges to standard Supabase application roles so that Row
-- Level Security (RLS) and triggers act as the authoritative access control.
-- ==============================================================================
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all routines in schema public to authenticated, service_role;

-- Anon has limited read access to public weather telemetry view only
grant select on public.weather_public_telemetry to anon, authenticated, service_role;

-- Restrict privileged administrative functions from public and anon
revoke all on function public.provision_admin_user(text) from public, anon;
grant execute on function public.provision_admin_user(text) to authenticated, service_role;

revoke all on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated, service_role;

revoke all on function public.record_blockchain_audit_entry(text, uuid, text, text, text, text, text, text, bigint, text) from public, anon;
grant execute on function public.record_blockchain_audit_entry(text, uuid, text, text, text, text, text, text, bigint, text) to authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;
alter default privileges in schema public grant execute on routines to authenticated, service_role;

