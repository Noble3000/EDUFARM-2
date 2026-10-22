import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tests, testQuestions, courses, testAttempts } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ tests: [] }, { status: 401 });

    // Simple system: every test is visible to every student.
    // Courses stay attached for documentation only.
    const rows = await db
      .select({ test: tests, course: courses })
      .from(tests)
      .innerJoin(courses, eq(tests.courseId, courses.id))
      .orderBy(desc(tests.createdAt));

    if (user.role === "lecturer" || user.role === "admin") {
      return NextResponse.json({ tests: rows });
    }

    const mine = await db.select().from(testAttempts).where(eq(testAttempts.studentId, user.id));
    const byTest = new Map(mine.map((a) => [a.testId, a.status]));

    return NextResponse.json({
      tests: rows.map((r) => ({ ...r, myStatus: byTest.get(r.test.id) ?? "not-started" })),
    });
  } catch (e) {
    console.error("[tests GET] failed:", e);
    return NextResponse.json({ tests: [], error: "unavailable" }, { status: 503 });
  }
}

type IncomingQ = {
  kind: "mcq" | "short";
  prompt: string;
  options?: string[];
  answerIndex?: number;
  answerText?: string;
  marks?: number;
};

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { courseId, title, instructions, durationMin, dueAt, questions } = (await req.json()) ?? {};
    const qs: IncomingQ[] = questions ?? [];
    if (!courseId || !title?.trim()) {
      return NextResponse.json({ error: "Course and title are required." }, { status: 400 });
    }
    if (!Array.isArray(qs) || qs.length === 0) {
      return NextResponse.json({ error: "Add at least one question." }, { status: 400 });
    }
    for (const [i, q] of qs.entries()) {
      if (!q.prompt?.trim()) return NextResponse.json({ error: `Question ${i + 1} needs a prompt.` }, { status: 400 });
      if (q.kind === "mcq") {
        const opts = (q.options ?? []).map((o) => (o ?? "").trim());
        if (opts.filter(Boolean).length < 2) {
          return NextResponse.json({ error: `MCQ ${i + 1} needs at least 2 options.` }, { status: 400 });
        }
        const idx = q.answerIndex ?? 0;
        if (!Number.isInteger(idx) || idx < 0 || idx >= q.options!.length) {
          return NextResponse.json({ error: `MCQ ${i + 1} has an invalid correct answer.` }, { status: 400 });
        }
      }
    }

    // Validate optional fields before touching the DB so bad input is a 400,
    // never a masked 503 "unavailable".
    let duration: number | null = null;
    if (durationMin !== undefined && durationMin !== null && String(durationMin).trim() !== "") {
      duration = Number(durationMin);
      if (!Number.isFinite(duration) || duration <= 0) {
        return NextResponse.json({ error: "Minutes must be a positive number (or left empty)." }, { status: 400 });
      }
      duration = Math.floor(duration);
    }
    let due: Date | null = null;
    if (dueAt !== undefined && dueAt !== null && String(dueAt).trim() !== "") {
      due = new Date(dueAt);
      if (Number.isNaN(due.getTime())) {
        return NextResponse.json({ error: "Due date is not a valid date." }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();
    // Reject unknown course IDs with a clear message instead of a bare FK error.
    const course = (await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)))[0];
    if (!course) {
      return NextResponse.json({ error: "That course was not found. Pick it from the list — don't type the ID by hand." }, { status: 400 });
    }
    await db.insert(tests).values({
      id,
      courseId,
      authorId: user.id,
      title: title.trim(),
      instructions: instructions?.trim() || null,
      durationMin: duration,
      dueAt: due,
    });
    await db.insert(testQuestions).values(
      qs.map((q, i) => ({
        id: crypto.randomUUID(),
        testId: id,
        kind: q.kind === "short" ? "short" : "mcq",
        prompt: q.prompt.trim(),
        options: q.kind === "short" ? [] : q.options!.map((o) => (o ?? "").trim()),
        answerIndex: q.kind === "mcq" ? (q.answerIndex ?? 0) : null,
        answerText: q.kind === "short" ? q.answerText?.trim() || null : null,
        marks: q.marks && q.marks > 0 ? Math.floor(q.marks) : 1,
        position: i,
      })),
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    console.error("[tests POST] failed:", e);
    return NextResponse.json(
      { error: "Could not save the test — database not reachable. Try again in a moment." },
      { status: 503 },
    );
  }
}
