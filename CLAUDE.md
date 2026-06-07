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

## V1 scope — athlete side, three screens
1. **Intake** (`/intake`) — sport/position, GPA, test, level played, film,
   location, budget. Honesty copy throughout.
2. **Honest assessment** (`/assessment`) — blunt plain-language verdict on
   realistic division fit, with separate athletic + academic callouts.
3. **Right-fit shortlist** (`/shortlist`) — up to ~18 ranked programs (athletic,
   academic, financial, geographic). First card expanded with coach contact +
   draft intro email.

Not in v1: coach dashboard, marketplace, payments, automated outreach, film
analysis.

## Architecture notes
- The athlete flow is a single mobile session. The working profile lives in
  `sessionStorage` (`src/lib/profile.ts`, read via the `useSyncExternalStore`
  hook in `src/lib/useProfile.ts` — note React 19 forbids sync setState in
  effects, hence the store hook).
- **Assessment is semi-manual / rule-based** (`src/lib/assessment.ts`) on
  purpose. The moat is honest data + trust, not algorithmic complexity. Tune the
  heuristics as outcome data accumulates; never inflate.
- Programs + fit scoring: `src/lib/programs.ts`. The seed list is real,
  under-the-radar schools but costs are approximate and coach contacts are
  placeholder recruiting inboxes — verified data is the next build.
- **Supabase and Groq are both optional.** The app runs fully without keys
  (sessionStorage flow + deterministic intro template in `src/lib/draftIntro.ts`).
  Add keys via `.env.local` (see `.env.local.example`) to enable persistence +
  AI-polished drafts. The Groq layer (`/api/draft-intro`) stays thin: it polishes
  phrasing, never invents claims.

## Commands
- `npm run dev` — local dev (http://localhost:3000)
- `npm run build` · `npm run lint`
