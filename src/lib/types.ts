// Core domain types for Unsigned.
// V1 is athlete-side only: intake -> honest assessment -> right-fit shortlist.

export type Division = "DIII" | "NAIA" | "JUCO";

export const DIVISION_LABEL: Record<Division, string> = {
  DIII: "NCAA Division III",
  NAIA: "NAIA",
  JUCO: "Junior College (NJCAA)",
};

export type Region = "Northeast" | "Midwest" | "South" | "West";

export type Sport =
  | "mens-soccer"
  | "womens-soccer"
  | "baseball"
  | "softball"
  | "mens-basketball"
  | "womens-basketball"
  | "volleyball"
  | "football"
  | "track-cross-country"
  | "lacrosse";

export const SPORTS: { value: Sport; label: string }[] = [
  { value: "mens-soccer", label: "Men's Soccer" },
  { value: "womens-soccer", label: "Women's Soccer" },
  { value: "baseball", label: "Baseball" },
  { value: "softball", label: "Softball" },
  { value: "mens-basketball", label: "Men's Basketball" },
  { value: "womens-basketball", label: "Women's Basketball" },
  { value: "volleyball", label: "Volleyball" },
  { value: "football", label: "Football" },
  { value: "track-cross-country", label: "Track & Cross Country" },
  { value: "lacrosse", label: "Lacrosse" },
];

// Honest, ordered tiers of competition actually played. This is the single
// strongest signal we have at launch, so we ask for it plainly.
export type CompetitionLevel =
  | "jv"
  | "varsity-role"
  | "varsity-starter"
  | "all-conference"
  | "all-state"
  | "elite-club";

export const COMPETITION_LEVELS: {
  value: CompetitionLevel;
  label: string;
  help: string;
}[] = [
  { value: "jv", label: "JV / spot varsity minutes", help: "Mostly JV, limited varsity time." },
  { value: "varsity-role", label: "Varsity role player", help: "On varsity, not a regular starter." },
  { value: "varsity-starter", label: "Multi-year varsity starter", help: "Started consistently for 2+ seasons." },
  { value: "all-conference", label: "All-conference / all-league", help: "Recognized among the best in your league." },
  { value: "all-state", label: "All-state / all-region", help: "Recognized at the state or regional level." },
  { value: "elite-club", label: "National club / showcase circuit", help: "Played top travel/showcase competition." },
];

export type TestType = "SAT" | "ACT" | "none";

export interface AthleteProfile {
  name: string;
  gradYear: number;
  sport: Sport;
  position: string;
  gpa: number;
  testType: TestType;
  testScore: number | null;
  level: CompetitionLevel;
  filmLink: string;
  state: string; // two-letter code
  budgetPerYear: number; // max net cost/year the family can carry
  createdAt: string;
}

export type AcademicOpenness = "selective" | "moderate" | "open";

export interface Assessment {
  athletic: {
    realistic: Division[];
    reach: string | null; // honest reach note, or null
    headline: string;
    detail: string;
  };
  academic: {
    openness: AcademicOpenness;
    headline: string;
    detail: string;
  };
  verdict: string; // blunt plain-language summary
  matchDivisions: Division[]; // divisions used to build the shortlist
}

export interface Program {
  id: string;
  school: string;
  division: Division;
  conference: string;
  city: string;
  state: string;
  region: Region;
  sports: Sport[];
  selectivity: AcademicOpenness; // how hard it is to get in
  avgGpa: number;
  stickerCost: number; // published cost of attendance
  typicalNetCost: number; // honest typical net price after aid
  coachName: string;
  coachEmail: string;
  blurb: string; // why this program is an under-the-radar fit
}

export interface ProgramMatch {
  program: Program;
  fitScore: number; // 0-100
  why: string; // one-line "why this fits you"
}
