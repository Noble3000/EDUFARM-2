import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  courses,
  materials,
  announcements,
  liveSessions,
  assignments,
} from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { id } = await params;
    const found = await db.select().from(courses).where(eq(courses.id, id));
    const course = found[0];
    if (!course) return NextResponse.json({ error: "missing" }, { status: 404 });

    const [mats, anns, sess, assigns] = await Promise.all([
      db
        .select()
        .from(materials)
        .where(
          user.role === "student"
            ? and(eq(materials.courseId, id), eq(materials.status, "published"))
            : eq(materials.courseId, id),
        ),
      db
        .select()
        .from(announcements)
        .where(eq(announcements.courseId, id))
        .orderBy(desc(announcements.publishedAt)),
      db.select().from(liveSessions).where(eq(liveSessions.courseId, id)),
      db.select().from(assignments).where(eq(assignments.courseId, id)),
    ]);
    return NextResponse.json({
      course,
      materials: mats,
      announcements: anns,
      sessions: sess,
      assessments: assigns,
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
