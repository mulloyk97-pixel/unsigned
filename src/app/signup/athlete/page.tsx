"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMPETITION_LEVELS, CompetitionLevel, Sport, SPORTS } from "@/lib/types";
import { signUpAthlete } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";
import { AuthField, AuthSection, AuthTopBar, authInput } from "@/components/AuthForm";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function AthleteSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: "", email: "", password: "",
    sport: "mens-basketball" as Sport, gradYear: "2026", highSchool: "", state: "",
    level: "" as CompetitionLevel | "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  function next() {
    setError(null);
    if (step === 1) {
      if (!f.name.trim()) return setError("Add your name.");
      if (!/.+@.+\..+/.test(f.email)) return setError("Enter a valid email.");
      if (f.password.length < 6) return setError("Password needs at least 6 characters.");
    }
    if (step === 2) {
      if (!f.highSchool.trim()) return setError("Add your high school.");
      if (!f.state) return setError("Pick your home state.");
    }
    setStep((s) => s + 1);
  }

  async function finish() {
    setError(null);
    if (!f.level) return setError("Pick the level you've honestly played.");
    if (!supabaseConfigured) return setError("Auth isn't configured yet (missing Supabase keys).");
    setBusy(true);
    try {
      await signUpAthlete({
        name: f.name.trim(), email: f.email.trim(), password: f.password,
        sport: f.sport, gradYear: parseInt(f.gradYear, 10),
        highSchool: f.highSchool.trim(), state: f.state, level: f.level,
      });
      router.push("/discover");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <AuthTopBar step={step} total={3} onBack={() => (step === 1 ? router.push("/") : setStep((s) => s - 1))} />

      {step === 1 && (
        <AuthSection title="Create your account" sub="This is your login. Your card comes next.">
          <AuthField label="Your name"><input className={authInput} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="First and last" /></AuthField>
          <AuthField label="Email"><input className={authInput} type="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></AuthField>
          <AuthField label="Password"><input className={authInput} type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" /></AuthField>
        </AuthSection>
      )}

      {step === 2 && (
        <AuthSection title="The basics" sub="Coaches sort by these first.">
          <AuthField label="Sport">
            <select className={authInput} value={f.sport} onChange={(e) => set("sport", e.target.value as Sport)}>
              {SPORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </AuthField>
          <div className="grid grid-cols-2 gap-3">
            <AuthField label="Grad year">
              <select className={authInput} value={f.gradYear} onChange={(e) => set("gradYear", e.target.value)}>
                {["2026","2027","2028","2029"].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </AuthField>
            <AuthField label="Home state">
              <select className={authInput} value={f.state} onChange={(e) => set("state", e.target.value)}>
                <option value="">Pick one</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </AuthField>
          </div>
          <AuthField label="High school"><input className={authInput} value={f.highSchool} onChange={(e) => set("highSchool", e.target.value)} placeholder="School name" /></AuthField>
        </AuthSection>
      )}

      {step === 3 && (
        <AuthSection title="What level have you honestly played?" sub="The biggest factor in an accurate read. Nobody sees this but you.">
          <div className="flex flex-col gap-2">
            {COMPETITION_LEVELS.map((lvl) => (
              <label key={lvl.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${f.level === lvl.value ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
                <input type="radio" name="level" checked={f.level === lvl.value} onChange={() => set("level", lvl.value)} className="mt-1 accent-[var(--color-accent)]" />
                <span>
                  <span className="block text-[15px] font-medium text-fg">{lvl.label}</span>
                  <span className="block text-xs text-muted">{lvl.help}</span>
                </span>
              </label>
            ))}
          </div>
        </AuthSection>
      )}

      {error && <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}

      <div className="mt-auto pt-6">
        {step < 3 ? (
          <button onClick={next} className="w-full rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition">Continue</button>
        ) : (
          <button onClick={finish} disabled={busy} className="w-full rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition disabled:opacity-60">
            {busy ? "Creating your account…" : "Start exploring"}
          </button>
        )}
      </div>
    </div>
  );
}
