"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionProfile, signOut } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";
import { AthleteBrowse, DEFAULT_FILTERS, FilterState, applyFilters, fetchAthletes } from "@/lib/coachData";
import AthleteDeck from "@/components/coach/AthleteDeck";
import ComingSoon from "@/components/ComingSoon";

type Status = "loading" | "unconfigured" | "pending" | "ready";
type Tab = "discover" | "saved" | "messages";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function CoachesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [athletes, setAthletes] = useState<AthleteBrowse[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [saved, setSaved] = useState<AthleteBrowse[]>([]);
  const [tab, setTab] = useState<Tab>("discover");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabaseConfigured) { setStatus("unconfigured"); return; }
      const profile = await getSessionProfile();
      if (cancelled) return;
      if (!profile) return router.replace("/signin");
      if (profile.userType !== "coach") return router.replace("/discover");
      if (!profile.verified) { setStatus("pending"); return; }
      try {
        const list = await fetchAthletes();
        if (!cancelled) setAthletes(list);
      } finally {
        if (!cancelled) setStatus("ready");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const filtered = useMemo(() => applyFilters(athletes, filters), [athletes, filters]);
  const filterKey = JSON.stringify(filters);

  function onSave(a: AthleteBrowse) {
    setSaved((prev) => (prev.some((x) => x.id === a.id) ? prev : [...prev, a]));
  }

  if (status === "loading") return <Centered>Checking your access…</Centered>;

  if (status === "unconfigured") {
    return (
      <Centered>
        Coach tools need Supabase connected. Add your project keys to{" "}
        <span className="text-fg">.env.local</span> and run the schema, then refresh.
      </Centered>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface text-3xl text-muted">⏳</span>
        <h1 className="font-head text-3xl font-bold tracking-tight text-fg">Verification pending</h1>
        <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">
          We check every coach by hand so athletes can trust the badge. You&apos;ll get access within
          24 hours of approval.
        </p>
        <button onClick={() => signOut().then(() => router.push("/"))} className="mt-2 text-sm text-muted underline">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* coach top bar */}
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="font-head text-xl font-bold tracking-tight text-fg">UNSIGNED</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTab("saved")} className="text-sm font-semibold text-accent tnum">{saved.length} saved</button>
            {tab === "discover" && (
              <button onClick={() => setFilterOpen(true)} aria-label="Filters" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-24">
        {tab === "discover" && (
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
              <AthleteDeck key={filterKey} athletes={filtered} onSave={onSave} savedCount={saved.length} />
            )}
          </div>
        )}

        {tab === "saved" && <SavedAthletes saved={saved} onBrowse={() => setTab("discover")} />}
        {tab === "messages" && <ComingSoon title="Messages" blurb="Reaching out to athletes in-app is coming. For now, save the ones you like." />}
      </div>

      {/* coach bottom tabs */}
      <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-line bg-bg">
        <div className="mx-auto grid w-full max-w-[430px] grid-cols-3">
          <TabButton label="Discover" active={tab === "discover"} onClick={() => setTab("discover")} icon={PlayersIcon} />
          <TabButton label="Saved" active={tab === "saved"} onClick={() => setTab("saved")} icon={BookmarkIcon} />
          <TabButton label="Messages" active={tab === "messages"} onClick={() => setTab("messages")} icon={ChatIcon} />
        </div>
      </nav>

      {filterOpen && (
        <FilterSheet
          initial={filters}
          onClose={() => setFilterOpen(false)}
          onApply={(f) => { setFilters(f); setFilterOpen(false); }}
        />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">{children}</div>;
}

function SavedAthletes({ saved, onBrowse }: { saved: AthleteBrowse[]; onBrowse: () => void }) {
  if (saved.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-6 text-center">
        <p className="text-sm text-muted">No athletes saved yet — start swiping in Discover.</p>
        <button onClick={onBrowse} className="mt-3 text-sm font-medium text-accent">Go to Discover →</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-head text-3xl font-bold tracking-tight text-fg">YOUR LIST</h1>
      {saved.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
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
            <p className="truncate text-xs text-muted">{[a.position, a.gradYear, a.state].filter(Boolean).join(" · ")}</p>
          </div>
          <span className="ml-auto font-head text-lg font-bold text-fg tnum">{a.gpa || "—"}</span>
        </div>
      ))}
    </div>
  );
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
            onChange={(e) => setF({ ...f, minGpa: parseFloat(e.target.value) })}
            className="w-full accent-[var(--color-accent)]" />
        </div>

        <button onClick={() => onApply(f)} className="rounded-lg bg-accent px-5 py-3.5 font-semibold text-bg active:scale-[0.99] transition">
          Show players
        </button>
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

function TabButton({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: (p: { active?: boolean }) => React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide ${active ? "text-accent" : "text-muted"}`}>
      <Icon active={active} />
      {label}
    </button>
  );
}

function PlayersIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5a3 3 0 0 1 0 6" /><path d="M19 20a6 6 0 0 0-3-5.2" />
    </svg>
  );
}
function BookmarkIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function ChatIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}
