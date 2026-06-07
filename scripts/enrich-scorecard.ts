/**
 * enrich-scorecard.ts
 *
 * Fills academics + net price on src/lib/programs.data.json using the U.S.
 * Department of Education's College Scorecard API. Match is by normalized
 * school name + state.
 *
 * Get a free key (instant): https://api.data.gov/signup/  then:
 *   SCORECARD_API_KEY=your_key npx tsx scripts/enrich-scorecard.ts
 *
 * Without a key it falls back to DEMO_KEY (rate-limited to ~50/day — fine for a
 * smoke test, not a full run). Use MAX_PAGES=n to cap pages while testing.
 *
 * Adds per school: typicalNetCost, stickerCost, avgGpa (SAT/ACT proxy),
 * selectivity (from admission rate). Re-running is safe (idempotent overwrite).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const KEY = process.env.SCORECARD_API_KEY || "DEMO_KEY";
const MAX_PAGES = process.env.MAX_PAGES ? parseInt(process.env.MAX_PAGES, 10) : Infinity;
const BASE = "https://api.data.gov/ed/collegescorecard/v1/schools.json";
const FIELDS = [
  "id",
  "school.name",
  "school.state",
  "latest.cost.avg_net_price.overall",
  "latest.cost.attendance.academic_year",
  "latest.admissions.sat_scores.average.overall",
  "latest.admissions.act_scores.midpoint.cumulative",
  "latest.admissions.admission_rate.overall",
].join(",");

interface School {
  id: string;
  school: string;
  state: string;
  [k: string]: unknown;
}

function norm(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bstate university of new york\b/g, "suny") // SUNY naming variants
    .replace(/\bsaint\b/g, "st")
    .replace(/[.‐-―-]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Fallback key: state-scoped sorted token set, dropping institutional filler
// words. Recovers CUNY/SUNY prefixes, leading "The", and College/University
// variants. Used only when an exact match fails and the key is unambiguous.
const STOPWORDS = new Set([
  "the", "of", "and", "at", "a", "cuny", "suny", "university", "college",
  "institute", "technology", "polytechnic", "campus",
]);
function tokenKey(name: string): string {
  const toks = norm(name)
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w));
  return toks.sort().join(" ");
}

function gpaFromTests(sat: number | null, act: number | null): number | undefined {
  const score = sat ?? (act ? actToSat(act) : null);
  if (!score) return undefined;
  if (score >= 1500) return 3.95;
  if (score >= 1430) return 3.9;
  if (score >= 1360) return 3.8;
  if (score >= 1290) return 3.7;
  if (score >= 1220) return 3.55;
  if (score >= 1150) return 3.4;
  if (score >= 1080) return 3.25;
  if (score >= 1010) return 3.1;
  return 2.9;
}
function actToSat(act: number): number {
  return Math.round(560 + act * 30); // rough concordance
}
function selectivityFromRate(rate: number | null): "selective" | "moderate" | "open" | undefined {
  if (rate == null) return undefined;
  if (rate < 0.35) return "selective";
  if (rate < 0.7) return "moderate";
  return "open";
}

interface ScorecardIndex {
  exact: Map<string, Record<string, unknown>>;
  token: Map<string, Record<string, unknown> | null>; // null = ambiguous
}

async function fetchAll(): Promise<ScorecardIndex> {
  const exact = new Map<string, Record<string, unknown>>();
  const token = new Map<string, Record<string, unknown> | null>();
  let page = 0;
  for (;;) {
    if (page >= MAX_PAGES) break;
    const url = `${BASE}?api_key=${KEY}&fields=${FIELDS}&school.operating=1&per_page=100&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Scorecard ${res.status} on page ${page} — check SCORECARD_API_KEY / rate limit`);
    }
    const json = await res.json();
    const results: Record<string, unknown>[] = json.results ?? [];
    for (const r of results) {
      const name = r["school.name"] as string;
      const state = r["school.state"] as string;
      if (!name || !state) continue;
      exact.set(`${norm(name)}|${state}`, r);
      const tk = `${tokenKey(name)}|${state}`;
      token.set(tk, token.has(tk) ? null : r); // collision -> ambiguous
    }
    const total = json.metadata?.total ?? 0;
    page++;
    if (page * 100 >= total || results.length === 0) break;
    if (page % 10 === 0) console.log(`  …fetched ${page} pages`);
  }
  return { exact, token };
}

async function main() {
  const path = resolve(process.cwd(), "src/lib/programs.data.json");
  const schools: School[] = JSON.parse(readFileSync(path, "utf8"));

  console.log(`Fetching College Scorecard (key: ${KEY === "DEMO_KEY" ? "DEMO_KEY" : "custom"})…`);
  const index = await fetchAll();
  console.log(`Indexed ${index.exact.size} Scorecard institutions.`);

  let matched = 0;
  const unmatched: string[] = [];
  for (const s of schools) {
    const hit =
      index.exact.get(`${norm(s.school)}|${s.state}`) ??
      index.token.get(`${tokenKey(s.school)}|${s.state}`) ??
      undefined;
    if (!hit) {
      unmatched.push(s.school);
      continue;
    }
    matched++;
    const net = hit["latest.cost.avg_net_price.overall"] as number | null;
    const sticker = hit["latest.cost.attendance.academic_year"] as number | null;
    const sat = hit["latest.admissions.sat_scores.average.overall"] as number | null;
    const act = hit["latest.admissions.act_scores.midpoint.cumulative"] as number | null;
    const rate = hit["latest.admissions.admission_rate.overall"] as number | null;

    if (net != null) s.typicalNetCost = net;
    if (sticker != null) s.stickerCost = sticker;
    const gpa = gpaFromTests(sat, act);
    if (gpa != null) s.avgGpa = gpa;
    const sel = selectivityFromRate(rate);
    if (sel) s.selectivity = sel;
  }

  writeFileSync(path, JSON.stringify(schools, null, 2) + "\n");
  console.log(`Enriched ${matched}/${schools.length} schools. Unmatched: ${unmatched.length}`);
  if (unmatched.length) console.log("  e.g.", unmatched.slice(0, 12).join("; "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
