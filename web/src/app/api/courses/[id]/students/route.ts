import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, enrollments, user, studentProfiles } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Roster for "manage relevant courses and students" (PRD §3 Lecturers).
// Staff who own/created the course, plus admins. Students never see this.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ students: [] }, { status: 401 });
    const { id } = await params;

    const found = await db.select().from(courses).where(eq(courses.id, id));
    const course = found[0];
    if (!course) return NextResponse.json({ error: "missing" }, { status: 404 });

    const allowed =
      me.role === "admin" ||
      ((me.role === "lecturer") &&
        (course.ownerLecturerId === me.id || course.createdBy === me.id));
    if (!allowed) return NextResponse.json({ students: [] }, { status: 403 });

    const rows = await db.select().from(enrollments).where(eq(enrollments.courseId, id));
    const students = await Promise.all(
      rows.map(async (e) => {
        const u = (await db.select().from(user).where(eq(user.id, e.studentId)))[0];
        const p = (
          await db.select().from(studentProfiles).where(eq(studentProfiles.userId, e.studentId))
        )[0];
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.status,
          matricNo: p?.matricNo ?? null,
          department: p?.department ?? null,
          level: p?.level ?? null,
          enrolledAt: e.createdAt,
        };
      }),
    );
    return NextResponse.json({ students: students.filter(Boolean) });
  } catch {
    return NextResponse.json({ students: [], error: "unavailable" }, { status: 503 });
  }
}
