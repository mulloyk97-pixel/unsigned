export default function ComingSoon({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
      <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
        Coming soon
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
      <p className="max-w-[260px] text-[15px] leading-relaxed text-muted">{blurb}</p>
    </div>
  );
}
