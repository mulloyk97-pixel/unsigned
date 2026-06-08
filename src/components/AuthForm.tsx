// Shared building blocks for the auth screens (hero / signup / signin).

export const authInput =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-fg outline-none focus:border-accent placeholder:text-muted";
export const authLabel = "block text-sm font-semibold text-fg mb-1.5";

export function AuthTopBar({ step, total, onBack }: { step?: number; total?: number; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onBack} aria-label="Back" className="text-2xl leading-none text-muted">
        ←
      </button>
      <span className="font-head text-lg font-bold tracking-tight text-fg">UNSIGNED</span>
      <span className="text-xs text-muted tnum">{step && total ? `${step} / ${total}` : ""}</span>
    </div>
  );
}

export function AuthSection({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <div>
        <h1 className="font-head text-3xl font-bold tracking-tight text-fg">{title}</h1>
        {sub && <p className="mt-2 text-sm leading-relaxed text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={authLabel}>{label}</span>
      {children}
    </div>
  );
}
