import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { announcements, courses, user } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Seamless broadcast feed (WhatsApp-style): every announcement is visible to
// every student with the lecturer's name attached — no course-hunting.
// Courses stay attached for documentation only. Students are view-only here;
// discussion and replies live in the feedback (Q&A) session, never here.
export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ announcements: [] }, { status: 401 });

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
