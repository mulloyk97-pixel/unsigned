/**
 * upload-photos.ts
 *
 * Moves the cached program photos out of the git repo and into Supabase
 * Storage, then rewrites photoUrl in programs.data.json to the public Storage
 * URLs. After this runs successfully you can stop tracking the local folder:
 *
 *   git rm -r --cached public/programs
 *   echo "public/programs/" >> .gitignore
 *
 * Requires the SERVICE ROLE key (server-only — never ship it to the client):
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=service_role_key \
 *   npm run data:photos:upload
 *
 * Idempotent: re-running upserts and is safe. Bucket: `program-photos` (public).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "program-photos";
const DIR = resolve(process.cwd(), "public/programs");

if (!URL || !KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
};

async function ensureBucket() {
  const res = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY as string, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) return console.log(`Created bucket ${BUCKET}.`);
  const body = await res.text();
  if (body.includes("already exists") || res.status === 409) return console.log(`Bucket ${BUCKET} exists.`);
  throw new Error(`Bucket create failed (${res.status}): ${body}`);
}

async function upload(file: string, bytes: Buffer): Promise<boolean> {
  const ext = file.split(".").pop()!.toLowerCase();
  const res = await fetch(`${URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(file)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      apikey: KEY as string,
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "x-upsert": "true",
    },
    body: new Uint8Array(bytes),
  });
  return res.ok;
}

async function main() {
  await ensureBucket();

  const dataPath = resolve(process.cwd(), "src/lib/programs.data.json");
  const schools: { id: string; photoUrl?: string }[] = JSON.parse(readFileSync(dataPath, "utf8"));
  const byId = new Map(schools.map((s) => [s.id, s]));

  const files = readdirSync(DIR).filter((f) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f));
  console.log(`Uploading ${files.length} photos to ${BUCKET}…`);

  let ok = 0, failed = 0;
  for (const file of files) {
    const bytes = readFileSync(resolve(DIR, file));
    const success = await upload(file, bytes);
    if (success) {
      const id = file.replace(/\.[^.]+$/, "");
      const rec = byId.get(id);
      if (rec) rec.photoUrl = `${URL}/storage/v1/object/public/${BUCKET}/${file}`;
      ok++;
    } else {
      failed++;
      console.log(`  ! ${file} failed`);
    }
    if ((ok + failed) % 40 === 0) console.log(`  …${ok + failed}/${files.length}`);
    await sleep(60);
  }

  writeFileSync(dataPath, JSON.stringify(schools, null, 2) + "\n");
  console.log(`\nDone. Uploaded ${ok}, failed ${failed}. photoUrl rewritten to Storage URLs.`);
  console.log("Next: git rm -r --cached public/programs && echo 'public/programs/' >> .gitignore");
}

main().catch((e) => { console.error(e); process.exit(1); });
