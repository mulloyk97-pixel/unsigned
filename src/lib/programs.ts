import {
  AthleteProfile,
  Program,
  ProgramMatch,
  Region,
} from "./types";

// Sample seed dataset for V1. These are real, genuinely under-the-radar
// D-III / NAIA / JUCO schools, but the cost figures are approximate and the
// coach contacts are placeholder recruiting inboxes -- the honest data layer
// (verified contacts, real net-price outcomes) is what we build next.

const STATE_REGION: Record<string, Region> = {
  // Northeast
  ME: "Northeast", NH: "Northeast", VT: "Northeast", MA: "Northeast",
  RI: "Northeast", CT: "Northeast", NY: "Northeast", NJ: "Northeast",
  PA: "Northeast",
  // Midwest
  OH: "Midwest", MI: "Midwest", IN: "Midwest", IL: "Midwest", WI: "Midwest",
  MN: "Midwest", IA: "Midwest", MO: "Midwest", ND: "Midwest", SD: "Midwest",
  NE: "Midwest", KS: "Midwest",
  // South
  DE: "South", MD: "South", DC: "South", VA: "South", WV: "South",
  NC: "South", SC: "South", GA: "South", FL: "South", KY: "South",
  TN: "South", AL: "South", MS: "South", AR: "South", LA: "South",
  OK: "South", TX: "South",
  // West
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

// Most small colleges field many teams, so programs offer a broad sport set.
const COMMON: Program["sports"] = [
  "mens-soccer", "womens-soccer", "baseball", "softball",
  "mens-basketball", "womens-basketball", "volleyball",
  "track-cross-country",
];
const WITH_FOOTBALL: Program["sports"] = [...COMMON, "football"];
const WITH_LAX: Program["sports"] = [...COMMON, "lacrosse"];
const FULL: Program["sports"] = [...COMMON, "football", "lacrosse"];

export const PROGRAMS: Program[] = [
  // --- Northeast ---
  {
    id: "keystone", school: "Keystone College", division: "DIII",
    conference: "CSAC", city: "La Plume", state: "PA", region: "Northeast",
    sports: WITH_LAX, selectivity: "open", avgGpa: 3.0,
    stickerCost: 42000, typicalNetCost: 19000,
    coachName: "Coach M. Reyes", coachEmail: "recruiting@keystone.edu",
    blurb: "Small Pennsylvania D-III that recruits hard for depth and gives transfers a real look.",
  },
  {
    id: "lasell", school: "Lasell University", division: "DIII",
    conference: "GNAC", city: "Newton", state: "MA", region: "Northeast",
    sports: FULL, selectivity: "moderate", avgGpa: 3.3,
    stickerCost: 55000, typicalNetCost: 27000,
    coachName: "Coach D. Whitfield", coachEmail: "athletics@lasell.edu",
    blurb: "Boston-area D-III with strong aid and a coaching staff that answers cold emails.",
  },
  {
    id: "morrisville", school: "SUNY Morrisville", division: "DIII",
    conference: "NAC", city: "Morrisville", state: "NY", region: "Northeast",
    sports: WITH_FOOTBALL, selectivity: "open", avgGpa: 2.9,
    stickerCost: 26000, typicalNetCost: 14000,
    coachName: "Coach T. Banks", coachEmail: "recruiting@morrisville.edu",
    blurb: "Low-cost public D-III in upstate NY -- one of the best net-price values in the Northeast.",
  },
  {
    id: "wells", school: "Wells College", division: "DIII",
    conference: "NEAC", city: "Aurora", state: "NY", region: "Northeast",
    sports: WITH_LAX, selectivity: "moderate", avgGpa: 3.2,
    stickerCost: 48000, typicalNetCost: 21000,
    coachName: "Coach R. Okafor", coachEmail: "athletics@wells.edu",
    blurb: "Tiny Finger Lakes D-III where role players become starters fast.",
  },
  {
    id: "cazenovia", school: "Cobleskill (SUNY)", division: "DIII",
    conference: "NAC", city: "Cobleskill", state: "NY", region: "Northeast",
    sports: WITH_LAX, selectivity: "open", avgGpa: 2.8,
    stickerCost: 24000, typicalNetCost: 13000,
    coachName: "Coach A. Ferraro", coachEmail: "recruiting@cobleskill.edu",
    blurb: "Affordable SUNY D-III that actively recruits developing athletes.",
  },

  // --- Midwest ---
  {
    id: "manchester", school: "Manchester University", division: "DIII",
    conference: "HCAC", city: "North Manchester", state: "IN", region: "Midwest",
    sports: FULL, selectivity: "moderate", avgGpa: 3.2,
    stickerCost: 44000, typicalNetCost: 18000,
    coachName: "Coach J. Pruitt", coachEmail: "recruiting@manchester.edu",
    blurb: "Indiana D-III known for stacking merit and need aid -- net price beats most state schools.",
  },
  {
    id: "graceland", school: "Graceland University", division: "NAIA",
    conference: "Heart", city: "Lamoni", state: "IA", region: "Midwest",
    sports: WITH_FOOTBALL, selectivity: "open", avgGpa: 3.0,
    stickerCost: 38000, typicalNetCost: 17000,
    coachName: "Coach L. Stamper", coachEmail: "athletics@graceland.edu",
    blurb: "Iowa NAIA program with athletic scholarship money D-III simply can't offer.",
  },
  {
    id: "culver", school: "Culver-Stockton College", division: "NAIA",
    conference: "Heart", city: "Canton", state: "MO", region: "Midwest",
    sports: WITH_FOOTBALL, selectivity: "open", avgGpa: 3.0,
    stickerCost: 40000, typicalNetCost: 18000,
    coachName: "Coach B. Hollis", coachEmail: "recruiting@culver.edu",
    blurb: "Missouri NAIA that recruits nationally and hands out real athletic aid.",
  },
  {
    id: "rockford", school: "Rockford University", division: "DIII",
    conference: "NACC", city: "Rockford", state: "IL", region: "Midwest",
    sports: WITH_LAX, selectivity: "open", avgGpa: 3.0,
    stickerCost: 36000, typicalNetCost: 16000,
    coachName: "Coach S. Delgado", coachEmail: "athletics@rockford.edu",
    blurb: "Illinois D-III with low net cost and roster spots for hungry contributors.",
  },
  {
    id: "ellsworth", school: "Ellsworth CC", division: "JUCO",
    conference: "ICCAC", city: "Iowa Falls", state: "IA", region: "Midwest",
    sports: WITH_FOOTBALL, selectivity: "open", avgGpa: 2.4,
    stickerCost: 16000, typicalNetCost: 9000,
    coachName: "Coach K. Mathis", coachEmail: "recruiting@ecc.edu",
    blurb: "Iowa JUCO with a real track record of moving players up to four-year programs.",
  },
  {
    id: "kishwaukee", school: "Kishwaukee College", division: "JUCO",
    conference: "NJCAA D-II", city: "Malta", state: "IL", region: "Midwest",
    sports: COMMON, selectivity: "open", avgGpa: 2.3,
    stickerCost: 14000, typicalNetCost: 8000,
    coachName: "Coach P. Nowak", coachEmail: "athletics@kish.edu",
    blurb: "Affordable Illinois JUCO -- develop, raise your GPA, re-recruit with college film.",
  },
  {
    id: "defiance", school: "Defiance College", division: "DIII",
    conference: "HCAC", city: "Defiance", state: "OH", region: "Midwest",
    sports: FULL, selectivity: "open", avgGpa: 2.9,
    stickerCost: 39000, typicalNetCost: 16000,
    coachName: "Coach R. Tindall", coachEmail: "recruiting@defiance.edu",
    blurb: "Ohio D-III that leans into transfers and late bloomers.",
  },

  // --- South ---
  {
    id: "ferrum", school: "Ferrum College", division: "DIII",
    conference: "ODAC", city: "Ferrum", state: "VA", region: "South",
    sports: FULL, selectivity: "open", avgGpa: 2.9,
    stickerCost: 41000, typicalNetCost: 17000,
    coachName: "Coach D. Calloway", coachEmail: "recruiting@ferrum.edu",
    blurb: "Virginia D-III with deep rosters and strong need-based aid.",
  },
  {
    id: "brevard", school: "Brevard College", division: "DIII",
    conference: "USA South", city: "Brevard", state: "NC", region: "South",
    sports: WITH_LAX, selectivity: "open", avgGpa: 3.0,
    stickerCost: 43000, typicalNetCost: 18000,
    coachName: "Coach H. Sumner", coachEmail: "athletics@brevard.edu",
    blurb: "Mountain-town North Carolina D-III where film matters more than your high school's name.",
  },
  {
    id: "lagrange", school: "LaGrange College", division: "DIII",
    conference: "USA South", city: "LaGrange", state: "GA", region: "South",
    sports: FULL, selectivity: "moderate", avgGpa: 3.2,
    stickerCost: 45000, typicalNetCost: 19000,
    coachName: "Coach M. Estrada", coachEmail: "recruiting@lagrange.edu",
    blurb: "Georgia's oldest private college, generous with merit aid for solid students.",
  },
  {
    id: "blue-mountain", school: "Blue Mountain Christian Univ.", division: "NAIA",
    conference: "SSAC", city: "Blue Mountain", state: "MS", region: "South",
    sports: WITH_FOOTBALL, selectivity: "open", avgGpa: 2.9,
    stickerCost: 28000, typicalNetCost: 14000,
    coachName: "Coach J. Trahan", coachEmail: "athletics@bmc.edu",
    blurb: "Low-cost Mississippi NAIA with athletic aid and a wide recruiting net.",
  },
  {
    id: "blinn", school: "Blinn College", division: "JUCO",
    conference: "NJCAA", city: "Brenham", state: "TX", region: "South",
    sports: WITH_FOOTBALL, selectivity: "open", avgGpa: 2.4,
    stickerCost: 15000, typicalNetCost: 9000,
    coachName: "Coach C. Villarreal", coachEmail: "recruiting@blinn.edu",
    blurb: "Powerhouse Texas JUCO with a long line of players who moved up to four-year ball.",
  },
  {
    id: "louisburg", school: "Louisburg College", division: "JUCO",
    conference: "Region X", city: "Louisburg", state: "NC", region: "South",
    sports: COMMON, selectivity: "open", avgGpa: 2.3,
    stickerCost: 22000, typicalNetCost: 12000,
    coachName: "Coach E. Boykin", coachEmail: "athletics@louisburg.edu",
    blurb: "North Carolina JUCO built around developing and placing student-athletes.",
  },

  // --- West ---
  {
    id: "rocky", school: "Rocky Mountain College", division: "NAIA",
    conference: "Frontier", city: "Billings", state: "MT", region: "West",
    sports: WITH_FOOTBALL, selectivity: "moderate", avgGpa: 3.1,
    stickerCost: 39000, typicalNetCost: 18000,
    coachName: "Coach G. Halvorson", coachEmail: "recruiting@rocky.edu",
    blurb: "Montana NAIA with athletic scholarships and a tight-knit program.",
  },
  {
    id: "ottawa-az", school: "Ottawa University Arizona", division: "NAIA",
    conference: "GSAC", city: "Surprise", state: "AZ", region: "West",
    sports: WITH_FOOTBALL, selectivity: "open", avgGpa: 3.0,
    stickerCost: 37000, typicalNetCost: 17000,
    coachName: "Coach N. Aragon", coachEmail: "athletics@ottawa.edu",
    blurb: "Fast-growing Arizona NAIA actively building rosters across every sport.",
  },
  {
    id: "lewis-clark", school: "Lewis-Clark State College", division: "NAIA",
    conference: "Cascade", city: "Lewiston", state: "ID", region: "West",
    sports: WITH_LAX, selectivity: "moderate", avgGpa: 3.1,
    stickerCost: 25000, typicalNetCost: 13000,
    coachName: "Coach W. Stoddard", coachEmail: "recruiting@lcsc.edu",
    blurb: "Idaho NAIA with national-caliber programs and a low net price.",
  },
  {
    id: "pacific-union", school: "Pacific Union College", division: "DIII",
    conference: "Cal Pac", city: "Angwin", state: "CA", region: "West",
    sports: WITH_LAX, selectivity: "moderate", avgGpa: 3.2,
    stickerCost: 46000, typicalNetCost: 21000,
    coachName: "Coach I. Mendez", coachEmail: "athletics@puc.edu",
    blurb: "Northern California small college with meaningful merit aid and roster openings.",
  },
  {
    id: "colorado-nw", school: "Colorado Northwestern CC", division: "JUCO",
    conference: "NJCAA", city: "Rangely", state: "CO", region: "West",
    sports: COMMON, selectivity: "open", avgGpa: 2.3,
    stickerCost: 17000, typicalNetCost: 10000,
    coachName: "Coach T. Beaumont", coachEmail: "recruiting@cncc.edu",
    blurb: "Colorado JUCO -- affordable launchpad to four-year programs out West.",
  },
  {
    id: "warner-pacific", school: "Warner Pacific University", division: "NAIA",
    conference: "Cascade", city: "Portland", state: "OR", region: "West",
    sports: WITH_LAX, selectivity: "open", avgGpa: 3.0,
    stickerCost: 33000, typicalNetCost: 16000,
    coachName: "Coach F. Ananda", coachEmail: "athletics@warnerpacific.edu",
    blurb: "Small Portland NAIA that recruits for character and upside as much as stats.",
  },
];

// --- Fit scoring -------------------------------------------------------------
// Four weighted factors, each honest and explainable. A program that doesn't
// offer the athlete's sport is excluded entirely.

const WEIGHTS = { athletic: 40, academic: 25, financial: 20, geographic: 15 };

function athleticScore(program: Program, match: ProgramMatchContext): number {
  if (match.matchDivisions.includes(program.division)) return WEIGHTS.athletic;
  // Adjacent-division partial credit so the list isn't monotone.
  return Math.round(WEIGHTS.athletic * 0.4);
}

function academicScore(profile: AthleteProfile, program: Program): number {
  const gap = profile.gpa - program.avgGpa;
  // Comfortably above the program's average = clean admit and aid leverage.
  if (gap >= 0.2) return WEIGHTS.academic;
  if (gap >= -0.1) return Math.round(WEIGHTS.academic * 0.85);
  if (gap >= -0.4) return Math.round(WEIGHTS.academic * 0.55);
  return Math.round(WEIGHTS.academic * 0.25);
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
  if (program.state.toUpperCase() === profile.state.toUpperCase()) {
    return WEIGHTS.geographic;
  }
  if (program.region === home) return Math.round(WEIGHTS.geographic * 0.85);
  if (ADJACENT_REGIONS[home].includes(program.region)) {
    return Math.round(WEIGHTS.geographic * 0.5);
  }
  return Math.round(WEIGHTS.geographic * 0.15);
}

interface ProgramMatchContext {
  matchDivisions: Program["division"][];
}

function whyItFits(profile: AthleteProfile, program: Program, ctx: ProgramMatchContext): string {
  const reasons: { weight: number; text: string }[] = [];

  if (ctx.matchDivisions.includes(program.division)) {
    reasons.push({
      weight: 4,
      text: `${program.division === "DIII" ? "D-III" : program.division} is your realistic level, and this roster recruits players like you`,
    });
  }
  if (program.typicalNetCost <= profile.budgetPerYear) {
    reasons.push({
      weight: 3,
      text: `typical net cost (~$${(program.typicalNetCost / 1000).toFixed(0)}k) lands inside your budget`,
    });
  }
  if (profile.gpa - program.avgGpa >= 0.2) {
    reasons.push({ weight: 2, text: `your grades are above their average, which helps with admission and aid` });
  }
  if (program.state.toUpperCase() === profile.state.toUpperCase()) {
    reasons.push({ weight: 2, text: `it's in ${program.state}, close to home` });
  } else if (program.region === regionForState(profile.state)) {
    reasons.push({ weight: 1, text: `it's in your region (${program.region})` });
  }

  reasons.sort((a, b) => b.weight - a.weight);
  const top = reasons.slice(0, 2).map((r) => r.text);
  if (top.length === 0) return program.blurb;

  const sentence = top.join(", and ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

export function buildShortlist(
  profile: AthleteProfile,
  matchDivisions: Program["division"][],
  limit = 18,
): ProgramMatch[] {
  const ctx: ProgramMatchContext = { matchDivisions };

  return PROGRAMS.filter((p) => p.sports.includes(profile.sport))
    .map((program) => {
      const fitScore =
        athleticScore(program, ctx) +
        academicScore(profile, program) +
        financialScore(profile, program) +
        geographicScore(profile, program);
      return { program, fitScore, why: whyItFits(profile, program, ctx) };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, limit);
}

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}
