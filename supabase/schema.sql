-- Unsigned — Supabase schema (optional persistence layer).
--
-- The app runs fully without Supabase (sessionStorage + typed seed data). These
-- tables are the persistence target as we accumulate the honest outcome data
-- that is the actual moat. Run in the Supabase SQL editor.

-- Intake submissions (written best-effort from src/lib/supabase.ts).
create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  grad_year int,
  sport text,
  position text,
  gpa numeric,
  test_type text,
  test_score int,
  level text,
  film_link text,
  state text,
  budget_per_year int
);

-- College programs. Mirrors the Program type in src/lib/types.ts so a bulk
-- importer can load the NCAA member directory straight into this table and the
-- app can read from it instead of the seed array later.
--
-- `sport` is modeled as an array so adding sports is a data change, not a schema
-- change. coach_verified defaults to false; contact fields stay null until a
-- contact is confirmed. win_loss_last_season and photo_url are enrichment
-- fields (display-only; never used in ranking).
create table if not exists programs (
  id text primary key,
  school text not null,
  division text not null,                 -- 'DIII' | 'NAIA' | 'JUCO'
  conference text,
  city text,
  state text,
  region text,                            -- 'Northeast' | 'Midwest' | 'South' | 'West'
  sports text[] not null default '{}',    -- e.g. '{mens-basketball,womens-basketball}'
  selectivity text,                       -- 'selective' | 'moderate' | 'open'
  avg_gpa numeric,
  athletic_tier int,                      -- 1 (developing) .. 5 (perennial contender)
  sticker_cost int,
  typical_net_cost int,
  coach_verified boolean not null default false,
  coach_name text,
  coach_email text,
  win_loss_last_season text,              -- PLACEHOLDER until enriched
  photo_url text,
  blurb text,
  created_at timestamptz default now()
);

create index if not exists programs_sports_idx on programs using gin (sports);
create index if not exists programs_division_idx on programs (division);

-- ---------------------------------------------------------------------------
-- Phase 2 additions (athlete profiles, highlights, coaches, saves).
-- Documented here ahead of wiring; the app currently runs the profile card on
-- localStorage (see src/lib/athleteCard.ts). These land when auth exists.
-- ---------------------------------------------------------------------------

-- The athlete recruiting card. featured_stats / section_order are stat-key
-- arrays controlling prominence + display order; all stat values stay visible.
create table if not exists athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                       -- FK to auth.users once auth exists
  photo_url text,
  name text,
  grad_year int,
  high_school text,
  location text,
  state text,                         -- two-letter home state
  sport text,                         -- e.g. 'mens-basketball'
  level text,                         -- competition level played (matching signal)
  gpa numeric,
  act int,
  sat int,
  height text,
  weight text,
  position text,
  ppg numeric,
  rpg numeric,
  apg numeric,
  featured_stats text[] default '{}',
  section_order text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists highlight_clips (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  url text not null,
  title text,
  description text,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- Coach accounts. Verification is manual for now (admin sets verified = true).
create table if not exists coach_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  school text,
  sport text,
  role text,                          -- 'head' | 'assistant'
  verified boolean not null default false,
  created_at timestamptz default now()
);

-- Athlete saves a school from Explore.
create table if not exists saved_schools (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  program_id text references programs(id),
  created_at timestamptz default now(),
  unique (athlete_id, program_id)
);

-- Coach saves an athlete from browse.
create table if not exists saved_athletes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coach_profiles(id) on delete cascade,
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (coach_id, athlete_id)
);

-- ---------------------------------------------------------------------------
-- Auth: account-type routing + row-level security.
-- ---------------------------------------------------------------------------

-- One row per auth user, set at signup. Drives routing (athlete vs coach).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null check (user_type in ('athlete', 'coach')),
  created_at timestamptz default now()
);

-- athlete_profiles / coach_profiles link to auth.users via user_id.
alter table athlete_profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table coach_profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table coach_profiles add column if not exists role text;

-- Helper: is the current user a verified coach?
create or replace function is_verified_coach() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from coach_profiles c
    where c.user_id = auth.uid() and c.verified
  );
$$;

alter table profiles enable row level security;
alter table athlete_profiles enable row level security;
alter table coach_profiles enable row level security;
alter table highlight_clips enable row level security;
alter table saved_schools enable row level security;
alter table saved_athletes enable row level security;

-- profiles: a user manages only their own row.
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- athlete_profiles: owner full access; verified coaches may read everyone.
create policy "athlete owns profile" on athlete_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "verified coaches read athletes" on athlete_profiles
  for select using (is_verified_coach());

-- highlight_clips: owner full access; verified coaches may read.
create policy "athlete owns clips" on highlight_clips
  for all using (auth.uid() = (select user_id from athlete_profiles a where a.id = athlete_id))
  with check (auth.uid() = (select user_id from athlete_profiles a where a.id = athlete_id));
create policy "verified coaches read clips" on highlight_clips
  for select using (is_verified_coach());

-- coach_profiles: owner manages own; verified flag is set manually by an admin
-- (service role bypasses RLS).
create policy "coach owns profile" on coach_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- saves: each side manages only its own saves.
create policy "athlete owns saved schools" on saved_schools
  for all using (auth.uid() = (select user_id from athlete_profiles a where a.id = athlete_id))
  with check (auth.uid() = (select user_id from athlete_profiles a where a.id = athlete_id));
create policy "coach owns saved athletes" on saved_athletes
  for all using (auth.uid() = (select user_id from coach_profiles c where c.id = coach_id))
  with check (auth.uid() = (select user_id from coach_profiles c where c.id = coach_id));
