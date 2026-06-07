import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="pt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">For overlooked athletes</p>
        <h1 className="mt-3 font-head text-5xl font-bold leading-[0.95] tracking-tight text-fg">
          FIND OUT WHERE YOU CAN <span className="text-accent">ACTUALLY</span> PLAY.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Every paid service inflates your profile to justify the bill. We don&apos;t. Unsigned gives
          you an honest read on your real level, then the right-fit D-III, NAIA, and JUCO programs
          you&apos;ve never heard of.
        </p>
      </section>

      <Link
        href="/intake"
        className="rounded-lg bg-accent px-5 py-4 text-center font-semibold text-bg active:scale-[0.99] transition"
      >
        Get my honest assessment
      </Link>

      <ul className="flex flex-col gap-3 text-[15px]">
        {[
          ["No fee.", "Free for athletes and families. For real."],
          ["No inflation.", "We tell you the truth about your level, even when it stings."],
          ["No noise.", "Swipe through right-fit programs and save the ones that match your game, grades, and budget."],
        ].map(([head, body]) => (
          <li key={head} className="rounded-xl border border-line bg-surface p-4">
            <span className="font-semibold text-fg">{head}</span>{" "}
            <span className="text-muted">{body}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted">About 3 minutes. No account required.</p>
    </div>
  );
}
