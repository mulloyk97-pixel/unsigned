"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { DEFAULT_FILTERS, FilterState, applyFilters } from "@/lib/coachData";
import { useCoachGuard } from "@/lib/useCoachGuard";
import { useSavedAthletes } from "@/lib/saved";
import AthleteDeck from "@/components/coach/AthleteDeck";
import { CoachTabs } from "@/components/coach/CoachTabs";
import ComingSoon from "@/components/ComingSoon";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function CoachesPage() {
  const router = useRouter();
  const { status, athletes } = useCoachGuard();
  const savedIds = useSavedAthletes();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const filtered = useMemo(() => applyFilters(athletes, filters), [athletes, filters]);
  const filterKey = JSON.stringify(filters);

  if (status === "loading") return <Centered>Checking your access…</Centered>;
  if (status === "unconfigured")
    return <Centered>Coach tools need Supabase connected — add your keys and run the schema, then refresh.</Centered>;

  if (status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface text-3xl text-muted">⏳</span>
        <h1 className="font-head text-3xl font-bold tracking-tight text-fg">Verification pending</h1>
        <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">
          We check every coach by hand so athletes can trust the badge. You&apos;ll get access within
          24 hours of approval.
        </p>
        <button onClick={() => signOut().then(() => router.push("/"))} className="mt-2 text-sm text-muted underline">Sign out</button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="font-head text-xl font-bold tracking-tight text-fg">UNSIGNED</span>
          <div className="flex items-center gap-3">
            <Link href="/coaches/saved" className="text-sm font-semibold text-accent tnum">{savedIds.length} saved →</Link>
            {!showMessages && (
              <button onClick={() => setFilterOpen(true)} aria-label="Filters" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-24">
        {showMessages ? (
          <ComingSoon title="Messages" blurb="Reaching out to athletes in-app is coming. For now, save the ones you like." />
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-head text-3xl font-bold tracking-tight text-fg">FIND PLAYERS</h1>
              <p className="mt-1 text-[15px] text-muted">Right-fit recruits, one at a time. Save the ones you want.</p>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface p-5 text-center">
                <h2 className="font-head text-2xl font-bold text-fg">No athletes match.</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {athletes.length === 0
                    ? "No athletes have signed up yet — you're early. They're coming."
                    : "Nothing fits these filters. Loosen them up to see more players."}
                </p>
              </div>
            ) : (
              <AthleteDeck key={filterKey} athletes={filtered} savedCount={savedIds.length} />
            )}
          </div>
        )}
      </div>

      <CoachTabs active={showMessages ? "messages" : "discover"} onDiscover={() => setShowMessages(false)} onMessages={() => setShowMessages(true)} />

      {filterOpen && (
        <FilterSheet initial={filters} onClose={() => setFilterOpen(false)} onApply={(f) => { setFilters(f); setFilterOpen(false); }} />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">{children}</div>;
}

function FilterSheet({ initial, onClose, onApply }: { initial: FilterState; onClose: () => void; onApply: (f: FilterState) => void }) {
  const [f, setF] = useState(initial);
  const positions = ["all", "PG", "SG", "SF", "PF", "C"];
  const years = ["all", "2026", "2027", "2028", "2029"];
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div className="mx-auto w-full max-w-[430px] rounded-t-xl border-t border-line bg-surface p-5 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-head text-xl font-bold text-fg">Filters</h2>
          <button onClick={() => setF(DEFAULT_FILTERS)} className="text-sm text-muted">Reset</button>
        </div>
        <ChipRow label="Position" options={positions} value={f.position} onChange={(v) => setF({ ...f, position: v })} />
        <ChipRow label="Grad year" options={years} value={f.gradYear} onChange={(v) => setF({ ...f, gradYear: v })} />
        <div>
          <p className="mb-1.5 text-sm font-semibold text-fg">Home state</p>
          <select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}
            className="w-full rounded-lg border border-line bg-bg px-3.5 py-3 text-[15px] text-fg outline-none focus:border-accent">
            <option value="all">Any state</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-fg">Minimum GPA</p>
            <span className="font-head text-lg font-bold text-accent tnum">{f.minGpa.toFixed(1)}</span>
          </div>
          <input type="range" min={2} max={4} step={0.1} value={f.minGpa}
            onChange={(e) => setF({ ...f, minGpa: parseFloat(e.target.value) })} className="w-full accent-[var(--color-accent)]" />
        </div>
        <button onClick={() => onApply(f)} className="rounded-lg bg-accent px-5 py-3.5 font-semibold text-bg active:scale-[0.99] transition">Show players</button>
      </div>
    </div>
  );
}

function ChipRow({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-fg">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition ${value === o ? "border-accent bg-accent/10 text-fg" : "border-line bg-bg text-muted"}`}>
            {o === "all" ? "All" : o}
          </button>
        ))}
      </div>
    </div>
  );
}
