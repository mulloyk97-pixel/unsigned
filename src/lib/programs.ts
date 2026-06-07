import { AthleteProfile, Program, ProgramMatch, Region } from "./types";
import { levelRank } from "./assessment";

// ---------------------------------------------------------------------------
// Phase 2 seed: real NCAA Division III basketball programs (men's + women's).
//
// Locations and conferences are accurate. Cost figures are approximate and the
// win/loss records are PLACEHOLDERS pending enrichment (see winLossLastSeason).
// coachVerified is true only where we've stubbed a confirmed contact for the
// demo flow; everything else stays unverified with null contact fields.
//
// This is NOT the full D-III directory (~430 schools). The intended path is a
// bulk import script that loads the NCAA member directory into the `programs`
// table (see supabase/schema.sql) and flips records to coach_verified as our
// data team / club partners confirm contacts. The shape below matches that
// table 1:1 so the importer can write straight into it.
// ---------------------------------------------------------------------------

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

const HOOPS: Program["sports"] = ["mens-basketball", "womens-basketball"];

export const PROGRAMS: Program[] = [
  // --- NESCAC (highly selective, elite academics) ---
  {
    id: "williams", school: "Williams College", division: "DIII",
    conference: "NESCAC", city: "Williamstown", state: "MA", region: "Northeast",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.9, athleticTier: 5,
    stickerCost: 80000, typicalNetCost: 34000,
    coachVerified: true, coachName: "Coach A. Maker", coachEmail: "basketball.recruiting@williams.edu",
    winLossLastSeason: "24-5", photoUrl: null,
    blurb: "Perennial national contender that recruits high-character students who can flat-out play.",
  },
  {
    id: "amherst", school: "Amherst College", division: "DIII",
    conference: "NESCAC", city: "Amherst", state: "MA", region: "Northeast",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.9, athleticTier: 5,
    stickerCost: 81000, typicalNetCost: 33000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "22-6", photoUrl: null,
    blurb: "Multiple-time national champion program; elite academics, elite expectations.",
  },
  {
    id: "middlebury", school: "Middlebury College", division: "DIII",
    conference: "NESCAC", city: "Middlebury", state: "VT", region: "Northeast",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.85, athleticTier: 4,
    stickerCost: 79000, typicalNetCost: 35000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "19-8", photoUrl: null,
    blurb: "Top-tier liberal arts school with a consistently competitive NESCAC program.",
  },
  {
    id: "tufts", school: "Tufts University", division: "DIII",
    conference: "NESCAC", city: "Medford", state: "MA", region: "Northeast",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.8, athleticTier: 4,
    stickerCost: 82000, typicalNetCost: 36000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "20-7", photoUrl: null,
    blurb: "Research university just outside Boston with a strong, disciplined program.",
  },

  // --- UAA (highly selective research universities) ---
  {
    id: "washu", school: "Washington University in St. Louis", division: "DIII",
    conference: "UAA", city: "St. Louis", state: "MO", region: "Midwest",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.9, athleticTier: 4,
    stickerCost: 80000, typicalNetCost: 33000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "21-6", photoUrl: null,
    blurb: "Top-15 national university; the UAA travels nationally and plays a tough schedule.",
  },
  {
    id: "emory", school: "Emory University", division: "DIII",
    conference: "UAA", city: "Atlanta", state: "GA", region: "South",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.85, athleticTier: 3,
    stickerCost: 78000, typicalNetCost: 34000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "16-9", photoUrl: null,
    blurb: "Elite academics in Atlanta with strong merit and need aid for the right fit.",
  },
  {
    id: "uchicago", school: "University of Chicago", division: "DIII",
    conference: "UAA", city: "Chicago", state: "IL", region: "Midwest",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.95, athleticTier: 4,
    stickerCost: 84000, typicalNetCost: 35000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "18-8", photoUrl: null,
    blurb: "One of the most selective schools in the country; basketball that competes nationally.",
  },
  {
    id: "cmu", school: "Carnegie Mellon University", division: "DIII",
    conference: "UAA", city: "Pittsburgh", state: "PA", region: "Northeast",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.85, athleticTier: 3,
    stickerCost: 81000, typicalNetCost: 38000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "15-10", photoUrl: null,
    blurb: "STEM powerhouse; a great landing spot for a high-GPA player who wants real academics.",
  },

  // --- Centennial (selective) ---
  {
    id: "hopkins", school: "Johns Hopkins University", division: "DIII",
    conference: "Centennial", city: "Baltimore", state: "MD", region: "South",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.9, athleticTier: 4,
    stickerCost: 79000, typicalNetCost: 34000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "20-7", photoUrl: null,
    blurb: "World-class academics with a consistently strong Centennial Conference program.",
  },
  {
    id: "swarthmore", school: "Swarthmore College", division: "DIII",
    conference: "Centennial", city: "Swarthmore", state: "PA", region: "Northeast",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.9, athleticTier: 3,
    stickerCost: 80000, typicalNetCost: 32000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "17-9", photoUrl: null,
    blurb: "Tiny, ultra-selective liberal arts college near Philadelphia with rising hoops.",
  },

  // --- WIAC (public, moderate academics, elite basketball) ---
  {
    id: "uww", school: "UW–Whitewater", division: "DIII",
    conference: "WIAC", city: "Whitewater", state: "WI", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.3, athleticTier: 5,
    stickerCost: 20000, typicalNetCost: 15000,
    coachVerified: true, coachName: "Coach R. Helbig", coachEmail: "wbb.recruiting@uww.edu",
    winLossLastSeason: "25-4", photoUrl: null,
    blurb: "National-caliber basketball at one of the best net prices in Division III.",
  },
  {
    id: "uwo", school: "UW–Oshkosh", division: "DIII",
    conference: "WIAC", city: "Oshkosh", state: "WI", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.2, athleticTier: 5,
    stickerCost: 19000, typicalNetCost: 14000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "23-6", photoUrl: null,
    blurb: "National-championship pedigree (men's, 2017) and a very affordable public option.",
  },
  {
    id: "uwp", school: "UW–Platteville", division: "DIII",
    conference: "WIAC", city: "Platteville", state: "WI", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.1, athleticTier: 3,
    stickerCost: 18000, typicalNetCost: 13000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "16-10", photoUrl: null,
    blurb: "Low-cost public school that recruits hard-nosed players from the upper Midwest.",
  },

  // --- MIAA (Michigan) ---
  {
    id: "calvin", school: "Calvin University", division: "DIII",
    conference: "MIAA", city: "Grand Rapids", state: "MI", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.5, athleticTier: 4,
    stickerCost: 55000, typicalNetCost: 27000,
    coachVerified: true, coachName: "Coach D. Vander", coachEmail: "basketball@calvin.edu",
    winLossLastSeason: "21-7", photoUrl: null,
    blurb: "Strong faith-based school in Grand Rapids with a storied MIAA program and good aid.",
  },
  {
    id: "hope", school: "Hope College", division: "DIII",
    conference: "MIAA", city: "Holland", state: "MI", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.5, athleticTier: 5,
    stickerCost: 56000, typicalNetCost: 28000,
    coachVerified: true, coachName: "Coach B. Morehouse", coachEmail: "wbb@hope.edu",
    winLossLastSeason: "28-2", photoUrl: null,
    blurb: "National women's contender and strong men's program; passionate, packed home crowds.",
  },

  // --- CCIW (Illinois/Wisconsin) ---
  {
    id: "iwu", school: "Illinois Wesleyan University", division: "DIII",
    conference: "CCIW", city: "Bloomington", state: "IL", region: "Midwest",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.6, athleticTier: 4,
    stickerCost: 60000, typicalNetCost: 29000,
    coachVerified: true, coachName: "Coach M. Conway", coachEmail: "titanshoops@iwu.edu",
    winLossLastSeason: "22-6", photoUrl: null,
    blurb: "Selective academics plus a CCIW program that reliably competes for the league.",
  },
  {
    id: "wheaton-il", school: "Wheaton College (IL)", division: "DIII",
    conference: "CCIW", city: "Wheaton", state: "IL", region: "Midwest",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.6, athleticTier: 4,
    stickerCost: 58000, typicalNetCost: 30000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "19-8", photoUrl: null,
    blurb: "Rigorous Christian liberal arts college outside Chicago with a tough CCIW schedule.",
  },
  {
    id: "augustana-il", school: "Augustana College (IL)", division: "DIII",
    conference: "CCIW", city: "Rock Island", state: "IL", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.5, athleticTier: 3,
    stickerCost: 52000, typicalNetCost: 26000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "17-9", photoUrl: null,
    blurb: "Quad Cities liberal arts college that stacks merit aid for solid students.",
  },

  // --- Regional spread (ODAC / OAC / SAA / SCIAC / NWC / MIAC) ---
  {
    id: "randolph-macon", school: "Randolph-Macon College", division: "DIII",
    conference: "ODAC", city: "Ashland", state: "VA", region: "South",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.4, athleticTier: 5,
    stickerCost: 54000, typicalNetCost: 26000,
    coachVerified: true, coachName: "Coach J. Carmody", coachEmail: "mbb@rmc.edu",
    winLossLastSeason: "29-2", photoUrl: null,
    blurb: "Recent national champion (men's, 2022); proof you don't need a big name to win big.",
  },
  {
    id: "marietta", school: "Marietta College", division: "DIII",
    conference: "OAC", city: "Marietta", state: "OH", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.3, athleticTier: 3,
    stickerCost: 48000, typicalNetCost: 24000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "15-11", photoUrl: null,
    blurb: "Small Ohio college on the river with generous merit aid and roster openings.",
  },
  {
    id: "trinity-tx", school: "Trinity University", division: "DIII",
    conference: "SAA", city: "San Antonio", state: "TX", region: "South",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.7, athleticTier: 3,
    stickerCost: 58000, typicalNetCost: 28000,
    coachVerified: true, coachName: "Coach P. Ramos", coachEmail: "tigerhoops@trinity.edu",
    winLossLastSeason: "18-8", photoUrl: null,
    blurb: "Top academics in Texas with strong merit aid and a competitive SAA program.",
  },
  {
    id: "pomona-pitzer", school: "Pomona-Pitzer", division: "DIII",
    conference: "SCIAC", city: "Claremont", state: "CA", region: "West",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.8, athleticTier: 4,
    stickerCost: 79000, typicalNetCost: 33000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "21-6", photoUrl: null,
    blurb: "Elite SoCal liberal arts academics and a rising SCIAC basketball program.",
  },
  {
    id: "whitman", school: "Whitman College", division: "DIII",
    conference: "NWC", city: "Walla Walla", state: "WA", region: "West",
    sports: HOOPS, selectivity: "selective", avgGpa: 3.7, athleticTier: 3,
    stickerCost: 75000, typicalNetCost: 32000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "16-9", photoUrl: null,
    blurb: "Selective Pacific Northwest college with strong aid and a competitive NWC program.",
  },
  {
    id: "gustavus", school: "Gustavus Adolphus College", division: "DIII",
    conference: "MIAC", city: "St. Peter", state: "MN", region: "Midwest",
    sports: HOOPS, selectivity: "moderate", avgGpa: 3.5, athleticTier: 3,
    stickerCost: 60000, typicalNetCost: 29000,
    coachVerified: false, coachName: null, coachEmail: null,
    winLossLastSeason: "17-9", photoUrl: null,
    blurb: "Well-regarded Minnesota liberal arts college with deep MIAA/MIAC basketball roots.",
  },
];

// --- Fit scoring (basketball / D-III) -------------------------------------
// Weights per phase-2 spec. Academic is a hard gate at D-III and is weighted to
// reflect that. Win/loss record is intentionally NOT a factor.
const WEIGHTS = { athletic: 35, academic: 30, financial: 20, geographic: 15 };

function hasStrongTest(profile: AthleteProfile): boolean {
  return (
    (profile.testType === "SAT" && (profile.testScore ?? 0) >= 1200) ||
    (profile.testType === "ACT" && (profile.testScore ?? 0) >= 25)
  );
}

// Does the athlete's level match the program's typical recruit?
function athleticScore(profile: AthleteProfile, program: Program): number {
  const athlete = levelRank(profile.level); // 1-6
  const need = program.athleticTier + 1; // ~level needed to be a clear fit
  if (athlete >= need) return WEIGHTS.athletic;
  const gap = need - athlete;
  return Math.max(0, Math.round(WEIGHTS.athletic - gap * 9));
}

// GPA (+ small test bump) vs the school's admitted profile. Hard gate.
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

function whyItFits(profile: AthleteProfile, program: Program, parts: {
  athletic: number; academic: number; financial: number; geographic: number;
}): string {
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

// All phase-2 seed programs are D-III, so athletic fit is judged by program
// tier vs. the athlete's level rather than by division.
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
