import { NextRequest, NextResponse } from "next/server";
import { templateIntro } from "@/lib/draftIntro";
import { AthleteProfile, Program } from "@/lib/types";

// Generates a draft intro email to a coach. Uses Groq when GROQ_API_KEY is set;
// otherwise returns the deterministic template. Per our key decisions, the AI
// layer stays thin -- it polishes phrasing, it does not invent claims.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  const { profile, program } = (await req.json()) as {
    profile: AthleteProfile;
    program: Program;
  };

  const fallback = templateIntro(profile, program);
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ message: fallback, source: "template" });
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You write short, honest intro emails from a high school athlete to a college coach. " +
              "Plain, confident, no hype, no exaggeration. Never invent stats or achievements beyond what is provided. " +
              "Keep it under 160 words. Return only the email body.",
          },
          {
            role: "user",
            content:
              `Write the intro email using only these facts:\n` +
              `Athlete: ${profile.name}, class of ${profile.gradYear}, ${profile.position}, ` +
              `GPA ${profile.gpa}, ${profile.testType !== "none" && profile.testScore ? `${profile.testType} ${profile.testScore}, ` : ""}` +
              `film: ${profile.filmLink || "(none provided)"}.\n` +
              `Coach: ${program.coachName} at ${program.school} (${program.division}).\n` +
              `Draft to start from:\n${fallback}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ message: fallback, source: "template" });
    }
    const data = await res.json();
    const message = data?.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({
      message: message || fallback,
      source: message ? "groq" : "template",
    });
  } catch {
    return NextResponse.json({ message: fallback, source: "template" });
  }
}
