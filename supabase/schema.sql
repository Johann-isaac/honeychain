-- HoneyChain — Supabase schema
--
-- Run this once in your Supabase project's SQL Editor
-- (Project → SQL Editor → New query → paste → Run).
--
-- Row Level Security is enabled on every table with NO policies attached.
-- That means only the `service_role` key (used server-side only, in
-- lib/supabase/server.ts) can read or write these tables — the anon key
-- (which would ever ship to a browser) is locked out entirely, even if it
-- were accidentally exposed later. There is no client-side Supabase usage
-- in this app on purpose.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Beekeepers
-- ---------------------------------------------------------------------------
create table if not exists beekeepers (
  id uuid primary key default gen_random_uuid(),
  beekeeper_code text unique not null,
  name text not null,
  email text unique not null,
  region text not null,
  phone text,
  registration_status text not null default 'VERIFIED'
    check (registration_status in ('VERIFIED', 'PENDING', 'SUSPENDED')),
  joined_date timestamptz not null default now()
);

alter table beekeepers enable row level security;

-- ---------------------------------------------------------------------------
-- Hives — one row per physical hive / ESP32 device.
-- hive_code is what you flash into that hive's ESP32 firmware (HIVE_ID).
-- ---------------------------------------------------------------------------
create table if not exists hives (
  id uuid primary key default gen_random_uuid(),
  hive_code text unique not null,
  beekeeper_id uuid not null references beekeepers(id) on delete cascade,
  name text not null,
  location text not null,
  installation_date timestamptz not null default now(),
  queen_age int not null default 0,
  queen_status text not null default 'ACTIVE'
    check (queen_status in ('ACTIVE', 'AGING', 'UNKNOWN', 'REPLACED')),
  colony_strength int not null default 70,
  status text not null default 'HEALTHY'
    check (status in ('HEALTHY', 'ATTENTION', 'CRITICAL')),
  last_inspection timestamptz,
  next_inspection timestamptz,
  created_at timestamptz not null default now()
);

alter table hives enable row level security;
create index if not exists hives_beekeeper_id_idx on hives (beekeeper_id);

-- ---------------------------------------------------------------------------
-- Sensor readings — one row per ESP32 payload.
-- Maps 1:1 to the physical prototype: DHT22 (temperature, humidity),
-- load cell + HX711 (weight), analog microphone (sound_level), digital
-- vibration sensor (vibration).
-- ---------------------------------------------------------------------------
create table if not exists sensor_readings (
  id bigint generated always as identity primary key,
  hive_id uuid not null references hives(id) on delete cascade,
  temperature numeric not null,
  humidity numeric not null,
  weight numeric not null,
  sound_level integer not null,
  vibration boolean not null default false,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table sensor_readings enable row level security;
create index if not exists sensor_readings_hive_id_recorded_at_idx
  on sensor_readings (hive_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- Alerts — derived from live sensor anomalies (see lib/db.ts), persisted
-- so a beekeeper can dismiss one without it reappearing every page load.
-- ---------------------------------------------------------------------------
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  hive_id uuid not null references hives(id) on delete cascade,
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  title text not null,
  message text not null,
  recommendation text not null,
  timestamp timestamptz not null default now(),
  dismissed boolean not null default false
);

alter table alerts enable row level security;
create index if not exists alerts_hive_id_idx on alerts (hive_id);

-- ---------------------------------------------------------------------------
-- Honey batches
-- ---------------------------------------------------------------------------
create table if not exists honey_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text unique not null,
  hive_id uuid not null references hives(id),
  beekeeper_id uuid not null references beekeepers(id),
  harvest_date timestamptz not null,
  quantity numeric not null,
  honey_type text not null,
  floral_source text not null,
  extraction_method text not null,
  storage_temperature numeric not null,
  storage_location text not null,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'BLOCKCHAIN_REGISTERED', 'REGISTRATION_FAILED')),
  env_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table honey_batches enable row level security;
create index if not exists honey_batches_beekeeper_id_idx on honey_batches (beekeeper_id);

-- ---------------------------------------------------------------------------
-- Blockchain records — one per successfully registered batch.
-- ---------------------------------------------------------------------------
create table if not exists blockchain_records (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references honey_batches(id) on delete cascade,
  transaction_hash text not null,
  block_number bigint not null,
  network text not null,
  timestamp timestamptz not null default now(),
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED', 'PENDING', 'FAILED')),
  is_demo boolean not null default true,
  data_hash text not null
);

alter table blockchain_records enable row level security;
create index if not exists blockchain_records_batch_id_idx on blockchain_records (batch_id);
