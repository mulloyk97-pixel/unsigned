"use client";

import { useRef, useState } from "react";
import { AthleteBrowse } from "@/lib/coachData";
import { savedAthletes } from "@/lib/saved";
import { AthleteReport } from "./AthleteReport";

const SWIPE_THRESHOLD = 110;

export default function AthleteDeck({
  athletes,
  savedCount,
}: {
  athletes: AthleteBrowse[];
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
    if (leaving === "right" && current) savedAthletes.add(current.id);
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

      <div className="relative h-[560px]">
        {next && <div className="absolute inset-x-2 top-2 bottom-0 rounded-2xl bg-surface/50 scale-[0.97]" />}
        <div
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          onTransitionEnd={finalize}
          style={{ transform, transition: dragging ? "none" : "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)" }}
          className="absolute inset-0 overflow-y-auto rounded-2xl bg-surface no-scrollbar touch-pan-y select-none"
        >
          <span className="pointer-events-none absolute top-5 right-5 z-10 rounded-lg border-2 border-success px-3 py-1 text-base font-bold uppercase text-success rotate-12"
            style={{ opacity: dx > 0 ? Math.min(dx / SWIPE_THRESHOLD, 1) : 0 }}>Save</span>
          <span className="pointer-events-none absolute top-5 left-5 z-10 rounded-lg border-2 border-danger px-3 py-1 text-base font-bold uppercase text-danger -rotate-12"
            style={{ opacity: dx < 0 ? Math.min(-dx / SWIPE_THRESHOLD, 1) : 0 }}>Pass</span>
          {current && <AthleteReport a={current} expanded={expanded} />}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button onClick={() => commit("left")} aria-label="Pass" className="h-16 w-16 rounded-full border border-line bg-surface text-2xl text-danger active:scale-95 transition">✕</button>
        <button onClick={() => commit("right")} aria-label="Save" className="h-16 w-16 rounded-full bg-accent text-2xl text-bg active:scale-95 transition">♥</button>
      </div>
    </div>
  );
}
