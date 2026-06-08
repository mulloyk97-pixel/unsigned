"use client";

import { STAT_META, StatKey } from "./athleteCard";
import { supabaseBrowser } from "./supabase/client";

// Athlete data for the coach browse, read from Supabase (RLS lets verified
// coaches read athlete_profiles + highlight_clips).

export interface AthleteBrowse {
  id: string;
  name: string;
  position: string;
  gradYear: string;
  highSchool: string;
  state: string;
  photoUrl: string | null;
  gpa: string;
  act: string;
  stats: Record<StatKey, string>;
  featured: StatKey[];
  clipCount: number;
}

export interface FilterState {
  position: string; // "all" | PG/SG/SF/PF/C
  gradYear: string; // "all" | 2026..2029
  state: string; // "all" | XX
  minGpa: number; // 2.0 .. 4.0
}

export const DEFAULT_FILTERS: FilterState = { position: "all", gradYear: "all", state: "all", minGpa: 2.0 };

const STAT_KEYS = Object.keys(STAT_META) as StatKey[];

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

export async function fetchAthletes(): Promise<AthleteBrowse[]> {
  const supabase = supabaseBrowser();
  const [{ data: rows, error }, { data: clips }] = await Promise.all([
    supabase.from("athlete_profiles").select("*"),
    supabase.from("highlight_clips").select("athlete_id"),
  ]);
  if (error) throw error;

  const clipCounts = new Map<string, number>();
  for (const c of clips ?? []) {
    const id = (c as { athlete_id: string }).athlete_id;
    clipCounts.set(id, (clipCounts.get(id) ?? 0) + 1);
  }

  return (rows ?? []).map((r): AthleteBrowse => {
    const row = r as Record<string, unknown>;
    const stats = {} as Record<StatKey, string>;
    for (const k of STAT_KEYS) stats[k] = str(row[k]);
    const featuredRaw = (row.featured_stats as string[] | null) ?? [];
    let featured = featuredRaw.filter((k): k is StatKey => STAT_KEYS.includes(k as StatKey) && Boolean(stats[k as StatKey]));
    if (featured.length === 0) {
      featured = (["ppg", "rpg", "apg"] as StatKey[]).filter((k) => stats[k]);
    }
    return {
      id: str(row.id),
      name: str(row.name) || "Unnamed athlete",
      position: str(row.position),
      gradYear: str(row.grad_year),
      highSchool: str(row.high_school),
      state: str(row.state) || str(row.location),
      photoUrl: (row.photo_url as string | null) ?? null,
      gpa: str(row.gpa),
      act: str(row.act),
      stats,
      featured: featured.slice(0, 3),
      clipCount: clipCounts.get(str(row.id)) ?? 0,
    };
  });
}

export function applyFilters(list: AthleteBrowse[], f: FilterState): AthleteBrowse[] {
  return list.filter((a) => {
    if (f.position !== "all" && a.position.toUpperCase() !== f.position) return false;
    if (f.gradYear !== "all" && a.gradYear !== f.gradYear) return false;
    if (f.state !== "all" && a.state.toUpperCase() !== f.state) return false;
    if (f.minGpa > 2.0) {
      const gpa = parseFloat(a.gpa);
      if (Number.isNaN(gpa) || gpa < f.minGpa) return false;
    }
    return true;
  });
}
