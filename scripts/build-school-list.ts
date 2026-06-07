/**
 * build-school-list.ts
 *
 * Fetches the full list of NCAA Division III institutions from Wikipedia and
 * writes src/lib/programs.data.json — the base dataset the app reads.
 *
 * Identity data only (school, city, state, conference). Academics, net price,
 * coach contacts and records are left null/false here; enrich them with
 * scripts/enrich-scorecard.ts (College Scorecard) and verify contacts over time.
 *
 * Run:  npx tsx scripts/build-school-list.ts
 *
 * Source: "List of NCAA Division III institutions" (Wikipedia). Re-run to
 * refresh when conference realignment happens.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PAGE = "List_of_NCAA_Division_III_institutions";
const API = `https://en.wikipedia.org/w/api.php?action=parse&page=${PAGE}&prop=wikitext&format=json&formatversion=2`;

interface SchoolRecord {
  id: string;
  school: string;
  city: string;
  state: string;
  conference: string;
  sports: string[]; // basketball-first; women-only schools get women's only
}

// Split on top-level "|" only — ignore pipes inside [[...]] or {{...}}.
function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depthBrace = 0;
  let depthLink = 0;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s.startsWith("{{", i)) { depthBrace++; cur += "{{"; i++; continue; }
    if (s.startsWith("}}", i)) { depthBrace--; cur += "}}"; i++; continue; }
    if (s.startsWith("[[", i)) { depthLink++; cur += "[["; i++; continue; }
    if (s.startsWith("]]", i)) { depthLink--; cur += "]]"; i++; continue; }
    if (s[i] === "|" && depthBrace === 0 && depthLink === 0) { parts.push(cur); cur = ""; continue; }
    cur += s[i];
  }
  parts.push(cur);
  return parts;
}

// Replace {{sort|key|value}} with value (Wikipedia uses it for alphabetized
// cells, e.g. school names and cities). Brace-matched to survive nesting.
function expandSortTemplates(s: string): string {
  let out = s;
  for (;;) {
    const i = out.toLowerCase().indexOf("{{sort|");
    if (i === -1) break;
    let depth = 0;
    let j = i;
    for (; j < out.length; j++) {
      if (out.startsWith("{{", j)) { depth++; j++; }
      else if (out.startsWith("}}", j)) { depth--; if (depth === 0) { j += 2; break; } j++; }
    }
    const inner = out.slice(i + 2, j - 2); // drop {{ and }}
    const parts = splitTopLevel(inner); // [sort, key, value...]
    const value = parts.slice(2).join("|");
    out = out.slice(0, i) + value + out.slice(j);
  }
  return out;
}

function stripMarkup(s: string): string {
  let out = expandSortTemplates(s);
  // drop <ref>...</ref> and self-closing refs
  out = out.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/<ref[^>]*\/>/gi, "");
  // drop remaining templates {{...}} (innermost-first to handle nesting)
  let prev: string;
  do {
    prev = out;
    out = out.replace(/\{\{[^{}]*\}\}/g, "");
  } while (out !== prev);
  // [[target|label]] -> label ; [[target]] -> target
  out = out.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1");
  // strip a leading style/scope attribute on a cell ( style="..." | value )
  out = out.replace(/^\s*(?:scope="[^"]*"|style="[^"]*"|align="[^"]*")\s*\|/i, "");
  return out.replace(/'''?/g, "").trim();
}

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const res = await fetch(API);
  const json = await res.json();
  const wikitext: string = json.parse.wikitext;

  // Isolate the institutions table.
  const start = wikitext.indexOf('class="sortable wikitable');
  const end = wikitext.indexOf("\n|}", start);
  const table = wikitext.slice(start, end);

  const rows = table.split(/\n\|-/).slice(1); // first chunk is the header
  const records: SchoolRecord[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const headerMatch = row.match(/!scope="row"\|([\s\S]*?)(?:\n)/);
    if (!headerMatch) continue;
    const school = stripMarkup(headerMatch[1]);
    if (!school) continue;

    const womenOnly = /name="?Women"?/i.test(row);

    // The data cells live on the line(s) after the row header.
    const afterHeader = row.slice(row.indexOf(headerMatch[0]) + headerMatch[0].length);
    const dataLine = afterHeader.split("\n").find((l) => l.trim().startsWith("|")) ?? "";
    const cells = dataLine.replace(/^\s*\|/, "").split("||").map(stripMarkup);
    // cells: [nickname, city, state, enrollment, conference]
    const city = cells[1] ?? "";
    const state = (cells[2] ?? "").toUpperCase().slice(0, 2);
    const conference = cells[4] ?? "";

    let id = slugify(school);
    while (seen.has(id)) id += "-x";
    seen.add(id);

    records.push({
      id,
      school,
      city,
      state,
      conference,
      sports: womenOnly ? ["womens-basketball"] : ["mens-basketball", "womens-basketball"],
    });
  }

  const outPath = resolve(process.cwd(), "src/lib/programs.data.json");
  writeFileSync(outPath, JSON.stringify(records, null, 2) + "\n");
  console.log(`Wrote ${records.length} D-III schools to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
