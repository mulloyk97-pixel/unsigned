"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { homeFor, signIn } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";
import { AuthField, AuthSection, AuthTopBar, authInput } from "@/components/AuthForm";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabaseConfigured) return setError("Auth isn't configured yet (missing Supabase keys).");
    setBusy(true);
    try {
      const profile = await signIn(email.trim(), password);
      router.push(homeFor(profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign you in.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col px-5 py-6">
      <AuthTopBar onBack={() => router.push("/")} />

      <AuthSection title="Welcome back" sub="Pick up where you left off.">
        <AuthField label="Email">
          <input className={authInput} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </AuthField>
        <AuthField label="Password">
          <input className={authInput} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </AuthField>
      </AuthSection>

      {error && <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}

      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link href="/" className="text-center text-sm text-muted">
          Don&apos;t have an account? <span className="text-fg underline">Get started</span>
        </Link>
      </div>
    </form>
  );
}
