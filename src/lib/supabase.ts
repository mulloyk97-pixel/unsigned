import { AthleteProfile } from "./types";

// Supabase is optional at this stage. The app is fully usable without it
// (the flow runs on sessionStorage); when env vars are present we also persist
// intake submissions so we can start accumulating the honest outcome data that
// is the actual moat.
//
// Expected table (run in Supabase SQL editor):
//
//   create table athletes (
//     id uuid primary key default gen_random_uuid(),
//     created_at timestamptz default now(),
//     name text, grad_year int, sport text, position text,
//     gpa numeric, test_type text, test_score int,
//     level text, film_link text, state text, budget_per_year int
//   );

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(URL && ANON);

// Lightweight REST insert -- avoids pulling in the full client SDK for V1.
export async function saveProfileRemote(profile: AthleteProfile): Promise<void> {
  if (!supabaseEnabled) return;
  try {
    await fetch(`${URL}/rest/v1/athletes`, {
      method: "POST",
      headers: {
        apikey: ANON as string,
        Authorization: `Bearer ${ANON}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: profile.name,
        grad_year: profile.gradYear,
        sport: profile.sport,
        position: profile.position,
        gpa: profile.gpa,
        test_type: profile.testType,
        test_score: profile.testScore,
        level: profile.level,
        film_link: profile.filmLink,
        state: profile.state,
        budget_per_year: profile.budgetPerYear,
      }),
    });
  } catch {
    // Best-effort: never block the athlete's flow on persistence.
  }
}
