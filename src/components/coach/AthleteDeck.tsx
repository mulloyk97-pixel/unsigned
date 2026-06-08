"use client";

import { useRef, useState } from "react";
import { AthleteBrowse } from "@/lib/coachData";
import { STAT_META, StatKey } from "@/lib/athleteCard";

const SWIPE_THRESHOLD = 110;

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function AthletePhoto({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL / remote
    return <img src={photoUrl} alt="" className="h-full w-full object-cover bg-elevated" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-elevated">
      <span className="font-head text-6xl font-bold text-muted/40">{initials(name)}</span>
    </div>
  );
}

function BigNum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-center">
      <p className="font-head text-2xl font-bold text-fg tnum">{value || "—"}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function AthleteCardFace({ a, expanded }: { a: AthleteBrowse; expanded: boolean }) {
  const filledStats = (Object.keys(STAT_META) as StatKey[]).filter((k) => a.stats[k]);
  return (
    <div className="flex flex-col">
      <div className="relative w-full aspect-video">
        <AthletePhoto name={a.name} photoUrl={a.photoUrl} />
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-head text-2xl font-bold leading-none text-fg">{a.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {[a.position, a.gradYear && `Class of ${a.gradYear}`].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-muted">{[a.highSchool, a.state].filter(Boolean).join(" · ")}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <BigNum label="GPA" value={a.gpa} />
          <BigNum label="ACT" value={a.act} />
          {a.featured[0] ? <BigNum label={STAT_META[a.featured[0]].label} value={a.stats[a.featured[0]]} /> : <div />}
        </div>

        {a.featured.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {a.featured.slice(1, 4).map((k) => <BigNum key={k} label={STAT_META[k].label} value={a.stats[k]} />)}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19" /></svg>
          {a.clipCount} {a.clipCount === 1 ? "clip" : "clips"}
        </div>

        {expanded ? (
          <div className="mt-1 border-t border-line pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Full profile</p>
            {filledStats.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {filledStats.map((k) => <BigNum key={k} label={STAT_META[k].label} value={a.stats[k]} />)}
              </div>
            ) : (
              <p className="text-sm text-muted">This athlete hasn&apos;t filled in stats yet.</p>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-accent">Tap to view full profile</p>
        )}
      </div>
    </div>
  );
}

export default function AthleteDeck({
  athletes,
  onSave,
  savedCount,
}: {
  athletes: AthleteBrowse[];
  onSave: (a: AthleteBrowse) => void;
  savedCount: number;
}) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const moved = useRef(false);

  const current = athletes[index];
  const next = athletes[index + 1];
  const done = index >= athletes.length;

  function commit(dir: "left" | "right") {
    if (leaving) return;
    setLeaving(dir);
  }
  function finalize() {
    if (!leaving) return;
    if (leaving === "right" && current) onSave(current);
    setLeaving(null);
    setDx(0);
    setExpanded(false);
    setIndex((i) => i + 1);
  }
  function onPointerDown(e: React.PointerEvent) {
    if (leaving) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || leaving) return;
    const ndx = e.clientX - startX.current;
    if (Math.abs(ndx) > 6) moved.current = true;
    setDx(ndx);
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dx) > SWIPE_THRESHOLD) commit(dx > 0 ? "right" : "left");
    else {
      if (!moved.current) setExpanded((x) => !x);
      setDx(0);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5 text-center">
        <h2 className="font-head text-2xl font-bold text-fg">That&apos;s everyone for now.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You&apos;ve been through every athlete who fits your filters. Loosen the filters or check
          back — new players join every week.
        </p>
      </div>
    );
  }

  const transform = leaving
    ? `translateX(${leaving === "right" ? "120%" : "-120%"}) rotate(${leaving === "right" ? 14 : -14}deg)`
    : `translateX(${dx}px) rotate(${dx * 0.04}deg)`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted tnum">{index + 1} / {athletes.length}</span>
        <span className="font-semibold text-accent tnum">{savedCount} saved</span>
      </div>

      <div className="relative h-[490px]">
        {next && <div className="absolute inset-x-2 top-2 bottom-0 rounded-xl border border-line bg-surface/60 scale-[0.97]" />}
        <div
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          onTransitionEnd={finalize}
          style={{ transform, transition: dragging ? "none" : "transform 0.32s ease" }}
          className="absolute inset-0 overflow-y-auto rounded-xl border border-line bg-surface no-scrollbar touch-pan-y select-none"
        >
          <span className="pointer-events-none absolute top-5 right-5 z-10 rounded-lg border-2 border-success px-3 py-1 text-base font-bold uppercase text-success rotate-12"
            style={{ opacity: dx > 0 ? Math.min(dx / SWIPE_THRESHOLD, 1) : 0 }}>Save</span>
          <span className="pointer-events-none absolute top-5 left-5 z-10 rounded-lg border-2 border-danger px-3 py-1 text-base font-bold uppercase text-danger -rotate-12"
            style={{ opacity: dx < 0 ? Math.min(-dx / SWIPE_THRESHOLD, 1) : 0 }}>Pass</span>
          {current && <AthleteCardFace a={current} expanded={expanded} />}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button onClick={() => commit("left")} aria-label="Pass" className="h-16 w-16 rounded-full border border-line bg-surface text-2xl text-danger active:scale-95 transition">✕</button>
        <button onClick={() => commit("right")} aria-label="Save" className="h-16 w-16 rounded-full bg-accent text-2xl text-bg active:scale-95 transition">♥</button>
      </div>
    </div>
  );
}
