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
- Programs + fit scoring: `src/lib/programs.ts`. Seed is 24 **real D-III
  basketball** programs (accurate location/conference); costs are approximate,
  win/loss records are PLACEHOLDERS, and only some `coachVerified`. The full
  NCAA directory import is a future bulk-load into the `programs` table — schema
  in `supabase/schema.sql` mirrors the `Program` type 1:1.
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
