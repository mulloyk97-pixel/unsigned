"use client";

import { useRef, useState } from "react";
import {
  ALL_STATS,
  AthleteCard,
  HighlightClip,
  STAT_META,
  StatKey,
  addClip,
  removeClip,
  reorderStats,
  toggleFeatured,
  updateCard,
  useAthleteCard,
  youtubeId,
} from "@/lib/athleteCard";
import ReorderList, { HandleProps } from "@/components/ReorderList";

export default function ProfilePage() {
  const card = useAthleteCard();
  const [editing, setEditing] = useState(false);

  const featuredKeys = card.order.filter((k) => card.featured.includes(k));
  const nonFeaturedKeys = card.order.filter((k) => !card.featured.includes(k));

  function onReorderNonFeatured(next: string[]) {
    let i = 0;
    const merged = card.order.map((k) => (card.featured.includes(k) ? k : (next[i++] as StatKey)));
    reorderStats(merged);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold tracking-tight text-fg">YOUR CARD</h1>
        <button
          onClick={() => setEditing((e) => !e)}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            editing ? "bg-accent text-bg" : "border border-line text-fg"
          }`}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {!editing && (
        <p className="-mt-2 text-xs text-muted">
          This is what coaches see. Everything you enter is visible — featuring just pushes a stat
          to the top.
        </p>
      )}

      <Header card={card} editing={editing} />

      {editing ? (
        <EditStats featuredKeys={featuredKeys} nonFeaturedKeys={nonFeaturedKeys} card={card} onReorder={onReorderNonFeatured} />
      ) : (
        <ViewStats featuredKeys={featuredKeys} nonFeaturedKeys={nonFeaturedKeys} card={card} />
      )}

      <Highlights card={card} editing={editing} />
    </div>
  );
}

// --- Header (full-bleed photo) ---------------------------------------------

function Header({ card, editing }: { card: AthleteCard; editing: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateCard({ photoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  const meta = [card.gradYear && `Class of ${card.gradYear}`, card.highSchool, card.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      {/* full-bleed hero (breaks the 16px page padding) */}
      <div className="relative -mx-4 aspect-[4/3] bg-elevated overflow-hidden">
        {card.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL
          <img src={card.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-head text-8xl font-bold text-muted/30">
              {card.name.trim().charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/70 to-transparent p-4 pt-12">
          <h2 className="font-head text-3xl font-bold leading-none text-fg">{card.name || "Your name"}</h2>
          <p className="mt-1 text-sm text-muted">{meta || "Add your details in Edit"}</p>
        </div>
        {editing && (
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute top-3 right-3 rounded-lg border border-line bg-bg/70 px-3 py-1.5 text-xs font-medium text-fg backdrop-blur"
          >
            {card.photoUrl ? "Change photo" : "Add photo"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-2">
          <HeaderInput value={card.name} placeholder="Full name" onChange={(v) => updateCard({ name: v })} />
          <div className="grid grid-cols-2 gap-2">
            <HeaderInput value={card.gradYear} placeholder="Grad year" onChange={(v) => updateCard({ gradYear: v })} />
            <HeaderInput value={card.location} placeholder="City, ST" onChange={(v) => updateCard({ location: v })} />
          </div>
          <HeaderInput value={card.highSchool} placeholder="High school" onChange={(v) => updateCard({ highSchool: v })} />
        </div>
      )}
    </div>
  );
}

function HeaderInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent placeholder:text-muted"
    />
  );
}

// --- Stats: view (grid of bold numbers) ------------------------------------

function StatTile({ k, value, featured }: { k: StatKey; value: string; featured?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 text-center">
      <p className={`font-head text-3xl font-bold tnum ${featured ? "text-accent" : "text-fg"}`}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{STAT_META[k].label}</p>
    </div>
  );
}

function ViewStats({
  featuredKeys,
  nonFeaturedKeys,
  card,
}: {
  featuredKeys: StatKey[];
  nonFeaturedKeys: StatKey[];
  card: AthleteCard;
}) {
  const featured = featuredKeys.filter((k) => card[k]);
  const rest = nonFeaturedKeys.filter((k) => card[k]);

  if (featured.length === 0 && rest.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
        No stats yet. Hit <span className="font-medium text-fg">Edit</span> and put your numbers up — coaches scroll fast.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {featured.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {featured.map((k) => <StatTile key={k} k={k} value={card[k]} featured />)}
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {rest.map((k) => <StatTile key={k} k={k} value={card[k]} />)}
        </div>
      )}
    </div>
  );
}

// --- Stats: edit -----------------------------------------------------------

function StarButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={on ? "Unfeature" : "Feature this"} className="shrink-0 p-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? "var(--color-accent)" : "none"} stroke={on ? "var(--color-accent)" : "var(--color-muted)"} strokeWidth="1.8" strokeLinejoin="round">
        <polygon points="12 3 14.7 8.5 21 9.3 16.5 13.6 17.6 19.8 12 16.9 6.4 19.8 7.5 13.6 3 9.3 9.3 8.5" />
      </svg>
    </button>
  );
}

function StatEditorRow({ k, card, handle }: { k: StatKey; card: AthleteCard; handle?: HandleProps }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2">
      {handle && (
        <button {...handle} aria-label="Drag to reorder" className="shrink-0 cursor-grab active:cursor-grabbing px-1 text-muted touch-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="9" x2="19" y2="9" /><line x1="5" y1="15" x2="19" y2="15" />
          </svg>
        </button>
      )}
      <div className="w-20 shrink-0">
        <p className="text-xs font-semibold text-fg">{STAT_META[k].label}</p>
        <p className="text-[10px] text-muted">{STAT_META[k].group}</p>
      </div>
      <input
        value={card[k]}
        placeholder={STAT_META[k].hint ?? "—"}
        inputMode={k === "position" || k === "height" ? "text" : "numeric"}
        onChange={(e) => updateCard({ [k]: e.target.value } as Partial<AthleteCard>)}
        className="flex-1 min-w-0 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg tnum outline-none focus:border-accent placeholder:text-muted"
      />
      <StarButton on={card.featured.includes(k)} onClick={() => toggleFeatured(k)} />
    </div>
  );
}

function EditStats({
  featuredKeys,
  nonFeaturedKeys,
  card,
  onReorder,
}: {
  featuredKeys: StatKey[];
  nonFeaturedKeys: StatKey[];
  card: AthleteCard;
  onReorder: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {featuredKeys.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">Featured · shown up top</p>
          <div className="flex flex-col gap-2">
            {featuredKeys.map((k) => <StatEditorRow key={k} k={k} card={card} />)}
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Your stats {ALL_STATS.length === featuredKeys.length ? "" : "· drag to reorder, ★ to feature"}
        </p>
        <ReorderList
          items={nonFeaturedKeys}
          onReorder={onReorder}
          renderItem={(key, handle) => <StatEditorRow k={key as StatKey} card={card} handle={handle} />}
        />
      </div>
    </div>
  );
}

// --- Highlights ------------------------------------------------------------

function Highlights({ card, editing }: { card: AthleteCard; editing: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Highlights</h2>

      {card.clips.length === 0 && !editing && (
        <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
          No film up yet. Coaches recruit what they can see — add a clip in Edit.
        </p>
      )}

      {/* horizontal rail of thumbnails */}
      {card.clips.length > 0 && (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 no-scrollbar snap-x">
          {card.clips.map((clip) => (
            <ClipThumb key={clip.id} clip={clip} editing={editing} />
          ))}
        </div>
      )}

      {editing && <AddClipForm />}
    </div>
  );
}

function ClipThumb({ clip, editing }: { clip: HighlightClip; editing: boolean }) {
  return (
    <div className="relative w-44 shrink-0 snap-start">
      <a href={clip.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-elevated">
          {clip.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumb
            <img src={clip.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center text-white text-2xl">▶</span>
        </div>
        <p className="mt-1.5 truncate text-sm font-medium text-fg">{clip.title || clip.url}</p>
        {clip.description && <p className="truncate text-xs text-muted">{clip.description}</p>}
      </a>
      {editing && (
        <button
          onClick={() => removeClip(clip.id)}
          aria-label="Remove clip"
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-bg/80 text-xs text-danger backdrop-blur"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function AddClipForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!/^https?:\/\//i.test(url.trim())) return setError("Paste a full link — Hudl or YouTube.");
    if (!title.trim()) return setError("Give the clip a title so coaches know what they're watching.");
    addClip({ url, title, description: desc });
    setUrl(""); setTitle(""); setDesc("");
  }

  const isYt = youtubeId(url);
  const inputCls = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-accent placeholder:text-muted";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
      <p className="text-xs font-semibold text-fg">Add a clip</p>
      <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" className={inputCls}
        placeholder="Paste your Hudl or YouTube link" />
      {url && <p className="text-[11px] text-muted">{isYt ? "YouTube detected — we'll grab the thumbnail." : "We'll store the link as-is."}</p>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls}
        placeholder="Title — e.g. Senior season mixtape" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls}
        placeholder="Description (optional)" />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button onClick={submit} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg active:scale-[0.99] transition">
        Add clip
      </button>
    </div>
  );
}
