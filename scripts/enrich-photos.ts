/**
 * enrich-photos.ts
 *
 * Adds a CC-licensed campus photo to each school in src/lib/programs.data.json
 * using Wikidata's image property (P18) — the representative photo (a campus
 * building), not the trademarked seal/logo. Files resolve to Wikimedia Commons.
 *
 *   npx tsx scripts/enrich-photos.ts
 *
 * Writes per school (when found): photoUrl (Commons FilePath thumbnail) and
 * photoCredit (the Commons file page, for attribution). Coverage is partial —
 * schools without a Wikidata P18 keep the generated SchoolPhoto placeholder.
 *
 * Pipeline order: data:build -> data:enrich -> this. No API key needed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const WIKI = "https://en.wikipedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";

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

// Map each requested school title -> Wikidata QID (following normalization + redirects).
async function getQIDs(titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(titles, 50)) {
    const url = `${WIKI}?action=query&format=json&formatversion=2&redirects=1&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(batch.join("|"))}`;
    const data = await (await fetch(url)).json();
    const q = data.query ?? {};
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

// Map QID -> Commons filename from P18.
async function getImages(qids: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(qids, 50)) {
    const url = `${WIKIDATA}?action=wbgetentities&format=json&props=claims&ids=${batch.join("|")}`;
    const data = await (await fetch(url)).json();
    for (const [qid, ent] of Object.entries<{ claims?: Record<string, unknown[]> }>(data.entities ?? {})) {
      const p18 = ent.claims?.P18 as { mainsnak: { datavalue?: { value: string } } }[] | undefined;
      const file = p18?.[0]?.mainsnak?.datavalue?.value;
      if (file) result.set(qid, file);
    }
  }
  return result;
}

async function main() {
  const path = resolve(process.cwd(), "src/lib/programs.data.json");
  const schools: School[] = JSON.parse(readFileSync(path, "utf8"));

  console.log("Resolving Wikidata QIDs…");
  const qidByTitle = await getQIDs(schools.map((s) => s.school));
  const qids = [...new Set([...qidByTitle.values()])];
  console.log(`Found ${qids.length} QIDs. Fetching P18 images…`);
  const fileByQid = await getImages(qids);

  let withPhoto = 0;
  for (const s of schools) {
    const qid = qidByTitle.get(s.school);
    const file = qid ? fileByQid.get(qid) : undefined;
    if (file) {
      const enc = encodeURIComponent(file.replace(/ /g, "_"));
      s.photoUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=640`;
      s.photoCredit = `https://commons.wikimedia.org/wiki/File:${enc}`;
      withPhoto++;
    }
  }

  writeFileSync(path, JSON.stringify(schools, null, 2) + "\n");
  console.log(`Added photos to ${withPhoto}/${schools.length} schools (rest keep the placeholder).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
