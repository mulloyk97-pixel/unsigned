"use client";

import { AthleteProfile, CompetitionLevel, Sport, TestType } from "./types";
import { supabaseBrowser, supabaseConfigured } from "./supabase/client";
import { saveProfile } from "./profile";
import { StatKey, updateCard, youtubeId } from "./athleteCard";
import type { AthleteBrowse } from "./coachData";

// State + persistence for the card-builder onboarding (which IS the intake).
// Each step writes to athlete_profiles in real time, so a dropped-off card is
// still saved. finalize() seeds the local stores the explore + profile screens
// read, and routes onward.

export interface BuilderState {
  photoUrl: string | null;
  name: string;
  gradYear: string;
  highSchool: string;
  state: string;
  sport: Sport;
  position: string;
  ppg: string;
  rpg: string;
  apg: string;
  height: string;
  weight: string;
  gpa: string;
  testType: TestType;
  testScore: string;
  level: CompetitionLevel | "";
  filmLink: string;
}

export function emptyBuilder(): BuilderState {
  return {
    photoUrl: null, name: "", gradYear: "2026", highSchool: "", state: "",
    sport: "mens-basketball", position: "", ppg: "", rpg: "", apg: "",
    height: "", weight: "", gpa: "", testType: "none", testScore: "", level: "", filmLink: "",
  };
}

const num = (s: string): number | null => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : null);
const int = (s: string): number | null => (Number.isFinite(parseInt(s, 10)) ? parseInt(s, 10) : null);
const FEATURED: StatKey[] = ["ppg", "rpg", "apg"];

async function currentUserId(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getUser();
  return data.user?.id ?? null;
}

// Real-time write of everything collected so far (idempotent).
export async function saveProgress(b: BuilderState): Promise<void> {
  if (!supabaseConfigured) return;
  const uid = await currentUserId();
  if (!uid) return;
  await supabaseBrowser()
    .from("athlete_profiles")
    .update({
      photo_url: b.photoUrl,
      name: b.name || null,
      grad_year: int(b.gradYear),
      high_school: b.highSchool || null,
      location: b.state || null,
      state: b.state || null,
      sport: b.sport,
      position: b.position || null,
      level: b.level || null,
      gpa: num(b.gpa),
      act: b.testType === "ACT" ? int(b.testScore) : null,
      sat: b.testType === "SAT" ? int(b.testScore) : null,
      height: b.height || null,
      weight: b.weight || null,
      ppg: num(b.ppg),
      rpg: num(b.rpg),
      apg: num(b.apg),
      featured_stats: FEATURED,
    })
    .eq("user_id", uid);
}

// Resume a partially-built card.
export async function loadProgress(): Promise<BuilderState | null> {
  if (!supabaseConfigured) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  const { data } = await supabaseBrowser()
    .from("athlete_profiles")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  const str = (v: unknown) => (v == null ? "" : String(v));
  const testType: TestType = r.act != null ? "ACT" : r.sat != null ? "SAT" : "none";
  return {
    ...emptyBuilder(),
    photoUrl: (r.photo_url as string | null) ?? null,
    name: str(r.name),
    gradYear: r.grad_year ? str(r.grad_year) : "2026",
    highSchool: str(r.high_school),
    state: str(r.state) || str(r.location),
    sport: (r.sport as Sport) || "mens-basketball",
    position: str(r.position),
    ppg: str(r.ppg), rpg: str(r.rpg), apg: str(r.apg),
    height: str(r.height), weight: str(r.weight),
    gpa: str(r.gpa),
    testType,
    testScore: testType === "ACT" ? str(r.act) : testType === "SAT" ? str(r.sat) : "",
    level: (str(r.level) as CompetitionLevel) || "",
  };
}

// Live preview shaped exactly like the coach-facing card.
export function previewAthlete(b: BuilderState): AthleteBrowse {
  const stats = {
    gpa: b.gpa, act: b.testType === "ACT" ? b.testScore : "", sat: b.testType === "SAT" ? b.testScore : "",
    height: b.height, weight: b.weight, position: b.position, ppg: b.ppg, rpg: b.rpg, apg: b.apg,
  } as Record<StatKey, string>;
  return {
    id: "preview",
    name: b.name || "Your name",
    position: b.position,
    gradYear: b.gradYear,
    highSchool: b.highSchool,
    state: b.state,
    photoUrl: b.photoUrl,
    gpa: b.gpa,
    act: b.testType === "ACT" ? b.testScore : "",
    stats,
    featured: FEATURED.filter((k) => stats[k]),
    clipCount: b.filmLink ? 1 : 0,
  };
}

// Final step: make sure everything is persisted, add the film clip, and seed the
// local stores that /discover (fit scoring) and /profile read.
export async function finalize(b: BuilderState): Promise<void> {
  await saveProgress(b);

  if (supabaseConfigured && b.filmLink) {
    const uid = await currentUserId();
    if (uid) {
      const { data: row } = await supabaseBrowser()
        .from("athlete_profiles").select("id").eq("user_id", uid).maybeSingle();
      const athleteId = (row as { id?: string } | null)?.id;
      if (athleteId) {
        await supabaseBrowser().from("highlight_clips").insert({
          athlete_id: athleteId,
          url: b.filmLink,
          title: "Highlight film",
          thumbnail_url: youtubeId(b.filmLink) ? `https://img.youtube.com/vi/${youtubeId(b.filmLink)}/hqdefault.jpg` : null,
        });
      }
    }
  }

  // sessionStorage profile -> fit scoring on /discover
  const profile: AthleteProfile = {
    name: b.name, gradYear: parseInt(b.gradYear, 10) || new Date().getFullYear(),
    sport: b.sport, position: b.position, gpa: num(b.gpa) ?? 0,
    testType: b.testType, testScore: b.testType !== "none" ? int(b.testScore) : null,
    level: (b.level || "varsity-starter") as CompetitionLevel,
    filmLink: b.filmLink, state: b.state, budgetPerYear: 0, createdAt: new Date().toISOString(),
  };
  saveProfile(profile);

  // localStorage athlete card -> /profile display
  updateCard({
    photoUrl: b.photoUrl, name: b.name, gradYear: b.gradYear, highSchool: b.highSchool,
    location: b.state, gpa: b.gpa, act: b.testType === "ACT" ? b.testScore : "",
    sat: b.testType === "SAT" ? b.testScore : "", height: b.height, weight: b.weight,
    position: b.position, ppg: b.ppg, rpg: b.rpg, apg: b.apg, featured: [...FEATURED],
    clips: b.filmLink
      ? [{ id: crypto.randomUUID(), url: b.filmLink, title: "Highlight film", thumbnailUrl: youtubeId(b.filmLink) ? `https://img.youtube.com/vi/${youtubeId(b.filmLink)}/hqdefault.jpg` : null }]
      : [],
  });
}

// Returning users (signed in, no local profile): rebuild it from Supabase.
export async function hydrateProfile(): Promise<AthleteProfile | null> {
  const b = await loadProgress();
  if (!b || !b.name) return null;
  const profile: AthleteProfile = {
    name: b.name, gradYear: parseInt(b.gradYear, 10) || new Date().getFullYear(),
    sport: b.sport, position: b.position, gpa: num(b.gpa) ?? 0,
    testType: b.testType, testScore: b.testType !== "none" ? int(b.testScore) : null,
    level: (b.level || "varsity-starter") as CompetitionLevel,
    filmLink: b.filmLink, state: b.state, budgetPerYear: 0, createdAt: new Date().toISOString(),
  };
  saveProfile(profile);
  return profile;
}
