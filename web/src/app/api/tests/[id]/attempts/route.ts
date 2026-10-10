import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testAttempts, testQuestions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Lecturer: review short answers (adjust score) and publish.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { id } = await params;
    const { attemptId, shortMarks, publish } = (await req.json()) ?? {};
    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required." }, { status: 400 });
    }
    const found = await db.select().from(testAttempts).where(eq(testAttempts.id, attemptId));
    const attempt = found[0];
    if (!attempt || attempt.testId !== id) {
      return NextResponse.json({ error: "missing" }, { status: 404 });
    }

    // Recompute: MCQ marks from stored answers + lecturer-awarded short marks.
    const questions = await db.select().from(testQuestions).where(eq(testQuestions.testId, id));
    let mcqScore = 0;
    let maxScore = 0;
    for (const q of questions) {
      maxScore += q.marks;
      if (q.kind === "mcq" && attempt.answers?.[q.id]?.selected === q.answerIndex) {
        mcqScore += q.marks;
      }
    }
    let shortScore = 0;
    for (const q of questions.filter((x) => x.kind === "short")) {
      const awarded = Number(shortMarks?.[q.id] ?? 0);
      shortScore += Math.max(0, Math.min(q.marks, Math.floor(awarded || 0)));
    }
    const score = mcqScore + shortScore;

    await db
      .update(testAttempts)
      .set({
        score,
        maxScore,
        status: publish ? "published" : "submitted",
        publishedAt: publish ? new Date() : null,
      })
      .where(eq(testAttempts.id, attemptId));
    return NextResponse.json({ ok: true, score, published: !!publish });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
