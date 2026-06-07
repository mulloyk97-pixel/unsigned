import { AthleteProfile, DIVISION_LABEL, Program } from "./types";

// Shared, deterministic draft intro. This is the fallback used whenever Groq
// isn't configured -- and it's intentionally good on its own, because an
// honest, plain template beats a flashy generated email the family can't trust.

export function templateIntro(profile: AthleteProfile, program: Program): string {
  const firstName = profile.name.trim().split(/\s+/)[0] || "[Your name]";
  const sportLabel = profile.sport
    .replace(/-/g, " ")
    .replace(/\bmens\b/, "men's")
    .replace(/\bwomens\b/, "women's");
  const test =
    profile.testType !== "none" && profile.testScore
      ? `, ${profile.testType} ${profile.testScore}`
      : "";

  return `Hi ${program.coachName ?? "Coach"},

My name is ${profile.name}, a ${profile.position} in the class of ${profile.gradYear}. I'm reaching out because ${program.school} looks like a genuine fit for me academically, athletically, and financially -- not a long shot.

Quick snapshot:
- Position: ${profile.position} (${sportLabel})
- Level played: real competition, and I'm being honest about where I am as a recruit
- Academics: ${profile.gpa.toFixed(2)} GPA${test}
- Film: ${profile.filmLink || "[link to your highlight + full-game film]"}

I'd love to learn what you look for in a ${DIVISION_LABEL[program.division]} recruit and whether I could earn a spot in your program. Thank you for your time, Coach.

Best,
${firstName}
${profile.filmLink || ""}`.trim();
}
