"use client";

import { useSyncExternalStore } from "react";

// Persisted "saved" lists (localStorage). Saves used to live in component state
// and vanished on navigation; these stores back the dedicated /saved and
// /coaches/saved pages and keep the counters in sync. IDs only — the full
// records are rebuilt on the saved pages (programs from buildShortlist, athletes
// from Supabase).

const EMPTY: string[] = [];

function makeSetStore(key: string) {
  let cache: string[] | null = null;
  const listeners = new Set<() => void>();

  function read(): string[] {
    if (cache) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as string[]) : EMPTY;
    } catch {
      cache = EMPTY;
    }
    return cache;
  }
  function write(next: string[]) {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
    listeners.forEach((l) => l());
  }

  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot: read,
    has(id: string) {
      return read().includes(id);
    },
    add(id: string) {
      if (!read().includes(id)) write([...read(), id]);
    },
    remove(id: string) {
      write(read().filter((x) => x !== id));
    },
  };
}

export const savedSchools = makeSetStore("unsigned:saved-schools");
export const savedAthletes = makeSetStore("unsigned:saved-athletes");

export function useSavedSchools(): string[] {
  return useSyncExternalStore(savedSchools.subscribe, savedSchools.snapshot, () => EMPTY);
}
export function useSavedAthletes(): string[] {
  return useSyncExternalStore(savedAthletes.subscribe, savedAthletes.snapshot, () => EMPTY);
}
