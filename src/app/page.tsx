import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="pt-4">
        <p className="text-sm font-medium text-accent">For overlooked athletes</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink">
          Find out where you can{" "}
          <span className="text-accent">actually</span> play.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Every paid service inflates your profile to justify the bill. We
          don&apos;t. Unsigned gives you an honest read on your realistic
          division, then a shortlist of right-fit D-III, NAIA, and JUCO programs
          you&apos;ve probably never heard of.
        </p>
      </section>

      <Link
        href="/intake"
        className="rounded-xl bg-ink px-5 py-4 text-center font-semibold text-paper active:scale-[0.99] transition"
      >
        Get my honest assessment
      </Link>

      <ul className="flex flex-col gap-3 text-[15px]">
        {[
          ["No fee.", "Free for athletes and families, for real."],
          ["No inflation.", "We tell you the truth about your level, even when it stings."],
          ["No noise.", "Swipe through right-fit programs and save the ones that match you athletically, academically, and financially."],
        ].map(([head, body]) => (
          <li
            key={head}
            className="rounded-xl border border-line bg-card p-4"
          >
            <span className="font-semibold text-ink">{head}</span>{" "}
            <span className="text-muted">{body}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted">
        Takes about 3 minutes. No account required.
      </p>
    </div>
  );
}
