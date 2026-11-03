-- Tracked trips and their status events, for usage data. Written only by the backend (service
-- role): RLS is on with no policies, so the public keys can't read or write them.
--
-- A trip is created by the app (its id is generated on the phone, so events can be queued
-- offline) and identified by a random per-install device id; user_id is set when the rider was
-- signed in.

create table if not exists public.trips (
  id uuid primary key,
  device_id text not null,
  user_id uuid references public.users (id) on delete set null,
  route_id text not null,
  route_codes text[] not null default '{}',
  start_lat double precision,
  start_lng double precision,
  end_lat double precision not null,
  end_lng double precision not null,
  fare numeric,
  started_at timestamptz not null,
  ended_at timestamptz,
  -- 'arrived' at the destination, or 'ended' by the rider before arriving
  outcome text check (outcome in ('arrived', 'ended')),
  created_at timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips (user_id);
create index if not exists trips_started_at_idx on public.trips (started_at);

create table if not exists public.trip_events (
  id uuid primary key,
  trip_id uuid not null references public.trips (id) on delete cascade,
  -- boarded: detected riding a jeep; get_off_soon: the alert before its stop; transferred: moved
  -- on to the next jeep; passed_place: rode past a popular place; arrived / ended: the trip's end
  kind text not null check (
    kind in ('boarded', 'get_off_soon', 'transferred', 'passed_place', 'arrived', 'ended')
  ),
  leg_index int,
  route_code text,
  place_id text,
  place_name text,
  lat double precision,
  lng double precision,
  -- m/s at the event, when known
  speed real,
  at timestamptz not null
);

create index if not exists trip_events_trip_id_idx on public.trip_events (trip_id);

alter table public.trips enable row level security;
alter table public.trip_events enable row level security;
