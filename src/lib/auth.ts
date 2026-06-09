"use client";

import { supabaseBrowser } from "./supabase/client";

// Auth + profile creation against Supabase. Email confirmation is expected to
// be OFF (see .env.local.example), so signUp returns an active session and the
// follow-up inserts run as the new user (RLS allows own-row writes).

export type UserType = "athlete" | "coach";

export interface SessionProfile {
  userId: string;
  userType: UserType | null;
  verified: boolean; // coaches only; athletes always true
}

export interface CoachSignup {
  name: string;
  email: string;
  password: string;
  school: string;
  sport: string;
  role: "head" | "assistant";
}

async function signUp(email: string, password: string, name: string) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error("Sign-up succeeded but no session was returned. Is email confirmation still on?");
  return user;
}

// Account only — the card (sport, stats, GPA, level, film…) is built next in
// /build, which writes to this same athlete_profiles row step by step.
export async function signUpAthlete(email: string, password: string): Promise<void> {
  const supabase = supabaseBrowser();
  const user = await signUp(email, password, "");

  const { error: pErr } = await supabase.from("profiles").insert({ id: user.id, user_type: "athlete" });
  if (pErr) throw pErr;

  const { error: aErr } = await supabase.from("athlete_profiles").insert({ user_id: user.id });
  if (aErr) throw aErr;
}

export async function signUpCoach(input: CoachSignup): Promise<void> {
  const supabase = supabaseBrowser();
  const user = await signUp(input.email, input.password, input.name);

  const { error: pErr } = await supabase.from("profiles").insert({ id: user.id, user_type: "coach" });
  if (pErr) throw pErr;

  const { error: cErr } = await supabase.from("coach_profiles").insert({
    user_id: user.id,
    name: input.name,
    school: input.school,
    sport: input.sport,
    role: input.role,
    verified: false,
  });
  if (cErr) throw cErr;
}

export async function signIn(email: string, password: string): Promise<SessionProfile> {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Signed in but no profile found.");
  return profile;
}

export async function signOut(): Promise<void> {
  await supabaseBrowser().auth.signOut();
}

// Resolve the current user's type + (for coaches) verification status.
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  const userType = (profile?.user_type as UserType | undefined) ?? null;

  let verified = true;
  if (userType === "coach") {
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("verified")
      .eq("user_id", user.id)
      .maybeSingle();
    verified = Boolean(coach?.verified);
  }

  return { userId: user.id, userType, verified };
}

export function homeFor(profile: SessionProfile): string {
  if (profile.userType === "coach") return "/coaches";
  return "/discover";
}
