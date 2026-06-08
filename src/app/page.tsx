import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-between px-5 py-12 text-center">
      <div className="pt-10">
        <h1 className="font-head text-6xl font-bold tracking-tight text-fg">UNSIGNED</h1>
      </div>

      <p className="max-w-[300px] text-lg leading-snug text-muted">
        The honest recruiting platform for overlooked athletes.
      </p>

      <div className="w-full flex flex-col gap-3">
        <Link
          href="/signup/athlete"
          className="rounded-lg bg-accent px-5 py-4 text-center font-semibold text-bg active:scale-[0.99] transition"
        >
          I&apos;m an athlete
        </Link>
        <Link
          href="/signup/coach"
          className="rounded-lg border border-accent px-5 py-4 text-center font-semibold text-accent active:scale-[0.99] transition"
        >
          I&apos;m a coach
        </Link>
        <Link href="/signin" className="mt-2 text-sm text-muted">
          Already have an account? <span className="text-fg underline">Sign in</span>
        </Link>
      </div>
    </div>
  );
}
