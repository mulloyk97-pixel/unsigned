"use client";

import { useSyncExternalStore } from "react";
import { AthleteProfile } from "./types";
import { supabaseBrowser, supabaseConfigured } from "./supabase/client";

// The athlete recruiting card — what coaches will see. Persisted in
// localStorage for now (durable across sessions); the athlete_profiles +
// highlight_clips tables (supabase/schema.sql) are the future home once auth
// exists. Prefilled from the intake profile so the card isn't empty on day one.

const CARD_KEY = "unsigned:athlete-card";
const INTAKE_KEY = "unsigned:profile";

// Every stat is stored as a string for flexible input. All stats stay visible
// to coaches regardless of order or feature state — featuring only changes
// prominence, never hides data.
export type StatKey =
  | "gpa" | "act" | "sat"
  | "height" | "weight" | "position" | "ppg" | "rpg" | "apg";

export const STAT_META: Record<StatKey, { label: string; group: "Academic" | "Athletic"; hint?: string }> = {
  gpa: { label: "GPA", group: "Academic", hint: "0–4.0" },
  act: { label: "ACT", group: "Academic" },
  sat: { label: "SAT", group: "Academic" },
  height: { label: "Height", group: "Athletic", hint: "e.g. 6'2\"" },
  weight: { label: "Weight", group: "Athletic", hint: "lbs" },
  position: { label: "Position", group: "Athletic", hint: "PG/SG/SF/PF/C" },
  ppg: { label: "PPG", group: "Athletic" },
  rpg: { label: "RPG", group: "Athletic" },
  apg: { label: "APG", group: "Athletic" },
};

export const ALL_STATS: StatKey[] = [
  "gpa", "act", "sat", "height", "weight", "position", "ppg", "rpg", "apg",
];

export interface HighlightClip {
  id: string;
  url: string;
  title: string;
  description?: string;
  thumbnailUrl: string | null;
}

export interface AthleteCard {
  photoUrl: string | null;
  name: string;
  gradYear: string;
  highSchool: string;
  location: string;
  // stat values (all strings)
  gpa: string; act: string; sat: string;
  height: string; weight: string; position: string;
  ppg: string; rpg: string; apg: string;
  order: StatKey[]; // display order of non-featured stat blocks
  featured: StatKey[]; // stats pinned to the prominent top strip
  clips: HighlightClip[];
}

function emptyCard(): AthleteCard {
  return {
    photoUrl: null, name: "", gradYear: "", highSchool: "", location: "",
    gpa: "", act: "", sat: "", height: "", weight: "", position: "",
    ppg: "", rpg: "", apg: "",
    order: [...ALL_STATS], featured: [], clips: [],
  };
}

// Build a starting card from the intake profile (best-effort, client only).
function prefillFromIntake(): AthleteCard {
  const card = emptyCard();
  if (typeof window === "undefined") return card;
  try {
    const raw = window.localStorage.getItem(INTAKE_KEY) ?? window.sessionStorage.getItem(INTAKE_KEY);
    if (!raw) return card;
    const p = JSON.parse(raw) as AthleteProfile;
    card.name = p.name ?? "";
    card.gradYear = p.gradYear ? String(p.gradYear) : "";
    card.location = p.state ?? "";
    card.position = p.position ?? "";
    card.gpa = p.gpa != null ? p.gpa.toFixed(2) : "";
    if (p.testType === "ACT" && p.testScore) card.act = String(p.testScore);
    if (p.testType === "SAT" && p.testScore) card.sat = String(p.testScore);
  } catch {
    /* fall back to empty */
  }
  return card;
}

// --- store (useSyncExternalStore) -----------------------------------------

let cache: AthleteCard | null = null;
const listeners = new Set<() => void>();

function read(): AthleteCard {
  if (cache) return cache;
  let card: AthleteCard | null = null;
  try {
    const raw = window.localStorage.getItem(CARD_KEY);
    if (raw) card = { ...emptyCard(), ...(JSON.parse(raw) as Partial<AthleteCard>) };
  } catch {
    card = null;
  }
  cache = card ?? prefillFromIntake();
  return cache;
}

function commit(next: AthleteCard) {
  cache = next;
  try {
    window.localStorage.setItem(CARD_KEY, JSON.stringify(next));
  } catch {
    // localStorage quota (e.g. a large photo data URL) — keep it in memory so
    // the session still works.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const SERVER_SNAPSHOT = emptyCard();

export function useAthleteCard(): AthleteCard {
  return useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);
}

// --- mutations -------------------------------------------------------------

export function updateCard(patch: Partial<AthleteCard>) {
  commit({ ...read(), ...patch });
}

export function reorderStats(order: StatKey[]) {
  commit({ ...read(), order });
}

export function toggleFeatured(key: StatKey) {
  const c = read();
  const featured = c.featured.includes(key)
    ? c.featured.filter((k) => k !== key)
    : [...c.featured, key];
  commit({ ...c, featured });
}

export function addClip(input: { url: string; title: string; description?: string }) {
  const c = read();
  const clip: HighlightClip = {
    id: crypto.randomUUID(),
    url: input.url.trim(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    thumbnailUrl: youtubeThumb(input.url),
  };
  commit({ ...c, clips: [...c.clips, clip] });
}

export function removeClip(id: string) {
  const c = read();
  commit({ ...c, clips: c.clips.filter((cl) => cl.id !== id) });
}

// --- Supabase sync ---------------------------------------------------------
// Push the card to the signed-in athlete's athlete_profiles row so coaches see
// real numbers (GPA, ACT, position, stats…) instead of dashes. This is the
// unification of the local card with the DB. No-op when not configured / not
// signed in (e.g. the local-only dev flow).

function numOrNull(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
function intOrNull(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export async function syncCardToSupabase(card: AthleteCard = read()): Promise<void> {
  if (!supabaseConfigured) return;
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("athlete_profiles")
    .update({
      photo_url: card.photoUrl,
      name: card.name || null,
      grad_year: intOrNull(card.gradYear),
      high_school: card.highSchool || null,
      location: card.location || null,
      gpa: numOrNull(card.gpa),
      act: intOrNull(card.act),
      sat: intOrNull(card.sat),
      height: card.height || null,
      weight: card.weight || null,
      position: card.position || null,
      ppg: numOrNull(card.ppg),
      rpg: numOrNull(card.rpg),
      apg: numOrNull(card.apg),
      featured_stats: card.featured,
      section_order: card.order,
    })
    .eq("user_id", user.id);
}

// Derive a thumbnail straight from the YouTube video id — no API/CORS needed.
// (oEmbed would also work but isn't CORS-friendly from the browser.)
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
