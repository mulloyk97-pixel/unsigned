// School photo with a generated placeholder.
//
// When `photoUrl` is null we render the school's initial on the card surface
// (not a contrasting gray box) so a missing photo reads as intentional.

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
    return <img src={photoUrl} alt={name} className={`object-cover ${className}`} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`flex items-center justify-center bg-surface ${className}`} aria-label={`${name} (no photo yet)`}>
      <span className="font-head text-7xl font-bold text-muted/30">{initial}</span>
    </div>
  );
}
