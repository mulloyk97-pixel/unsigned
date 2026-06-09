"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPETITION_LEVELS, Sport, SPORTS, TestType } from "@/lib/types";
import { supabaseConfigured } from "@/lib/supabase/client";
import { BuilderState, emptyBuilder, finalize, loadProgress, previewAthlete, saveProgress } from "@/lib/onboarding";
import { youtubeId } from "@/lib/athleteCard";
import { AthleteReport } from "@/components/coach/AthleteReport";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const input = "w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-fg outline-none focus:border-accent placeholder:text-muted";
const label = "block text-sm font-semibold text-fg mb-1.5";

const STEPS = [
  { key: "photo", title: "Your photo" },
  { key: "basics", title: "Your basics" },
  { key: "game", title: "Your game" },
  { key: "academics", title: "Your academics" },
  { key: "level", title: "Your level" },
  { key: "film", title: "Your film" },
  { key: "review", title: "Your card" },
];
const TOTAL = STEPS.length;

export default function BuildPage() {
  const router = useRouter();
  const [b, setB] = useState<BuilderState>(emptyBuilder());
  const [step, setStep] = useState(1);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof BuilderState>(k: K, v: BuilderState[K]) => setB((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = supabaseConfigured ? await loadProgress() : null;
      if (cancelled) return;
      if (existing) setB(existing);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  function validate(): string | null {
    if (step === 2 && !b.name.trim()) return "Add your name.";
    if (step === 2 && !b.state) return "Pick your home state.";
    if (step === 4 && !(parseFloat(b.gpa) >= 0)) return "GPA is required — coaches check it first.";
    return null;
  }

  async function next() {
    const v = validate();
    if (v) return setError(v);
    setError(null);
    setBusy(true);
    try {
      await saveProgress(b); // real-time: partial card is saved even if they drop off
    } finally {
      setBusy(false);
    }
    setStep((s) => Math.min(s + 1, TOTAL));
  }

  async function finish() {
    setBusy(true);
    try {
      await finalize(b);
      router.push("/discover");
    } catch {
      setError("Couldn't save your card. Try again.");
      setBusy(false);
    }
  }

  if (!ready) return <div className="flex flex-1 items-center justify-center text-sm text-muted">Loading your card…</div>;

  const preview = previewAthlete(b);

  return (
    <div className="flex flex-1 flex-col">
      {/* progress */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <button onClick={() => (step === 1 ? router.back() : setStep((s) => s - 1))} aria-label="Back" className="text-2xl leading-none text-muted">←</button>
          <span className="text-xs text-muted tnum">Step {step} of {TOTAL}</span>
          <span className="w-6" />
        </div>
        <div className="mt-3 h-1 rounded-full bg-surface overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5">
        {step < 7 && (
          <div className="mb-6 rounded-2xl bg-surface overflow-hidden">
            <CompactPreview b={b} />
          </div>
        )}

        <h1 className="font-head text-3xl font-bold tracking-tight text-fg">{STEPS[step - 1].title}</h1>

        {step === 1 && <PhotoStep b={b} set={set} />}
        {step === 2 && <BasicsStep b={b} set={set} />}
        {step === 3 && <GameStep b={b} set={set} />}
        {step === 4 && <AcademicsStep b={b} set={set} />}
        {step === 5 && <LevelStep b={b} set={set} />}
        {step === 6 && <FilmStep b={b} set={set} />}
        {step === 7 && <ReviewStep preview={preview} goto={setStep} />}

        {error && <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
      </div>

      {/* footer */}
      <div className="fixed bottom-0 inset-x-0 border-t border-line bg-bg">
        <div className="mx-auto w-full max-w-[430px] px-5 py-4 flex gap-3">
          {step === 7 ? (
            <button onClick={finish} disabled={busy} className="flex-1 rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition disabled:opacity-60">
              {busy ? "Saving your card…" : "Looks good — find my schools"}
            </button>
          ) : (
            <button onClick={next} disabled={busy} className="flex-1 rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition disabled:opacity-60">
              {busy ? "Saving…" : step === 1 && !b.photoUrl ? "Skip for now" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type StepProps = { b: BuilderState; set: <K extends keyof BuilderState>(k: K, v: BuilderState[K]) => void };

// --- compact live preview --------------------------------------------------

function CompactPreview({ b }: { b: BuilderState }) {
  const initial = b.name.trim().charAt(0).toUpperCase() || "?";
  const meta = [b.position, b.gradYear && `'${b.gradYear.slice(2)}`, b.state].filter(Boolean).join(" · ");
  const keys: [string, string][] = [["GPA", b.gpa], ["PPG", b.ppg], ["RPG", b.rpg], ["APG", b.apg]].filter(([, v]) => v) as [string, string][];
  return (
    <div>
      <div className="relative h-40 w-full">
        {b.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user data URL
          <img src={b.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <span className="font-head text-5xl font-bold text-muted/30">{initial}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-surface to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="font-head text-2xl font-bold leading-none text-white">{b.name || "Your name"}</p>
          {meta && <p className="text-[11px] text-white/70 mt-1">{meta}</p>}
        </div>
      </div>
      {keys.length > 0 && (
        <div className="flex gap-5 px-3 py-3">
          {keys.map(([l, v]) => (
            <div key={l}>
              <p className="font-head text-lg font-bold text-fg tnum leading-none">{v}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- steps -----------------------------------------------------------------

function PhotoStep({ b, set }: StepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("photoUrl", reader.result as string);
    reader.readAsDataURL(file);
  }
  return (
    <div className="mt-2 flex flex-col items-center text-center gap-4">
      <p className="text-[15px] text-muted">This is the first thing coaches see.</p>
      <button onClick={() => fileRef.current?.click()} className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-line text-muted">
        {b.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user data URL
          <img src={b.photoUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
        ) : (
          <span className="text-4xl">＋</span>
        )}
      </button>
      <button onClick={() => fileRef.current?.click()} className="text-sm font-medium text-accent">
        {b.photoUrl ? "Change photo" : "Upload a photo"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
      <p className="text-xs text-muted">No photo? You can skip — we&apos;ll use your initials.</p>
    </div>
  );
}

function BasicsStep({ b, set }: StepProps) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div><span className={label}>Name</span><input className={input} value={b.name} onChange={(e) => set("name", e.target.value)} placeholder="First and last" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Grad year</span>
          <select className={input} value={b.gradYear} onChange={(e) => set("gradYear", e.target.value)}>
            {["2026","2027","2028","2029"].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <span className={label}>Home state</span>
          <select className={input} value={b.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Pick one</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div><span className={label}>High school</span><input className={input} value={b.highSchool} onChange={(e) => set("highSchool", e.target.value)} placeholder="School name" /></div>
    </div>
  );
}

function GameStep({ b, set }: StepProps) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div>
        <span className={label}>Sport</span>
        <select className={input} value={b.sport} onChange={(e) => set("sport", e.target.value as Sport)}>
          {SPORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div><span className={label}>Position</span><input className={input} value={b.position} onChange={(e) => set("position", e.target.value)} placeholder="PG / SG / SF / PF / C" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><span className={label}>PPG</span><input className={input} inputMode="decimal" value={b.ppg} onChange={(e) => set("ppg", e.target.value)} placeholder="—" /></div>
        <div><span className={label}>RPG</span><input className={input} inputMode="decimal" value={b.rpg} onChange={(e) => set("rpg", e.target.value)} placeholder="—" /></div>
        <div><span className={label}>APG</span><input className={input} inputMode="decimal" value={b.apg} onChange={(e) => set("apg", e.target.value)} placeholder="—" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><span className={label}>Height</span><input className={input} value={b.height} onChange={(e) => set("height", e.target.value)} placeholder={`6'2"`} /></div>
        <div><span className={label}>Weight</span><input className={input} inputMode="numeric" value={b.weight} onChange={(e) => set("weight", e.target.value)} placeholder="lbs" /></div>
      </div>
    </div>
  );
}

function AcademicsStep({ b, set }: StepProps) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-sm text-muted">Coaches at D-III check transcripts. Be real here.</p>
      <div><span className={label}>GPA (0–4.0)</span><input className={input} inputMode="decimal" value={b.gpa} onChange={(e) => set("gpa", e.target.value)} placeholder="3.4" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Test (optional)</span>
          <select className={input} value={b.testType} onChange={(e) => set("testType", e.target.value as TestType)}>
            <option value="none">Haven&apos;t taken it</option>
            <option value="SAT">SAT</option>
            <option value="ACT">ACT</option>
          </select>
        </div>
        <div>
          <span className={label}>Score</span>
          <input className={input} inputMode="numeric" disabled={b.testType === "none"} value={b.testScore} onChange={(e) => set("testScore", e.target.value)} placeholder={b.testType === "ACT" ? "24" : "1100"} />
        </div>
      </div>
    </div>
  );
}

function LevelStep({ b, set }: StepProps) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-sm text-muted">What level have you honestly played? The biggest factor in an accurate read.</p>
      {COMPETITION_LEVELS.map((lvl) => (
        <label key={lvl.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${b.level === lvl.value ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
          <input type="radio" name="level" checked={b.level === lvl.value} onChange={() => set("level", lvl.value)} className="mt-1 accent-[var(--color-accent)]" />
          <span>
            <span className="block text-[15px] font-medium text-fg">{lvl.label}</span>
            <span className="block text-xs text-muted">{lvl.help}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function FilmStep({ b, set }: StepProps) {
  const yt = youtubeId(b.filmLink);
  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-sm text-muted">Optional — paste a Hudl or YouTube link. You can add more later from your profile.</p>
      <input className={input} inputMode="url" value={b.filmLink} onChange={(e) => set("filmLink", e.target.value)} placeholder="Paste your Hudl or YouTube link" />
      {yt && (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumb */}
          <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

function ReviewStep({ preview, goto }: { preview: ReturnType<typeof previewAthlete>; goto: (n: number) => void }) {
  return (
    <div className="mt-3 flex flex-col gap-4">
      <p className="text-[15px] text-muted">This is your card. Coaches will see this when they browse.</p>
      <div className="rounded-2xl bg-surface overflow-hidden">
        <AthleteReport a={preview} expanded />
      </div>
      <button onClick={() => goto(1)} className="rounded-lg border border-line px-4 py-3 text-sm font-medium text-fg">
        Edit my card
      </button>
    </div>
  );
}
