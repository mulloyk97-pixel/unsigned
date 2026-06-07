/**
 * import-to-supabase.ts
 *
 * Upserts src/lib/programs.data.json into the Supabase `programs` table
 * (schema: supabase/schema.sql). Run after build-school-list + enrich-scorecard.
 *
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=service_role_key \
 *   npx tsx scripts/import-to-supabase.ts
 *
 * Uses the service-role key (server-side only — never ship it to the client).
 * coach_verified / coach contacts are left to be managed in the DB; this only
 * loads identity + enrichment fields and won't clobber verified contacts when
 * onConflict-updating, because it omits those columns.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

interface School {
  id: string;
  school: string;
  city: string;
  state: string;
  conference: string;
  sports: string[];
  selectivity?: string;
  avgGpa?: number;
  stickerCost?: number;
  typicalNetCost?: number;
}

const REGION: Record<string, string> = {
  ME: "Northeast", NH: "Northeast", VT: "Northeast", MA: "Northeast", RI: "Northeast",
  CT: "Northeast", NY: "Northeast", NJ: "Northeast", PA: "Northeast",
  OH: "Midwest", MI: "Midwest", IN: "Midwest", IL: "Midwest", WI: "Midwest", MN: "Midwest",
  IA: "Midwest", MO: "Midwest", ND: "Midwest", SD: "Midwest", NE: "Midwest", KS: "Midwest",
  DE: "South", MD: "South", DC: "South", VA: "South", WV: "South", NC: "South", SC: "South",
  GA: "South", FL: "South", KY: "South", TN: "South", AL: "South", MS: "South", AR: "South",
  LA: "South", OK: "South", TX: "South",
  MT: "West", ID: "West", WY: "West", CO: "West", NM: "West", AZ: "West", UT: "West",
  NV: "West", CA: "West", OR: "West", WA: "West", AK: "West", HI: "West",
};

async function main() {
  const path = resolve(process.cwd(), "src/lib/programs.data.json");
  const schools: School[] = JSON.parse(readFileSync(path, "utf8"));

  const rows = schools.map((s) => ({
    id: s.id,
    school: s.school,
    division: "DIII",
    conference: s.conference,
    city: s.city,
    state: s.state,
    region: REGION[s.state] ?? "Midwest",
    sports: s.sports,
    selectivity: s.selectivity ?? null,
    avg_gpa: s.avgGpa ?? null,
    sticker_cost: s.stickerCost ?? null,
    typical_net_cost: s.typicalNetCost ?? null,
  }));

  // Upsert in batches; only the columns above are written, so coach_verified,
  // coach contacts, win/loss and photos managed in-DB are preserved.
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const res = await fetch(`${URL}/rest/v1/programs?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: KEY as string,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      throw new Error(`Supabase upsert failed (${res.status}): ${await res.text()}`);
    }
    console.log(`Upserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
