"use client";

import Link from "next/link";

type Active = "discover" | "saved" | "messages";

// Coach bottom tab bar. Discover/Messages can be in-page toggles (callbacks) on
// /coaches, or fall back to navigation; Saved is always the /coaches/saved route.
export function CoachTabs({
  active,
  onDiscover,
  onMessages,
}: {
  active: Active;
  onDiscover?: () => void;
  onMessages?: () => void;
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-line bg-bg">
      <div className="mx-auto grid w-full max-w-[430px] grid-cols-3">
        {onDiscover ? (
          <TabButton label="Discover" active={active === "discover"} onClick={onDiscover} icon={PlayersIcon} />
        ) : (
          <TabLink label="Discover" href="/coaches" active={active === "discover"} icon={PlayersIcon} />
        )}
        <TabLink label="Saved" href="/coaches/saved" active={active === "saved"} icon={BookmarkIcon} />
        {onMessages ? (
          <TabButton label="Messages" active={active === "messages"} onClick={onMessages} icon={ChatIcon} />
        ) : (
          <TabLink label="Messages" href="/coaches" active={active === "messages"} icon={ChatIcon} />
        )}
      </div>
    </nav>
  );
}

const cls = (active: boolean) =>
  `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide ${active ? "text-accent" : "text-muted"}`;

function TabButton({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: (p: { active?: boolean }) => React.ReactNode }) {
  return (
    <button onClick={onClick} className={cls(active)}>
      <Icon active={active} />
      {label}
    </button>
  );
}
function TabLink({ label, href, active, icon: Icon }: { label: string; href: string; active: boolean; icon: (p: { active?: boolean }) => React.ReactNode }) {
  return (
    <Link href={href} className={cls(active)}>
      <Icon active={active} />
      {label}
    </Link>
  );
}

function PlayersIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5a3 3 0 0 1 0 6" /><path d="M19 20a6 6 0 0 0-3-5.2" />
    </svg>
  );
}
function BookmarkIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function ChatIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}
