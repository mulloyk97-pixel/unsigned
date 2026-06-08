import { AcademicOpenness, AthleteProfile, Program, ProgramMatch, Region, Sport } from "./types";
import { levelRank } from "./assessment";
import rawSchools from "./programs.data.json";

// ---------------------------------------------------------------------------
// Program data.
//
// The base list (src/lib/programs.data.json) is every NCAA Division III
// institution, generated from the NCAA/Wikipedia directory by
// scripts/build-school-list.ts. It carries accurate identity data (school,
// city, state, conference, which basketball teams the school fields).
//
// Academics + net price are filled by scripts/enrich-scorecard.ts (College
// Scorecard). Until a school is enriched it falls back to conservative
// PLACEHOLDER defaults so ranking still works; enriched fields override them.
//
// Coach contacts are NEVER bulk-imported — verification is the moat. Schools
// default to coachVerified:false with null contacts. CURATED below marks a small
// set as verified with stub contacts so the verified-coach flow is demoable;
// these are clearly sample data to be replaced by real verification.
// ---------------------------------------------------------------------------

interface RawSchool {
  id: string;
  school: string;
  city: string;
  state: string;
  conference: string;
  sports: string[];
  // optional enrichment (written by the data:* scripts)
  selectivity?: AcademicOpenness;
  avgGpa?: number;
  stickerCost?: number;
  typicalNetCost?: number;
  schoolUrl?: string;
  photoUrl?: string;
  photoCredit?: string;
  winLossLastSeason?: string;
  // Scraped candidates from scripts/scrape-coaches.ts. Present but NOT shown to
  // athletes until coachVerified flips true (manual). coachReview marks records
  // where multiple emails were found and a human should pick.
  coachEmail?: string | null;
  coachName?: string | null;
  coachReview?: boolean;
}

// Conservative placeholders for un-enriched schools. Flagged here on purpose.
const DEFAULTS = {
  selectivity: "moderate" as AcademicOpenness,
  avgGpa: 3.3,
  stickerCost: 45000,
  typicalNetCost: 25000,
  athleticTier: 3,
};

// Hand-curated overrides (athletic tier + a few demo-verified contacts). Stub
// emails are sample data, not confirmed contacts.
const CURATED: Record<string, Partial<Program>> = {
  "williams-college": { athleticTier: 5, coachVerified: true, coachName: "Coach A. Maker", coachEmail: "basketball.recruiting@williams.edu" },
  "amherst-college": { athleticTier: 5 },
  "middlebury-college": { athleticTier: 4 },
  "tufts-university": { athleticTier: 4 },
  "washington-university-in-st-louis": { athleticTier: 4 },
  "emory-university": { athleticTier: 3 },
  "university-of-chicago": { athleticTier: 4 },
  "new-york-university": { athleticTier: 4 },
  "johns-hopkins-university": { athleticTier: 4 },
  "university-of-wisconsin-whitewater": { athleticTier: 5, coachVerified: true, coachName: "Coach R. Helbig", coachEmail: "wbb.recruiting@uww.edu" },
  "university-of-wisconsin-oshkosh": { athleticTier: 5 },
  "hope-college": { athleticTier: 5, coachVerified: true, coachName: "Coach B. Morehouse", coachEmail: "wbb@hope.edu" },
  "calvin-university": { athleticTier: 4, coachVerified: true, coachName: "Coach D. Vander", coachEmail: "basketball@calvin.edu" },
  "illinois-wesleyan-university": { athleticTier: 4, coachVerified: true, coachName: "Coach M. Conway", coachEmail: "titanshoops@iwu.edu" },
  "randolph-macon-college": { athleticTier: 5, coachVerified: true, coachName: "Coach J. Carmody", coachEmail: "mbb@rmc.edu" },
  "christopher-newport-university": { athleticTier: 5 },
  "trinity-university": { athleticTier: 3 },
};

const STATE_REGION: Record<string, Region> = {
  ME: "Northeast", NH: "Northeast", VT: "Northeast", MA: "Northeast",
  RI: "Northeast", CT: "Northeast", NY: "Northeast", NJ: "Northeast",
  PA: "Northeast",
  OH: "Midwest", MI: "Midwest", IN: "Midwest", IL: "Midwest", WI: "Midwest",
  MN: "Midwest", IA: "Midwest", MO: "Midwest", ND: "Midwest", SD: "Midwest",
  NE: "Midwest", KS: "Midwest",
  DE: "South", MD: "South", DC: "South", VA: "South", WV: "South",
  NC: "South", SC: "South", GA: "South", FL: "South", KY: "South",
  TN: "South", AL: "South", MS: "South", AR: "South", LA: "South",
  OK: "South", TX: "South",
  MT: "West", ID: "West", WY: "West", CO: "West", NM: "West", AZ: "West",
  UT: "West", NV: "West", CA: "West", OR: "West", WA: "West", AK: "West",
  HI: "West",
};

export function regionForState(state: string): Region {
  return STATE_REGION[state.toUpperCase()] ?? "Midwest";
}

const ADJACENT_REGIONS: Record<Region, Region[]> = {
  Northeast: ["Midwest", "South"],
  Midwest: ["Northeast", "South", "West"],
  South: ["Northeast", "Midwest"],
  West: ["Midwest"],
};

function normalize(raw: RawSchool): Program {
  const base: Program = {
    id: raw.id,
    school: raw.school,
    division: "DIII",
    conference: raw.conference,
    city: raw.city,
    state: raw.state,
    region: regionForState(raw.state),
    sports: raw.sports as Sport[],
    selectivity: raw.selectivity ?? DEFAULTS.selectivity,
    avgGpa: raw.avgGpa ?? DEFAULTS.avgGpa,
    stickerCost: raw.stickerCost ?? DEFAULTS.stickerCost,
    typicalNetCost: raw.typicalNetCost ?? DEFAULTS.typicalNetCost,
    athleticTier: DEFAULTS.athleticTier,
    coachVerified: false, // never set by scraping — manual only
    coachName: raw.coachName ?? null,
    coachEmail: raw.coachEmail ?? null, // candidate; hidden until coachVerified
    winLossLastSeason: raw.winLossLastSeason ?? null, // scraped, flagged unofficial in UI
    photoUrl: raw.photoUrl ?? null, // null -> generated SchoolPhoto placeholder
    photoCredit: raw.photoCredit ?? null,
    schoolUrl: raw.schoolUrl ?? null,
    blurb: `${raw.conference} program in ${raw.city}, ${raw.state}.`,
  };
  return { ...base, ...CURATED[raw.id] };
}

export const PROGRAMS: Program[] = (rawSchools as RawSchool[]).map(normalize);

// --- Fit scoring (basketball / D-III) -------------------------------------
// Weights per spec. Academic is a hard gate at D-III and weighted to reflect
// it. Win/loss record is intentionally NOT a factor.
const WEIGHTS = { athletic: 35, academic: 30, financial: 20, geographic: 15 };

function hasStrongTest(profile: AthleteProfile): boolean {
  return (
    (profile.testType === "SAT" && (profile.testScore ?? 0) >= 1200) ||
    (profile.testType === "ACT" && (profile.testScore ?? 0) >= 25)
  );
}

function athleticScore(profile: AthleteProfile, program: Program): number {
  const athlete = levelRank(profile.level); // 1-6
  const need = program.athleticTier + 1;
  if (athlete >= need) return WEIGHTS.athletic;
  const gap = need - athlete;
  return Math.max(0, Math.round(WEIGHTS.athletic - gap * 9));
}

function academicScore(profile: AthleteProfile, program: Program): number {
  const effGpa = profile.gpa + (hasStrongTest(profile) ? 0.1 : 0);
  const gap = effGpa - program.avgGpa;
  if (gap >= 0.1) return WEIGHTS.academic;
  const sel =
    program.selectivity === "selective" ? 1.3 : program.selectivity === "moderate" ? 1.0 : 0.8;
  const deficit = 0.1 - gap;
  const score = WEIGHTS.academic - deficit * 55 * sel;
  return Math.max(0, Math.min(WEIGHTS.academic, Math.round(score)));
}

function financialScore(profile: AthleteProfile, program: Program): number {
  if (profile.budgetPerYear <= 0) return Math.round(WEIGHTS.financial * 0.6);
  const ratio = program.typicalNetCost / profile.budgetPerYear;
  if (ratio <= 1) return WEIGHTS.financial;
  if (ratio <= 1.25) return Math.round(WEIGHTS.financial * 0.6);
  if (ratio <= 1.6) return Math.round(WEIGHTS.financial * 0.3);
  return 0;
}

function geographicScore(profile: AthleteProfile, program: Program): number {
  const home = regionForState(profile.state);
  if (program.state.toUpperCase() === profile.state.toUpperCase()) return WEIGHTS.geographic;
  if (program.region === home) return Math.round(WEIGHTS.geographic * 0.8);
  if (ADJACENT_REGIONS[home].includes(program.region)) return Math.round(WEIGHTS.geographic * 0.5);
  return Math.round(WEIGHTS.geographic * 0.15);
}

function whyItFits(
  profile: AthleteProfile,
  program: Program,
  parts: { athletic: number; academic: number; financial: number; geographic: number },
): string {
  const reasons: { score: number; text: string }[] = [];

  if (parts.academic >= WEIGHTS.academic && program.selectivity === "selective") {
    reasons.push({ score: parts.academic + 1, text: "your grades clear the bar at a school this selective" });
  } else if (parts.academic >= 24) {
    reasons.push({ score: parts.academic, text: "you're academically in range here" });
  }
  if (parts.athletic >= WEIGHTS.athletic) {
    reasons.push({ score: parts.athletic, text: "your level lines up with the players they recruit" });
  } else if (parts.athletic >= 20) {
    reasons.push({ score: parts.athletic, text: "you could earn a role here as you develop" });
  }
  if (parts.financial >= WEIGHTS.financial) {
    reasons.push({ score: parts.financial, text: `the ~$${(program.typicalNetCost / 1000).toFixed(0)}k net price fits your budget` });
  } else if (parts.financial >= 12) {
    reasons.push({ score: parts.financial, text: "the net price is within reach of your budget" });
  }
  if (program.state.toUpperCase() === profile.state.toUpperCase()) {
    reasons.push({ score: parts.geographic, text: `it's in ${program.state}, close to home` });
  } else if (program.region === regionForState(profile.state)) {
    reasons.push({ score: parts.geographic, text: `it's in your ${program.region} region` });
  }

  reasons.sort((a, b) => b.score - a.score);
  const top = reasons.slice(0, 2).map((r) => r.text);
  if (top.length === 0) return program.blurb;
  const sentence = top.join(", and ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

// All seed programs are D-III; athletic fit is judged by program tier vs level.
export function buildShortlist(profile: AthleteProfile, limit = 40): ProgramMatch[] {
  return PROGRAMS.filter((p) => p.sports.includes(profile.sport))
    .map((program) => {
      const parts = {
        athletic: athleticScore(profile, program),
        academic: academicScore(profile, program),
        financial: financialScore(profile, program),
        geographic: geographicScore(profile, program),
      };
      const fitScore = parts.athletic + parts.academic + parts.financial + parts.geographic;
      return { program, fitScore, why: whyItFits(profile, program, parts) };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, limit);
}

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}
