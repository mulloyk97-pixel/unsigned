/**
 * scrape-coaches.ts
 *
 * Best-effort gathering of D-III men's basketball coach emails as CANDIDATES
 * for the manual verification pipeline. For every program with
 * coach_verified = false and coach_email = null, it:
 *   1. resolves the school homepage (Wikidata P856), derives the domain;
 *   2. finds the athletics site (homepage "athletics" link, then common
 *      patterns like athletics.<domain> / <domain>/athletics);
 *   3. finds the men's basketball staff/coaches page (common URL patterns +
 *      link discovery);
 *   4. scrapes @*.edu emails off that page;
 *   5. saves the first as coach_email (flags coach_review = true if several),
 *      plus coach_name where it can be read near the email.
 *
 * It NEVER sets coach_verified = true — that stays a human decision. Scraped
 * emails are not shown to athletes until verified.
 *
 *   npx tsx scripts/scrape-coaches.ts        (or: npm run data:coaches)
 *   (ts-node also works if installed; this repo uses tsx.)
 *
 * Sequential with 500ms between schools; failures/timeouts are skipped.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const WIKI = "https://en.wikipedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const UA = "Unsigned/1.0 (recruiting app; coach contact research; dev contact)";
const GAP_MS = 500;
const FETCH_TIMEOUT = 7000;
const FETCH_BUDGET = 6; // max page fetches per school, to bound runtime

// Programs already verified out-of-band (CURATED in src/lib/programs.ts) —
// they have a confirmed email, so skip per the "coach_email != null" rule.
const ALREADY_HAVE_EMAIL = new Set([
  "williams-college", "university-of-wisconsin-whitewater", "hope-college",
  "calvin-university", "illinois-wesleyan-university", "randolph-macon-college",
  "trinity-university",
]);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.edu\b/g;
const SKIP_LOCALPARTS = /^(?:webmaster|postmaster|admin|info|help|support|privacy|noreply|no-reply)@/i;

interface School {
  id: string;
  school: string;
  schoolUrl?: string;
  coachEmail?: string | null;
  coachName?: string | null;
  coachReview?: boolean;
  [k: string]: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function chunk<T>(a: T[], n: number): T[][] {
  const o: T[][] = [];
  for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n));
  return o;
}

async function wmJson(url: string): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      const text = await res.text();
      if (res.ok) return JSON.parse(text);
    } catch { /* retry */ }
    await sleep(700 * (i + 1));
  }
  return null;
}

async function getText(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// --- homepage resolution (Wikidata P856) ----------------------------------

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

// --- scraping --------------------------------------------------------------

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Pull hrefs whose text/url hints at a section (e.g. "athletics", "basketball").
function findLinks(html: string, base: string, hint: RegExp): string[] {
  const out: string[] = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ");
    if (hint.test(href) || hint.test(text)) {
      try { out.push(new URL(href, base).href); } catch { /* skip */ }
    }
  }
  return [...new Set(out)];
}

function emailsFrom(html: string): string[] {
  const found = (html.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase());
  const filtered = found.filter((e) => !SKIP_LOCALPARTS.test(e));
  return [...new Set(filtered)];
}

function nameNear(html: string, email: string): string | null {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const idx = text.toLowerCase().indexOf(email.toLowerCase());
  const window = idx >= 0 ? text.slice(Math.max(0, idx - 160), idx) : text;
  // Prefer a name adjacent to a "Head Coach" label.
  const m =
    window.match(/([A-Z][a-z]+(?:\s+[A-Z]\.)?\s+[A-Z][a-z]+)[^A-Za-z]{0,30}(?:Head\s+(?:Men'?s\s+Basketball\s+)?Coach)/) ||
    window.match(/(?:Head\s+(?:Men'?s\s+Basketball\s+)?Coach)[^A-Za-z]{0,30}([A-Z][a-z]+(?:\s+[A-Z]\.)?\s+[A-Z][a-z]+)/);
  return m ? m[1].trim() : null;
}

interface Outcome {
  status: "found" | "not_found" | "failed";
  email?: string;
  name?: string | null;
  review?: boolean;
}

async function scrapeSchool(s: School): Promise<Outcome> {
  const home = s.schoolUrl;
  if (!home) return { status: "not_found" };
  const host = hostOf(home);
  if (!host) return { status: "not_found" };

  // bounded fetcher — every page read draws from a per-school budget so a few
  // slow hosts can't stall the whole run.
  let budget = FETCH_BUDGET;
  const tryGet = async (url: string): Promise<string | null> => {
    if (budget <= 0) return null;
    budget--;
    return getText(url);
  };
  const scan = (html: string | null): Outcome | null => {
    if (!html) return null;
    const emails = emailsFrom(html);
    if (emails.length >= 1) return { status: "found", email: emails[0], name: nameNear(html, emails[0]), review: emails.length > 1 };
    return null;
  };

  // 1) find the athletics base (homepage discovery, then patterns)
  const homeHtml = await tryGet(home);
  const bases: string[] = [];
  if (homeHtml) bases.push(...findLinks(homeHtml, home, /athletic/i).slice(0, 1));
  bases.push(`https://athletics.${host}`, `https://${host}/athletics`);

  for (const base of bases) {
    if (budget <= 0) break;
    // strong direct guess first (Sidearm men's basketball coaches page)
    const guess = scan(await tryGet(new URL("/sports/mbkb/coaches", base).href));
    if (guess) return guess;

    const baseHtml = await tryGet(base);
    if (!baseHtml) continue;
    const direct = scan(baseHtml);
    if (direct) return direct;

    // basketball section -> coaches/staff link -> scrape
    for (const bb of findLinks(baseHtml, base, /m(en'?s)?[-\s]?bask|mbball|mbkb/i).slice(0, 1)) {
      const bbHtml = await tryGet(bb);
      const onBb = scan(bbHtml);
      if (onBb) return onBb;
      if (bbHtml) {
        for (const st of findLinks(bbHtml, bb, /coach|staff/i).slice(0, 1)) {
          const stHit = scan(await tryGet(st));
          if (stHit) return stHit;
        }
      }
    }
  }
  return { status: "not_found" };
}

async function main() {
  const path = resolve(process.cwd(), "src/lib/programs.data.json");
  const schools: School[] = JSON.parse(readFileSync(path, "utf8"));

  const targets = schools.filter((s) => !s.coachEmail && !ALREADY_HAVE_EMAIL.has(s.id));
  console.log(`${targets.length} programs need a coach email. Resolving homepages…`);

  // Fill any missing homepages from Wikidata P856.
  const need = targets.filter((s) => !s.schoolUrl);
  if (need.length) {
    const qidByTitle = await getQIDs(need.map((s) => s.school));
    const siteByQid = await getWebsites([...new Set([...qidByTitle.values()])]);
    for (const s of need) {
      const qid = qidByTitle.get(s.school);
      const site = qid ? siteByQid.get(qid) : undefined;
      if (site) s.schoolUrl = site;
    }
  }

  let found = 0, notFound = 0, failed = 0, processed = 0;
  for (const s of targets) {
    let outcome: Outcome;
    try {
      outcome = await scrapeSchool(s);
    } catch {
      outcome = { status: "failed" };
    }
    if (outcome.status === "found" && outcome.email) {
      s.coachEmail = outcome.email;
      if (outcome.name) s.coachName = outcome.name;
      if (outcome.review) s.coachReview = true;
      found++;
      console.log(`✓ ${s.school}: ${outcome.email}${outcome.review ? " (multiple — review)" : ""}${outcome.name ? ` [${outcome.name}]` : ""}`);
    } else if (outcome.status === "failed") {
      failed++;
      console.log(`! ${s.school}: failed`);
    } else {
      notFound++;
      console.log(`· ${s.school}: not found`);
    }
    processed++;
    if (processed % 25 === 0) writeFileSync(path, JSON.stringify(schools, null, 2) + "\n"); // checkpoint
    await sleep(GAP_MS);
  }

  writeFileSync(path, JSON.stringify(schools, null, 2) + "\n");
  console.log("\n=== Summary ===");
  console.log(`Total processed: ${processed}`);
  console.log(`Emails found:    ${found}`);
  console.log(`Not found:       ${notFound} (need manual)`);
  console.log(`Failed/errored:  ${failed}`);
  console.log("coach_verified left false for all — verification stays manual.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
