"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionProfile } from "./auth";
import { supabaseConfigured } from "./supabase/client";
import { AthleteBrowse, fetchAthletes } from "./coachData";

export type CoachStatus = "loading" | "unconfigured" | "pending" | "ready";

// Gates the coach section: must be a signed-in, verified coach. Loads the
// athlete pool once ready. Shared by /coaches and /coaches/saved.
export function useCoachGuard(): { status: CoachStatus; athletes: AthleteBrowse[] } {
  const router = useRouter();
  const [status, setStatus] = useState<CoachStatus>("loading");
  const [athletes, setAthletes] = useState<AthleteBrowse[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabaseConfigured) {
        setStatus("unconfigured");
        return;
      }
      const profile = await getSessionProfile();
      if (cancelled) return;
      if (!profile) return router.replace("/signin");
      if (profile.userType !== "coach") return router.replace("/discover");
      if (!profile.verified) {
        setStatus("pending");
        return;
      }
      try {
        const list = await fetchAthletes();
        if (!cancelled) setAthletes(list);
      } finally {
        if (!cancelled) setStatus("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { status, athletes };
}
