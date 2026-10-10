import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { materials, courses, aiUsage } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";
import { chat } from "@/lib/ai/gateway";

const DAILY_CAP = 40; // answers per user per day (tune in settings later)

async function underCap(userId: string) {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db.select().from(aiUsage).where(eq(aiUsage.userId, userId));
    return rows.filter((r) => r.createdAt >= since).length < DAILY_CAP;
  } catch {
    return true; // fail-open on DB issues; gateway still needs keys
  }
}

async function logUse(userId: string, scope: string, tokens: number) {
  try {
    await db.insert(aiUsage).values({ id: crypto.randomUUID(), userId, scope, tokens });
  } catch {
    /* usage logging must never break answers */
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { question, courseId, mode } = (await req.json()) ?? {};
    if (!question?.trim()) {
      return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
    }
    if (!(await underCap(user.id))) {
      return NextResponse.json(
        { error: "Daily AI limit reached. Try again tomorrow." },
        { status: 429 },
      );
    }

    // Course-scoped context: published material titles for citation grounding.
    // (Full vector retrieval lands with pgvector; titles keep v1 honest.)
    let context = "";
    let source: "course-material" | "general" = "general";
    let cites: { id: string; title: string }[] = [];
    if (courseId) {
      const mats = await db
        .select()
        .from(materials)
        .where(and(eq(materials.courseId, courseId), eq(materials.status, "published")));
      const course = (await db.select().from(courses).where(eq(courses.id, courseId)))[0];
      if (mats.length > 0) {
        source = "course-material";
        cites = mats.slice(0, 5).map((m) => ({ id: m.id, title: m.title }));
        context = `Course: ${course?.code ?? ""} ${course?.title ?? ""}.\nConfirmed materials:\n${mats
          .slice(0, 8)
          .map((m) => `- ${m.title} (${m.type})`)
          .join("\n")}\nUse these titles to ground the answer; say plainly when going beyond them.`;
      }
    }

    const modeLine =
      mode === "summarize"
        ? "Summarize clearly in short paragraphs."
        : mode === "practice"
          ? "Create 5 practice questions with an answer key at the end."
          : mode === "exam-prep"
            ? "Give a focused exam-prep plan with key points and pitfalls."
            : "Explain step by step with a simple example.";

    const { text, tokens } = await chat([
      {
        role: "system",
        content: `You are EduFarm study help for university students. ${modeLine} ${context}\nRules: never reveal grades or other students' work; if unsure, say so and suggest confirming with the lecturer's materials.`,
      },
      { role: "user", content: question.trim() },
    ]);

    await logUse(user.id, courseId ? `course:${courseId}` : "general", tokens);
    return NextResponse.json({ answer: text, source, cites });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unavailable";
    const status = msg.includes("not configured") ? 503 : msg.includes("limit") ? 429 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
