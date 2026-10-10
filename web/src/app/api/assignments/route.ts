import { NextResponse } from "next/server";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments, courses, enrollments, submissions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ assignments: [] }, { status: 401 });

    if (user.role === "lecturer" || user.role === "admin") {
      const rows = await db
        .select({ assignment: assignments, course: courses })
        .from(assignments)
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .orderBy(desc(assignments.createdAt));
      return NextResponse.json({ assignments: rows });
    }

    const en = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.studentId, user.id));
    const ids = en.map((e) => e.courseId);
    if (ids.length === 0) return NextResponse.json({ assignments: [] });

    const rows = await db
      .select({ assignment: assignments, course: courses })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(inArray(assignments.courseId, ids))
      .orderBy(desc(assignments.createdAt));

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
