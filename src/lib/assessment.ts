import {
  AcademicOpenness,
  Assessment,
  AthleteProfile,
  CompetitionLevel,
  Division,
} from "./types";

// The honest assessment engine.
//
// This is deliberately semi-manual and rule-based at launch. The moat is honest
// data and trust, not a clever model, so the logic here is transparent and
// blunt on purpose. As real outcome data accumulates these heuristics get
// tuned (or replaced) -- but they should never inflate.

interface AthleticRule {
  realistic: Division[];
  reach: string | null;
  headline: string;
  detail: string;
}

const ATHLETIC_BY_LEVEL: Record<CompetitionLevel, AthleticRule> = {
  "elite-club": {
    realistic: ["DIII", "NAIA"],
    reach:
      "D-II is a real target if your film backs up the resume. Don't bank on D-I.",
    headline: "You can compete for a roster spot at strong D-III and NAIA programs.",
    detail:
      "Top travel and showcase competition is the level coaches at good D-III and NAIA programs recruit from. Lead with your film and let it carry the conversation.",
  },
  "all-state": {
    realistic: ["DIII", "NAIA"],
    reach: "A handful of D-II programs are worth a cold email, but treat them as a stretch.",
    headline: "D-III and NAIA are squarely in reach for you.",
    detail:
      "All-state recognition tells coaches you were among the best in a wide pool. That travels well to competitive D-III and NAIA rosters.",
  },
  "all-conference": {
    realistic: ["DIII", "NAIA", "JUCO"],
    reach: null,
    headline: "You're a realistic recruit across D-III, NAIA, and competitive JUCO.",
    detail:
      "All-conference is a solid, honest baseline. Mid-tier D-III and NAIA programs are your sweet spot; JUCO is a smart option if you want to develop and re-recruit.",
  },
  "varsity-starter": {
    realistic: ["DIII", "NAIA", "JUCO"],
    reach: null,
    headline: "Lower-tier D-III, NAIA, and JUCO are your honest target range.",
    detail:
      "A multi-year starter profiles well for many D-III and NAIA rosters that recruit for depth and development. JUCO is a strong path if you want a clearer route to playing time.",
  },
  "varsity-role": {
    realistic: ["JUCO", "NAIA"],
    reach: "Some developmental D-III rosters, if your film shows upside.",
    headline: "JUCO and developmental NAIA are the realistic starting point.",
    detail:
      "As a role player, the honest move is a program that recruits for development. JUCO lets you earn minutes and re-recruit to a four-year school with two years of game film.",
  },
  jv: {
    realistic: ["JUCO"],
    reach: "Developmental NAIA programs are possible, but JUCO is the smart first step.",
    headline: "JUCO is the honest path to keep playing and develop.",
    detail:
      "Limited varsity time means most four-year coaches won't have enough to evaluate. A JUCO season gives you real college film and a genuine route up. That's not a downgrade -- it's how a lot of players get found.",
  },
};

function academicAssessment(profile: AthleteProfile): Assessment["academic"] {
  const { gpa, testType, testScore } = profile;

  // Test scores can nudge openness up a tier (merit aid leverage), but never
  // down -- we don't punish kids who skipped a test.
  const strongTest =
    (testType === "SAT" && (testScore ?? 0) >= 1200) ||
    (testType === "ACT" && (testScore ?? 0) >= 25);

  let openness: AcademicOpenness;
  let headline: string;
  let detail: string;

  if (gpa >= 3.7) {
    openness = "selective";
    headline = "Your grades open doors your athletics alone won't.";
    detail =
      "A 3.7+ puts selective D-III academic schools and strong merit aid in play. At this level, academics can be the bigger lever -- use it.";
  } else if (gpa >= 3.3) {
    openness = "moderate";
    headline = "You're academically eligible across most D-III and NAIA programs.";
    detail =
      "A solid GPA keeps almost every D-III and NAIA option open and unlocks meaningful merit aid at many of them.";
  } else if (gpa >= 2.7) {
    openness = "open";
    headline = "Most NAIA and JUCO programs are open to you academically.";
    detail =
      "You'll clear eligibility at a broad set of NAIA and JUCO schools, plus some less-selective D-III programs. Focus your energy where the academic fit is realistic.";
  } else if (gpa >= 2.0) {
    openness = "open";
    headline = "JUCO is the cleanest academic path right now, with some NAIA options.";
    detail =
      "A JUCO year or two lets you raise your GPA and establish a college transcript, which reopens four-year doors that are tight today.";
  } else {
    openness = "open";
    headline = "Start at JUCO to establish eligibility -- that's the honest read.";
    detail =
      "Below a 2.0, four-year eligibility is the first hurdle. JUCO is built exactly for this: get eligible, get film, re-recruit.";
  }

  if (strongTest && openness !== "selective") {
    detail +=
      " Your test score is a real asset -- lead with it when you ask about academic and merit aid.";
  }

  return { openness, headline, detail };
}

export function buildAssessment(profile: AthleteProfile): Assessment {
  const athletic = ATHLETIC_BY_LEVEL[profile.level];

  const academic = academicAssessment(profile);

  // Divisions used for the shortlist combine the athletic realistic set with an
  // academic reality check: if grades force a JUCO-first path, make sure JUCO is
  // represented even when athletics alone would skip it.
  const matchDivisions: Division[] = [...athletic.realistic];
  if (profile.gpa < 2.7 && !matchDivisions.includes("JUCO")) {
    matchDivisions.push("JUCO");
  }

  const verdict = buildVerdict(profile, athletic, academic);

  return {
    athletic: {
      realistic: athletic.realistic,
      reach: athletic.reach,
      headline: athletic.headline,
      detail: athletic.detail,
    },
    academic,
    verdict,
    matchDivisions,
  };
}

function buildVerdict(
  profile: AthleteProfile,
  athletic: AthleticRule,
  academic: Assessment["academic"],
): string {
  const divisions = athletic.realistic
    .map((d) => (d === "DIII" ? "D-III" : d))
    .join(", ");

  const academicTension =
    academic.openness === "selective" && athletic.realistic.includes("JUCO")
      ? " Your grades are ahead of your athletic resume -- the right four-year academic fit may matter more than chasing a higher division."
      : academic.openness === "open" && profile.gpa < 2.7
        ? " Grades are the gate right now, so a JUCO-first plan is the honest move regardless of how the athletics shake out."
        : "";

  return (
    `Here's the straight version: ${divisions} is where you can realistically play.` +
    (athletic.reach ? ` ${athletic.reach}` : "") +
    academicTension +
    ` We'd rather you spend your time on programs that will actually recruit you than chase a level that won't call back.`
  );
}
