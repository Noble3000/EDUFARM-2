import { NextResponse } from "next/server";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { announcements, courses, enrollments, user } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Seamless feed: latest announcements with lecturer name + course attached —
// no course-hunting needed. Students get their enrolled courses; lecturers
// get what they posted; admins get the latest across the platform.
export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ announcements: [] }, { status: 401 });

    let scope: string[] | null = null; // null = all courses
    if (me.role === "student") {
      const mine = await db
        .select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(eq(enrollments.studentId, me.id));
      scope = mine.map((r) => r.courseId);
      if (scope.length === 0) return NextResponse.json({ announcements: [] });
    }

    const rows = await db
      .select({
        id: announcements.id,
        body: announcements.body,
        publishedAt: announcements.publishedAt,
        authorId: announcements.authorId,
        lecturerName: user.name,
        courseCode: courses.code,
        courseTitle: courses.title,
        courseId: courses.id,
      })
      .from(announcements)
      .innerJoin(courses, eq(announcements.courseId, courses.id))
      .innerJoin(user, eq(announcements.authorId, user.id))
      .where(scope ? inArray(announcements.courseId, scope) : undefined)
      .orderBy(desc(announcements.publishedAt))
      .limit(20);

    if (me.role === "lecturer") {
      // Lecturers see their own posts in the feed.
      return NextResponse.json({ announcements: rows.filter((r) => r.authorId === me.id) });
    }
    return NextResponse.json({ announcements: rows });
  } catch {
    return NextResponse.json({ announcements: [], error: "unavailable" }, { status: 503 });
  }
}

// Lecturer-controlled announcements (kept separate from Q&A by design).
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { courseId, body } = (await req.json()) ?? {};
    if (!courseId || !body?.trim()) {
      return NextResponse.json({ error: "Course and message are required." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await db.insert(announcements).values({ id, courseId, authorId: user.id, body: body.trim() });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
