// School photo with a generated placeholder.
//
// When `photoUrl` is null we render the school's initial on a dark surface tile.
// Real campus photos slot in by populating Program.photoUrl. The placeholder is
// flat (no gradient) to match the scout-report aesthetic.

export function SchoolPhoto({
  name,
  photoUrl,
  className = "",
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts; revisit with next/image when photos move to our CDN
    return <img src={photoUrl} alt={name} className={`object-cover bg-elevated ${className}`} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center bg-elevated ${className}`}
      aria-label={`${name} (no photo yet)`}
    >
      <span className="font-head text-6xl font-bold text-muted/40">{initial}</span>
    </div>
  );
}
