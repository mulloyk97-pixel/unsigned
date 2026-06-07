"use client";

import { useSyncExternalStore } from "react";
import { AthleteProfile } from "./types";

const KEY = "unsigned:profile";

// Cache so getSnapshot returns a stable reference between renders (required by
// useSyncExternalStore -- otherwise it would loop).
let cache: { raw: string | null; value: AthleteProfile | null } = {
  raw: null,
  value: null,
};

function readSnapshot(): AthleteProfile | null {
  const raw = window.sessionStorage.getItem(KEY);
  if (raw === cache.raw) return cache.value;
  let value: AthleteProfile | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as AthleteProfile;
    } catch {
      value = null;
    }
  }
  cache = { raw, value };
  return value;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// Returns:
//   undefined -> not hydrated yet (server render + first client paint)
//   null      -> hydrated, no profile on file
//   profile   -> hydrated, profile present
export function useStoredProfile(): AthleteProfile | null | undefined {
  return useSyncExternalStore(subscribe, readSnapshot, () => undefined);
}
