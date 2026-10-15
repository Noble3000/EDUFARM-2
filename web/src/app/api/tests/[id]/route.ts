import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tests, testQuestions, courses, testAttempts, user as usersTable } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Detail: students get questions WITHOUT answers; lecturers get everything.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { id } = await params;

    const found = await db.select().from(tests).where(eq(tests.id, id));
    const test = found[0];
    if (!test) return NextResponse.json({ error: "missing" }, { status: 404 });
    const course = (await db.select().from(courses).where(eq(courses.id, test.courseId)))[0];
    const questions = await db.select().from(testQuestions).where(eq(testQuestions.testId, id));

    if (user.role === "student") {
      const mine = await db
        .select()
        .from(testAttempts)
        .where(and(eq(testAttempts.testId, id), eq(testAttempts.studentId, user.id)));
      const attempt = mine[0] ?? null;
      const safeAttempt =
        attempt && attempt.status === "published"
          ? attempt
          : attempt
            ? { ...attempt, score: null }
            : null;
      return NextResponse.json({
        test,
        course,
        // Strip correct answers for students.
        questions: questions.map((q) => ({
          id: q.id,
          kind: q.kind,
          prompt: q.prompt,
          options: q.options,
          marks: q.marks,
        })),
        attempt: safeAttempt,
      });
    }

    // Lecturer result database: every taker with name, email, answers,
    // auto-marked MCQ score, status, and timestamps — for documentation.
    const attempts = await db
      .select({ attempt: testAttempts, student: usersTable })
      .from(testAttempts)
      .innerJoin(usersTable, eq(testAttempts.studentId, usersTable.id))
      .where(eq(testAttempts.testId, id));
    return NextResponse.json({
      test,
      course,
      questions,
      attempts: attempts.map(({ attempt: a, student: s }) => ({
        ...a,
        studentName: s.name,
        studentEmail: s.email,
      })),
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
