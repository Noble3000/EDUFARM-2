import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments, courses, submissions, user as usersTable } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Detail: assignment + course + (student: own submission sans grade unless
// published | lecturer: submission counts).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { id } = await params;

    const found = await db.select().from(assignments).where(eq(assignments.id, id));
    const assignment = found[0];
    if (!assignment) return NextResponse.json({ error: "missing" }, { status: 404 });
    const course = (
      await db.select().from(courses).where(eq(courses.id, assignment.courseId))
    )[0];

    if (user.role === "student") {
      const mine = await db
        .select()
        .from(submissions)
        .where(
          and(eq(submissions.assignmentId, id), eq(submissions.studentId, user.id)),
        );
      const sub = mine[0] ?? null;
      // Privacy gate: strip score/feedback until published.
      const safe =
        sub && sub.status === "published"
          ? sub
          : sub
            ? { ...sub, score: null, feedback: null }
            : null;
      return NextResponse.json({ assignment, course, submission: safe });
    }

    // Lecturer inbox: every submission with the student's name + email, so
    // received work is immediately attributable and gradable.
    const rows = await db
      .select({ submission: submissions, student: usersTable })
      .from(submissions)
      .innerJoin(usersTable, eq(submissions.studentId, usersTable.id))
      .where(eq(submissions.assignmentId, id));
    return NextResponse.json({
      assignment,
      course,
      submissions: rows.map(({ submission: s, student: u }) => ({
        ...s,
        studentName: u.name,
        studentEmail: u.email,
      })),
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
