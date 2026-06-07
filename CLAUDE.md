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
