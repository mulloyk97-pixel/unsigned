import { Assessment, AthleteProfile, CompetitionLevel, Division } from "./types";

// The honest assessment engine (phase 2).
//
// We deliberately do NOT tell athletes their division ceiling anymore. Instead
// we hand them the two things a coach who respects them would say: what makes
// them a genuine recruit, and the one real thing standing in their way.
//
// Still rule-based on purpose -- the moat is honest data and trust, not a model.
// matchDivisions and levelRank are kept internal to drive ranking.

// Numeric rank of competition actually played (1 = lowest). Used by the program
// matcher to compare an athlete against a program's recruit level.
export function levelRank(level: CompetitionLevel): number {
  const order: Record<CompetitionLevel, number> = {
    jv: 1,
    "varsity-role": 2,
    "varsity-starter": 3,
    "all-conference": 4,
    "all-state": 5,
    "elite-club": 6,
  };
  return order[level];
}

// Internal: realistic divisions, used only for ranking (never displayed).
const REALISTIC_BY_LEVEL: Record<CompetitionLevel, Division[]> = {
  "elite-club": ["DIII", "NAIA"],
  "all-state": ["DIII", "NAIA"],
  "all-conference": ["DIII", "NAIA", "JUCO"],
  "varsity-starter": ["DIII", "NAIA", "JUCO"],
  "varsity-role": ["JUCO", "NAIA"],
  jv: ["JUCO"],
};

function strongTest(profile: AthleteProfile): boolean {
  return (
    (profile.testType === "SAT" && (profile.testScore ?? 0) >= 1200) ||
    (profile.testType === "ACT" && (profile.testScore ?? 0) >= 25)
  );
}

// "What makes you a real recruit" — direct, specific, no hype.
function buildStrengths(profile: AthleteProfile): string {
  const athletic: Record<CompetitionLevel, string> = {
    "elite-club":
      "You've competed on the showcase circuit, so coaches don't have to project — they can see on film that you belong.",
    "all-state":
      "All-state recognition means you stood out in a deep pool. That's a credential D-III coaches take seriously.",
    "all-conference":
      "You've produced against real competition, night in and night out — coaches trust players who do it consistently.",
    "varsity-starter":
      "Multiple years as a varsity starter tells coaches you're durable, coachable, and ready to contribute right away.",
    "varsity-role":
      "You know how to earn minutes and play your role — exactly what programs that recruit for development want.",
    jv: "You're early in your varsity arc, which means your best basketball is genuinely still ahead of you.",
  };

  let line = athletic[profile.level];

  if (profile.gpa >= 3.5) {
    line +=
      " And your grades put you in range at academically selective programs that turn away better athletes — that combination is your real edge.";
  } else if (profile.gpa >= 3.0) {
    line +=
      " Pair that with solid grades and you're a low-risk recruit a coach can actually get admitted.";
  } else if (strongTest(profile)) {
    line +=
      " Your test score is a real asset — lead with it to open up academic and merit aid.";
  }

  return line;
}

// "Your honest challenge" — one blunt phrase naming the real thing to fix.
function buildChallenge(profile: AthleteProfile): string {
  const rank = levelRank(profile.level);

  if (profile.gpa < 2.7) {
    return "Your grades, not your game, are what's closing doors right now.";
  }
  if (rank <= 2) {
    return "You need film that proves you can play a level up.";
  }
  if (profile.testType === "none") {
    return "Get a test score on record — at academic D-IIIs it can decide admission and aid.";
  }
  if (rank <= 3 && profile.gpa < 3.3) {
    return "Tighten the academics; at D-III they gate you before your game gets a real look.";
  }
  return "Your job now is exposure — coaches can't recruit a player they've never seen.";
}

export function buildAssessment(profile: AthleteProfile): Assessment {
  const matchDivisions: Division[] = [...REALISTIC_BY_LEVEL[profile.level]];
  if (profile.gpa < 2.7 && !matchDivisions.includes("JUCO")) {
    matchDivisions.push("JUCO");
  }

  return {
    strengths: buildStrengths(profile),
    challenge: buildChallenge(profile),
    matchDivisions,
  };
}
