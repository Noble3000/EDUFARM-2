import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions, assignments, courses } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Student results: published marks + feedback only. Nothing leaks early.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ results: [] }, { status: 401 });
    if (user.role !== "student") {
      return NextResponse.json({ results: [], error: "student" }, { status: 403 });
    }
    const rows = await db
      .select({ submission: submissions, assignment: assignments, course: courses })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(submissions.studentId, user.id));

    return NextResponse.json({
      results: rows
        .filter((r) => r.submission.status === "published")
        .map((r) => ({
          id: r.submission.id,
          score: r.submission.score,
          feedback: r.submission.feedback,
          publishedAt: r.submission.publishedAt,
          assignment: r.assignment.title,
          course: `${r.course.code} — ${r.course.title}`,
        })),
      pending: rows.filter((r) => r.submission.status !== "published").length,
    });
  } catch {
    return NextResponse.json({ results: [], error: "unavailable" }, { status: 503 });
  }
}
