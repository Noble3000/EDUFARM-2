import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, enrollments } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// DELETE /api/courses/:id — remove a manually added course.
// Students: removes their enrollment; the course row itself is deleted too
// when nobody else is enrolled and they created it (typical manual-entry case).
// Lecturers: delete a course they created. Admins: delete any course.
// Related materials/announcements/sessions/assessments cascade with the row.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "missing" }, { status: 400 });

    const course = (await db.select().from(courses).where(eq(courses.id, id)))[0];
    if (!course) return NextResponse.json({ error: "not found" }, { status: 404 });

    const isStaff = user.role === "lecturer" || user.role === "admin";

    if (!isStaff) {
      const mine = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.studentId, user.id), eq(enrollments.courseId, id)));
      if (mine.length === 0) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }
      await db
        .delete(enrollments)
        .where(and(eq(enrollments.studentId, user.id), eq(enrollments.courseId, id)));

      // Clean up the course row when it was this student's own manual entry
      // and nobody else is enrolled in it.
      let courseDeleted = false;
      const remaining = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(eq(enrollments.courseId, id));
      if (remaining.length === 0 && course.createdBy === user.id) {
        await db.delete(courses).where(eq(courses.id, id));
        courseDeleted = true;
      }
      return NextResponse.json({ removed: true, courseDeleted });
    }

    // Staff path: only the creator (or an admin) may delete a course.
    if (user.role !== "admin" && course.createdBy !== user.id) {
      return NextResponse.json({ error: "Only the lecturer who created this course (or an admin) can delete it." }, { status: 403 });
    }
    await db.delete(courses).where(eq(courses.id, id));
    return NextResponse.json({ removed: true, courseDeleted: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
