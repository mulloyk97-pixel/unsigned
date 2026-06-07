"use client";

import { AthleteProfile } from "./types";

// The athlete flow (intake -> assessment -> shortlist) is a single mobile
// session, so we keep the working profile in sessionStorage. Persisting to
// Supabase happens best-effort on top of this (see saveProfileRemote).

const KEY = "unsigned:profile";

export function saveProfile(profile: AthleteProfile): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(profile));
}

export function loadProfile(): AthleteProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AthleteProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
