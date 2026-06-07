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
