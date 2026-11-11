-- ShoreMigo Postgres schema (Supabase). Mirrors src/lib/server/store.ts DbShape.
-- STATUS: schema only. The running app uses the JSON-file adapter; a Supabase
-- adapter implementing the same tx/read boundary is not yet wired.

create table if not exists bookings (
  id uuid primary key,
  ref text unique not null,
  excursion_id text not null,
  original_excursion_id text not null,
  guests int not null check (guests between 1 and 8),
  first_name text not null,
  last_name text not null,
  email text not null,
  unit_price_cents int not null,
  total_cents int not null,
  paid_cents int not null default 0,
  status text not null check (status in ('pending_payment','confirmed','disrupted','rebooked','cancelled_refunded','expired')),
  pending_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id bigserial primary key,
  booking_id uuid not null references bookings(id),
  kind text not null check (kind in ('charge','refund')),
  provider text not null default 'paypal-sandbox',
  order_id text,
  capture_id text,
  refund_id text unique,
  amount_cents int not null,
  currency text not null default 'USD',
  status text not null,          -- exactly as returned by PayPal
  purpose text not null,
  verified_at timestamptz not null default now(),
  unique (kind, capture_id, order_id)
);

create table if not exists disruptions (
  port_id text primary key,
  delay_min int not null,
  all_aboard_extension_min int not null default 0,
  simulated boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists rescue_proposals (
  id uuid primary key,
  booking_id uuid not null references bookings(id),
  excursion_id text not null,
  delay_min int not null,
  original jsonb not null,
  options jsonb not null,
  status text not null check (status in ('open','awaiting_payment','resolved','dismissed')),
  operator_review text not null check (operator_review in ('pending','approved','rejected')),
  operator_note text,
  chosen_option_id text,
  supplement_order_id text,
  resolution text,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key,
  at timestamptz not null default now(),
  actor text not null,
  type text not null,
  booking_id uuid,
  detail jsonb not null default '{}'
);

create table if not exists engagement_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  type text not null,
  props jsonb not null default '{}'
);

-- All access goes through the server with the service role; no public access.
alter table bookings enable row level security;
alter table payments enable row level security;
alter table disruptions enable row level security;
alter table rescue_proposals enable row level security;
alter table audit_events enable row level security;
alter table engagement_events enable row level security;
