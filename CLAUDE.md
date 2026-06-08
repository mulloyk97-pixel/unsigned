@AGENTS.md

# Unsigned

Recruiting platform for overlooked **D-III, JUCO, and NAIA** athletes who can't
afford or don't trust the big paid services (NCSA, etc.).

**Core differentiator:** honest, accurate level assessment. Competitors inflate
profiles to justify a fee. Unsigned tells the truth about where an athlete can
realistically play, then surfaces right-fit programs they've never heard of.
Voice: _"we'd rather tell you the truth than sell you a dream."_

Free for athletes. Monetized later via clubs and programs.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase
(optional) · Groq (optional).

## Design system (dark, athletic — "scout report, not SaaS")
Tokens live in `src/app/globals.css` (`@theme inline`); use the semantic
utilities, not raw hexes:
- `bg-bg` #0C0C0D · `bg-surface` #161618 · `bg-elevated` #1E1E21 ·
  `border-line` #2A2A2D · `text-fg` #F5F5F5 · `text-muted` #8A8A8F ·
  `text-accent`/`bg-accent` #F97316 (`accent-hover` #EA6C0A) ·
  `text-success` #22C55E · `text-danger` #EF4444.
- Soft fills via opacity, e.g. `bg-accent/10`, `border-success/30`.
- Fonts (next/font): **Barlow Condensed** for headings/big numbers
  (`font-head`, applied to h1–h3 automatically), **Inter** for body
  (`font-sans`). Stats use `.tnum` (tabular-nums).
- Rules: dark only, no white/gray surfaces, no default-blue links (accent
  orange), radius ≤ 12px (`rounded-xl` cards, `rounded-lg` buttons/inputs,
  `rounded-full` pills only), no drop shadows, no gradient buttons. Every
  screen is capped at **430px** centered (`AppChrome` owns the container).
- Microcopy is human and sport-specific everywhere (empty states, errors,
  placeholders) — never "No results" / "Loading…" / "Enter your X".

## Athlete flow — three screens (basketball-first as of phase 2)
1. **Intake** (`/intake`) — sport/position, GPA, test, level played, film,
   location, budget. Honesty copy throughout. Default sport: men's basketball.
2. **Honest assessment** (`/assessment`) — NO division verdict (telling an
   athlete they're not D-I is patronizing). Two sections only: **"What makes you
   a real recruit"** (genuine strengths) and **"Your honest challenge"** (one
   blunt phrase). Coach-who-respects-you tone.
3. **School discovery** (`/discover`) — Tinder-style swipe deck. Swipe/♥ to save,
   swipe/✕ to pass, tap a card to expand. After the deck, saved schools list
   with coach contact + draft intro **for verified coaches only**. Replaces the
   old `/shortlist`.

Not building: coach dashboard, auth, payments, outreach automation, film
analysis. Stay in the athlete flow.

## Auth + accounts (Supabase)
- Accent is **green** (`#22C55E`) as of the signup build (was orange).
- Entry is the **hero** (`/`) → "I'm an athlete" (`/signup/athlete`) / "I'm a
  coach" (`/signup/coach`) / "Sign in" (`/signin`). Auth screens render their
  own full-bleed layout (see `BARE_ROUTES` in `AppChrome`).
- **Supabase Auth** via `@supabase/ssr`: browser client `src/lib/supabase/client.ts`
  (lazy singleton — never instantiate at module top level or it breaks build),
  server client `src/lib/supabase/server.ts`, session refresh + route gating in
  `src/middleware.ts` (auth-presence only; user_type/verified checked in pages).
- `src/lib/auth.ts`: signUpAthlete/signUpCoach/signIn/signOut/getSessionProfile.
  Signup writes `profiles.user_type` + the athlete/coach row. Coaches start
  `verified=false` → `/coaches` shows a "Verification pending" gate (admin flips
  the flag manually via service role). Routing: athletes→`/discover`,
  coaches→`/coaches`.
- **Setup required to run auth** (it won't function without it): create a
  Supabase project, run `supabase/schema.sql` (tables + RLS), turn OFF email
  confirmation, put the URL + anon key in `.env.local`. See `.env.local.example`.
- **Known integration gap:** `/discover` + the profile card still read the
  working athlete profile from local storage; `signUpAthlete` bridges by seeding
  it (GPA/budget aren't collected at signup — added on the profile card). Next
  step is unifying that local copy with the Supabase `athlete_profiles` row.
- Coach browse (`/coaches`): verified-only; mirrors Explore with athlete cards
  (`AthleteDeck`), a filter bottom sheet (position/grad/state/min GPA), saved
  list, and a coach bottom tab bar (Discover/Saved/Messages). Reads
  `athlete_profiles` via `src/lib/coachData.ts`.

## Tab navigation + profile (phase 2b)
- `AppChrome` (`src/components/AppChrome.tsx`) is the app shell: a top bar
  (avatar → `/profile`, `+` placeholder) and bottom tab bar — **Explore**
  (`/discover`), **Highlights** (`/highlights`, placeholder), **Messages**
  (`/messages`, placeholder). It's route-aware: onboarding/landing (`/`,
  `/intake`, `/assessment`) keep a plain brand header, no tabs.
- **`/profile` — the athlete recruiting card** (what coaches will see). Header
  (uploadable photo, name/grad/HS/location, not reorderable) + stat blocks
  (Academic GPA/ACT/SAT, Athletic height/weight/position/PPG/RPG/APG) that are
  **drag-reorderable** and have a **★ "feature this"** toggle (featured stats
  pin to a prominent top strip). All stats stay visible to coaches regardless of
  order — no hiding GPA. Plus a highlights list (YouTube/Hudl links; YouTube
  thumbnails derived from the video id; store URL only). Edit-mode toggle.
- State lives in `src/lib/athleteCard.ts` — a localStorage-backed
  `useSyncExternalStore` store, prefilled from the intake profile. The
  `athlete_profiles` / `highlight_clips` tables (in `supabase/schema.sql`) are
  the future home once auth exists; not wired yet.
- `ReorderList` (`src/components/ReorderList.tsx`) is a ref-free, touch-friendly
  pointer drag-reorder; parent owns the order.

## Architecture notes
- The athlete flow is a single mobile session. The working profile lives in
  `sessionStorage` (`src/lib/profile.ts`, read via the `useSyncExternalStore`
  hook in `src/lib/useProfile.ts` — note React 19 forbids sync setState in
  effects, hence the store hook).
- **Assessment is semi-manual / rule-based** (`src/lib/assessment.ts`) on
  purpose. The moat is honest data + trust, not algorithmic complexity. Tune the
  heuristics as outcome data accumulates; never inflate. `matchDivisions` and
  `levelRank` are internal (ranking only, never displayed).
- Programs + fit scoring: `src/lib/programs.ts`. It loads
  `src/lib/programs.data.json` — **all 415 NCAA D-III institutions** (accurate
  school/city/state/conference; women-only colleges get women's basketball only)
  — and normalizes each into a `Program`, applying enrichment when present and
  conservative PLACEHOLDER defaults otherwise. `CURATED` overrides set athletic
  tiers + a few demo-verified coach contacts (sample data).
- **Data pipeline** (`scripts/`, run via npm):
  - `data:build` — regenerate the school list from the NCAA/Wikipedia directory.
  - `data:enrich` — fill academics + net price from College Scorecard (needs a
    free `SCORECARD_API_KEY` from api.data.gov; DEMO_KEY is rate-limited).
  - `data:import` — upsert the JSON into the Supabase `programs` table
    (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).
  Until `data:enrich` runs, un-enriched schools share placeholder academics/cost,
  so fit scores tie and rank alphabetically. Enrichment makes ranking meaningful.
  Coach contacts are never bulk-imported — verification is the moat.
- Schema for the future DB-backed reads: `supabase/schema.sql` (mirrors `Program`).
- Fit weights (basketball/D-III): athletic 35 / academic 30 (hard gate) /
  financial 20 / geographic 15. Win/loss is display-only, never a factor.
- Photos: `SchoolPhoto` renders a generated initial-on-color placeholder when
  `Program.photoUrl` is null; real photos slot in via that field.
- **Supabase and Groq are both optional.** The app runs fully without keys
  (sessionStorage flow + deterministic intro template in `src/lib/draftIntro.ts`).
  Add keys via `.env.local` (see `.env.local.example`) to enable persistence +
  AI-polished drafts. The Groq layer (`/api/draft-intro`) stays thin: it polishes
  phrasing, never invents claims.

## Commands
- `npm run dev` — local dev (http://localhost:3000)
- `npm run build` · `npm run lint`
