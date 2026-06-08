/**
 * enrich-photos.ts
 *
 * Fetches a CC-licensed campus photo for each seeded program via Wikidata's
 * image property (P18) — the representative photo (a campus building), not the
 * trademarked seal — and CACHES it locally under public/programs/<id>.<ext> so
 * the app serves its own copy instead of hotlinking Wikimedia.
 *
 *   npx tsx scripts/enrich-photos.ts      (or: npm run data:photos)
 *
 * Writes per school (when found): photoUrl ("/programs/<id>.<ext>") and
 * photoCredit (the Commons file page, for attribution). Idempotent — already
 * cached files are skipped. Schools without a P18 keep the SchoolPhoto
 * placeholder. No API key needed.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const WIKI = "https://en.wikipedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const THUMB_WIDTH = 800; // ~2x the 430px card
const CONCURRENCY = 1; // Commons 429s on parallel Special:FilePath — go sequential
const PACE_MS = 300; // spacing between downloads
const OUT_DIR = resolve(process.cwd(), "public/programs");

interface School {
  id: string;
  school: string;
  photoUrl?: string;
  photoCredit?: string;
  [k: string]: unknown;
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const UA = "Unsigned/1.0 (recruiting app; campus photo cache; dev contact)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Wikimedia APIs require a descriptive User-Agent and rate-limit aggressively;
// fetch JSON with UA + backoff retry.
async function wmJson(url: string): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      const text = await res.text();
      if (res.ok) return JSON.parse(text);
    } catch {
      /* retry */
    }
    await sleep(800 * (attempt + 1));
  }
  console.log(`  (skip) Wikimedia fetch failed: ${url.slice(60, 120)}`);
  return null;
}

async function getQIDs(titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(titles, 50)) {
    const url = `${WIKI}?action=query&format=json&formatversion=2&redirects=1&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(batch.join("|"))}`;
    const data = await wmJson(url);
    if (!data) continue;
    const q = (data.query ?? {}) as Record<string, unknown> as {
      normalized?: { from: string; to: string }[];
      redirects?: { from: string; to: string }[];
      pages?: { title: string; pageprops?: { wikibase_item?: string } }[];
    };
    await sleep(150);
    const norm = new Map<string, string>((q.normalized ?? []).map((n: { from: string; to: string }) => [n.from, n.to]));
    const redir = new Map<string, string>((q.redirects ?? []).map((r: { from: string; to: string }) => [r.from, r.to]));
    const byTitle = new Map<string, string>();
    for (const p of q.pages ?? []) {
      const qid = p.pageprops?.wikibase_item;
      if (qid) byTitle.set(p.title, qid);
    }
    for (const t of batch) {
      let f = norm.get(t) ?? t;
      f = redir.get(f) ?? f;
      const qid = byTitle.get(f);
      if (qid) result.set(t, qid);
    }
  }
  return result;
}

async function getImages(qids: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(qids, 40)) {
    const url = `${WIKIDATA}?action=wbgetentities&format=json&props=claims&ids=${batch.join("|")}`;
    const data = await wmJson(url);
    if (!data) continue;
    const entities = (data.entities ?? {}) as Record<string, { claims?: Record<string, unknown[]> }>;
    await sleep(200);
    for (const [qid, ent] of Object.entries(entities)) {
      const p18 = ent.claims?.P18 as { mainsnak: { datavalue?: { value: string } } }[] | undefined;
      const file = p18?.[0]?.mainsnak?.datavalue?.value;
      if (file) result.set(qid, file);
    }
  }
  return result;
}

function extFor(file: string): string {
  const m = file.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg|webp)$/);
  return m ? m[1].replace("jpeg", "jpg") : "jpg";
}

function cachedExt(id: string): string | null {
  try {
    const hit = readdirSync(OUT_DIR).find((f) => f.startsWith(id + "."));
    return hit ? hit.slice(id.length + 1) : null;
  } catch {
    return null;
  }
}

async function download(file: string, id: string): Promise<string | null> {
  const ext = extFor(file);
  const enc = encodeURIComponent(file.replace(/ /g, "_"));
  // SVGs can't be width-thumbnailed as raster the same way; fetch as-is.
  const src =
    ext === "svg"
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${enc}`
      : `https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=${THUMB_WIDTH}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(src, { headers: { "User-Agent": UA } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length >= 1000) {
          writeFileSync(resolve(OUT_DIR, `${id}.${ext}`), buf);
          return ext;
        }
      } else if (res.status === 429) {
        const ra = parseInt(res.headers.get("retry-after") ?? "", 10);
        await sleep(Math.min((ra > 0 ? ra * 1000 : 0) || 2000 * (attempt + 1), 12000));
        continue;
      }
    } catch {
      /* retry */
    }
    await sleep(1000 * (attempt + 1));
  }
  return null;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = resolve(process.cwd(), "src/lib/programs.data.json");
  const schools: School[] = JSON.parse(readFileSync(path, "utf8"));

  console.log("Resolving Wikidata QIDs…");
  const qidByTitle = await getQIDs(schools.map((s) => s.school));
  const qids = [...new Set([...qidByTitle.values()])];
  console.log(`Found ${qids.length} QIDs. Fetching P18 image names…`);
  const fileByQid = await getImages(qids);
  console.log(`Resolved ${fileByQid.size} campus images. Downloading…`);

  let cached = 0;
  let already = 0;
  let processed = 0;

  for (const batch of chunk(schools, CONCURRENCY)) {
    await Promise.all(
      batch.map(async (s) => {
        const qid = qidByTitle.get(s.school);
        const file = qid ? fileByQid.get(qid) : undefined;

        // already on disk → just point at it
        const existing = cachedExt(s.id);
        if (existing) {
          s.photoUrl = `/programs/${s.id}.${existing}`;
          if (file) s.photoCredit = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
          already++;
          return;
        }
        if (!file) return;

        const ext = await download(file, s.id);
        if (ext) {
          s.photoUrl = `/programs/${s.id}.${ext}`;
          s.photoCredit = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
          cached++;
        }
      }),
    );
    processed += batch.length;
    await sleep(PACE_MS);
    if (processed % 40 === 0) console.log(`  …${processed}/${schools.length} (cached ${cached})`);
  }

  writeFileSync(path, JSON.stringify(schools, null, 2) + "\n");
  const withPhoto = schools.filter((s) => s.photoUrl).length;
  console.log(`Done. Newly cached: ${cached}, already cached: ${already}. ${withPhoto}/${schools.length} schools now have a local photo.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
