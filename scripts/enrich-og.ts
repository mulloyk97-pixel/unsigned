/**
 * enrich-og.ts
 *
 * Fallback campus photos for schools that have no Wikipedia/Commons image.
 * Gets each school's homepage from Wikidata P856 (official website — no API key
 * needed), scrapes the page's og:image meta tag, and caches it locally under
 * public/programs/<id>.<ext>. Run AFTER enrich-photos.ts.
 *
 *   npx tsx scripts/enrich-og.ts        (or: npm run data:photos:og)
 *
 * Only touches schools that still lack photoUrl; everything else is left alone.
 * Schools with no homepage / no og:image keep the SchoolPhoto letter placeholder.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const WIKI = "https://en.wikipedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const OUT_DIR = resolve(process.cwd(), "public/programs");
const UA = "Unsigned/1.0 (recruiting app; campus photo cache; dev contact)";
const CONCURRENCY = 5;

interface School {
  id: string;
  school: string;
  photoUrl?: string;
  photoCredit?: string;
  schoolUrl?: string;
  [k: string]: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function wmJson(url: string): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      const text = await res.text();
      if (res.ok) return JSON.parse(text);
    } catch {
      /* retry */
    }
    await sleep(700 * (attempt + 1));
  }
  return null;
}

async function getQIDs(titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(titles, 50)) {
    const url = `${WIKI}?action=query&format=json&formatversion=2&redirects=1&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(batch.join("|"))}`;
    const data = await wmJson(url);
    if (!data) continue;
    const q = (data.query ?? {}) as {
      normalized?: { from: string; to: string }[];
      redirects?: { from: string; to: string }[];
      pages?: { title: string; pageprops?: { wikibase_item?: string } }[];
    };
    const norm = new Map((q.normalized ?? []).map((n) => [n.from, n.to]));
    const redir = new Map((q.redirects ?? []).map((r) => [r.from, r.to]));
    const byTitle = new Map<string, string>();
    for (const p of q.pages ?? []) if (p.pageprops?.wikibase_item) byTitle.set(p.title, p.pageprops.wikibase_item);
    for (const t of batch) {
      let f = norm.get(t) ?? t;
      f = redir.get(f) ?? f;
      const qid = byTitle.get(f);
      if (qid) result.set(t, qid);
    }
    await sleep(150);
  }
  return result;
}

// QID -> official website (P856)
async function getWebsites(qids: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(qids, 40)) {
    const url = `${WIKIDATA}?action=wbgetentities&format=json&props=claims&ids=${batch.join("|")}`;
    const data = await wmJson(url);
    if (!data) continue;
    const entities = (data.entities ?? {}) as Record<string, { claims?: Record<string, { mainsnak?: { datavalue?: { value?: string } } }[]> }>;
    for (const [qid, ent] of Object.entries(entities)) {
      const site = ent.claims?.P856?.[0]?.mainsnak?.datavalue?.value;
      if (site) result.set(qid, site);
    }
    await sleep(200);
  }
  return result;
}

function cached(id: string): boolean {
  try {
    return readdirSync(OUT_DIR).some((f) => f.startsWith(id + "."));
  } catch {
    return false;
  }
}

async function withTimeout(url: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal, redirect: "follow" });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extractOgImage(html: string, base: string): string | null {
  const m =
    html.match(/<meta[^>]+(?:property|name)=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::url)?["']/i);
  if (!m) return null;
  try {
    return new URL(m[1], base).href;
  } catch {
    return null;
  }
}

async function downloadImage(url: string, id: string): Promise<string | null> {
  const res = await withTimeout(url, 15000);
  if (!res || !res.ok) return null;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000 || buf.length > 4_000_000) return null;
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("svg") ? "svg" : ct.includes("gif") ? "gif" : "jpg";
  writeFileSync(resolve(OUT_DIR, `${id}.${ext}`), buf);
  return ext;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = resolve(process.cwd(), "src/lib/programs.data.json");
  const schools: School[] = JSON.parse(readFileSync(path, "utf8"));

  const targets = schools.filter((s) => !s.photoUrl);
  console.log(`${targets.length} schools without a photo. Resolving homepages via Wikidata…`);

  const qidByTitle = await getQIDs(targets.map((s) => s.school));
  const qids = [...new Set([...qidByTitle.values()])];
  const siteByQid = await getWebsites(qids);
  console.log(`Found ${siteByQid.size} homepages. Scraping og:image…`);

  let added = 0;
  let processed = 0;
  for (const batch of chunk(targets, CONCURRENCY)) {
    await Promise.all(
      batch.map(async (s) => {
        if (cached(s.id)) {
          const hit = readdirSync(OUT_DIR).find((f) => f.startsWith(s.id + "."));
          if (hit) s.photoUrl = `/programs/${hit}`;
          return;
        }
        const qid = qidByTitle.get(s.school);
        const site = qid ? siteByQid.get(qid) : undefined;
        if (!site) return;
        s.schoolUrl = site;

        const page = await withTimeout(site, 12000);
        if (!page || !page.ok) return;
        const html = await page.text();
        const og = extractOgImage(html, site);
        if (!og) return;

        const ext = await downloadImage(og, s.id);
        if (ext) {
          s.photoUrl = `/programs/${s.id}.${ext}`;
          s.photoCredit = site;
          added++;
        }
      }),
    );
    processed += batch.length;
    await sleep(200);
    if (processed % 40 === 0) console.log(`  …${processed}/${targets.length} (og added ${added})`);
  }

  writeFileSync(path, JSON.stringify(schools, null, 2) + "\n");
  const withPhoto = schools.filter((s) => s.photoUrl).length;
  console.log(`Done. og:image fallback added ${added}. ${withPhoto}/${schools.length} schools now have a photo.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
