"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCoachGuard } from "@/lib/useCoachGuard";
import { savedAthletes, useSavedAthletes } from "@/lib/saved";
import { AthleteReport } from "@/components/coach/AthleteReport";
import { CoachTabs } from "@/components/coach/CoachTabs";

export default function CoachSavedPage() {
  const { status, athletes } = useCoachGuard();
  const savedIds = useSavedAthletes();
  const [openId, setOpenId] = useState<string | null>(null);

  const saved = useMemo(() => {
    const set = new Set(savedIds);
    return athletes.filter((a) => set.has(a.id));
  }, [athletes, savedIds]);

  if (status === "loading") return <Centered>Loading your list…</Centered>;
  if (status === "unconfigured") return <Centered>Coach tools need Supabase connected.</Centered>;
  if (status === "pending") return <Centered>Your coach account is still pending verification.</Centered>;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/coaches" aria-label="Back" className="text-2xl leading-none text-muted">←</Link>
          <span className="font-head text-xl font-bold tracking-tight text-fg">SAVED PLAYERS</span>
          <span className="w-6" />
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-24">
        {saved.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">No players saved yet — start swiping in Discover.</p>
            <Link href="/coaches" className="mt-3 inline-block text-sm font-medium text-accent">Go to Discover →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {saved.map((a) => {
              const open = openId === a.id;
              return (
                <div key={a.id} className="rounded-2xl bg-surface overflow-hidden">
                  {open ? (
                    <AthleteReport a={a} expanded />
                  ) : (
                    <div className="p-4 flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-elevated flex items-center justify-center">
                        {a.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- user data URL
                          <img src={a.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-head text-lg font-bold text-muted/50">{a.name.trim().charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{a.name}</p>
                        <p className="truncate text-xs text-muted">
                          {[a.position, a.gradYear, a.highSchool].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="ml-auto text-right leading-tight">
                        <p className="font-head text-lg font-bold text-fg tnum">{a.gpa || "—"}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted">GPA · ACT {a.act || "—"}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 border-t border-line p-3">
                    <button
                      onClick={() => setOpenId(open ? null : a.id)}
                      className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg active:scale-[0.99] transition"
                    >
                      {open ? "Hide profile" : "View full profile"}
                    </button>
                    <button
                      onClick={() => savedAthletes.remove(a.id)}
                      className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CoachTabs active="saved" />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">{children}</div>;
}
