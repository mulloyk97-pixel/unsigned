"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAthleteCard } from "@/lib/athleteCard";

// App shell. Tabbed chrome (top bar + bottom tabs) shows on the main app
// screens; onboarding/landing keep a minimal brand header. Everything is capped
// at 430px and centered — mobile-first, no desktop layouts.
const TAB_ROUTES = ["/discover", "/highlights", "/messages", "/profile"];
// Auth screens + the coach section render their own full-bleed layout (no
// athlete chrome).
const BARE_ROUTES = ["/signin", "/signup", "/coaches"];

const TABS = [
  { href: "/discover", label: "Explore", icon: CompassIcon },
  { href: "/highlights", label: "Highlights", icon: PlayIcon },
  { href: "/messages", label: "Messages", icon: ChatIcon },
];

const SHELL = "mx-auto w-full max-w-[430px]";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inApp = TAB_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const bare = pathname === "/" || BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (bare) {
    return <main className={`${SHELL} flex-1 flex flex-col`}>{children}</main>;
  }

  if (!inApp) {
    return (
      <>
        <header className="border-b border-line bg-bg/90 backdrop-blur sticky top-0 z-10">
          <div className={`${SHELL} px-5 h-14 flex items-center justify-between`}>
            <Link href="/" className="font-head text-xl font-bold tracking-tight text-fg">
              UNSIGNED
            </Link>
            <span className="text-xs text-muted">Free for athletes</span>
          </div>
        </header>
        <main className={`${SHELL} flex-1 px-5 py-6`}>{children}</main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className={`${SHELL} flex-1 px-4 py-4 pb-24`}>{children}</main>
      <BottomTabs pathname={pathname} />
    </>
  );
}

function TopBar() {
  const card = useAthleteCard();
  const initial = card.name.trim().charAt(0).toUpperCase() || "U";
  return (
    <header className="border-b border-line bg-bg/90 backdrop-blur sticky top-0 z-10">
      <div className={`${SHELL} px-4 h-14 flex items-center justify-between`}>
        <Link href="/profile" aria-label="Your profile" className="active:scale-95 transition">
          {card.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user data URL / remote
            <img src={card.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-line" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated border border-line text-sm font-semibold text-fg">
              {initial}
            </span>
          )}
        </Link>
        <span className="font-head text-xl font-bold tracking-tight text-fg">UNSIGNED</span>
        <button
          aria-label="Add highlight (coming soon)"
          title="Add highlight — coming soon"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted text-xl leading-none active:scale-95 transition"
        >
          +
        </button>
      </div>
    </header>
  );
}

function BottomTabs({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-line bg-bg">
      <div className={`${SHELL} grid grid-cols-3`}>
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// --- icons (inline, no dependency) ----------------------------------------

function CompassIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="16 8 13 13 8 16 11 11 16 8" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function PlayIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="10 8 16 12 10 16 10 8" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function ChatIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1 1 21 11.5Z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
    </svg>
  );
}
