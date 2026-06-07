// School photo with a generated placeholder for V1.
//
// When `photoUrl` is null we render the school's initial on a deterministic
// colored background. Real campus/team photos slot in later by populating
// Program.photoUrl (CDN or Supabase storage URL) -- no other change needed.

function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

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
    // eslint-disable-next-line @next/next/no-img-element -- remote arbitrary hosts; revisit with next/image + domains when real photos land
    return <img src={photoUrl} alt={name} className={`object-cover ${className}`} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const hue = hueFromName(name);

  return (
    <div
      className={`flex items-center justify-center text-white font-bold ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 48% 40%), hsl(${(hue + 28) % 360} 52% 30%))` }}
      aria-label={`${name} (placeholder image)`}
    >
      <span className="text-5xl drop-shadow-sm">{initial}</span>
    </div>
  );
}
