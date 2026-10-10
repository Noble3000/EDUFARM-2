import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, enrollments } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ courses: [] }, { status: 401 });
    if (user.role === "lecturer" || user.role === "admin") {
      const all = await db.select().from(courses);
      return NextResponse.json({ courses: all });
    }
    const rows = await db
      .select({ course: courses })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, user.id));
    return NextResponse.json({ courses: rows.map((r) => r.course) });
  } catch {
    return NextResponse.json({ courses: [], error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const body = await req.json();
    const { code, title, lecturerName, unitLoad, session } = body ?? {};
    if (!code?.trim() || !title?.trim()) {
      return NextResponse.json(
        { error: "Course code and title are required." },
        { status: 400 },
      );
    }
    const id = crypto.randomUUID();
    await db.insert(courses).values({
      id,
      code: code.trim(),
      title: title.trim(),
      lecturerName: lecturerName?.trim() || null,
      unitLoad: Number.isFinite(Number(unitLoad)) ? Number(unitLoad) : null,
      session: session?.trim() || null,
      createdBy: user.id,
      // PRD: manually entered details are NOT automatically officially verified.
      isOfficialVerified: false,
    });
    if (user.role === "student") {
      await db.insert(enrollments).values({
        id: crypto.randomUUID(),
        studentId: user.id,
        courseId: id,
        source: "manual",
      });
    }
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
