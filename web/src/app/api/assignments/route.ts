import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments, courses, submissions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ assignments: [] }, { status: 401 });

    // Simple system: every assignment is visible to every student.
    // Courses stay attached for documentation only.
    const rows = await db
      .select({ assignment: assignments, course: courses })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .orderBy(desc(assignments.createdAt));

    if (user.role === "lecturer" || user.role === "admin") {
      return NextResponse.json({ assignments: rows });
    }

    const mine = await db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, user.id));
    const byAssignment = new Map(mine.map((s) => [s.assignmentId, s]));

    return NextResponse.json({
      assignments: rows.map((r) => ({
        ...r,
        // Students never see score/feedback here — only status (privacy gate).
        myStatus: byAssignment.get(r.assignment.id)?.status ?? "not-started",
      })),
    });
  } catch {
    return NextResponse.json({ assignments: [], error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const body = (await req.json()) ?? {};
    const { courseId, title, instructions, dueAt, allowFile, allowText } = body;
    if (!courseId || !title?.trim() || !instructions?.trim()) {
      return NextResponse.json(
        { error: "Course, title, and instructions are required." },
        { status: 400 },
      );
    }
    const id = crypto.randomUUID();
    // Reject unknown course IDs with a clear message instead of a bare FK error.
    const course = (await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)))[0];
    if (!course) {
      return NextResponse.json({ error: "That course was not found. Pick it from the list — don't type the ID by hand." }, { status: 400 });
    }
    await db.insert(assignments).values({
      id,
      courseId,
      authorId: user.id,
      title: title.trim(),
      instructions: instructions.trim(),
      dueAt: dueAt ? new Date(dueAt) : null,
      allowFile: allowFile ?? true,
      allowText: allowText ?? true,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
