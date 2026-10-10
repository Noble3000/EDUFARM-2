import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tests, testQuestions, testAttempts } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Student submit: one attempt per test. MCQ auto-marked; all-MCQ publishes
// immediately, mixed tests wait for lecturer review of short answers.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "student" }, { status: 403 });
    }
    const { id } = await params;
    const found = await db.select().from(tests).where(eq(tests.id, id));
    if (!found[0]) return NextResponse.json({ error: "missing" }, { status: 404 });

    const existing = await db
      .select()
      .from(testAttempts)
      .where(and(eq(testAttempts.testId, id), eq(testAttempts.studentId, user.id)));
    if (existing[0]) {
      return NextResponse.json({ error: "Already submitted — one attempt per test." }, { status: 409 });
    }

    const { answers } = (await req.json()) ?? {};
    const questions = await db.select().from(testQuestions).where(eq(testQuestions.testId, id));

    let score = 0;
    let maxScore = 0;
    let hasShort = false;
    for (const q of questions) {
      maxScore += q.marks;
      const a = answers?.[q.id];
      if (q.kind === "mcq") {
        if (a?.selected === q.answerIndex) score += q.marks;
      } else {
        hasShort = true;
      }
    }

    const attemptId = crypto.randomUUID();
    const publishNow = !hasShort;
    await db.insert(testAttempts).values({
      id: attemptId,
      testId: id,
      studentId: user.id,
      answers: answers ?? {},
      score,
      maxScore,
      status: publishNow ? "published" : "submitted",
      publishedAt: publishNow ? new Date() : null,
    });
    // Confirmation receipt (PRD §5.6).
    return NextResponse.json(
      { id: attemptId, received: true, published: publishNow },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
