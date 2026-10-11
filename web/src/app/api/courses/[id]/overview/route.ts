import { NextResponse } from "next/server";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  courses,
  materials,
  announcements,
  liveSessions,
  assignments,
  tests,
  user as usersTable,
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

    const [mats, anns, sess, assigns, tst] = await Promise.all([
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
      db.select().from(tests).where(eq(tests.courseId, id)),
    ]);
    // Host names so students see WHO hosts each session (PRD: hosted by lecturers).
    const hostIds = [...new Set(sess.map((s) => s.hostId))];
    const hosts = hostIds.length
      ? await db
          .select({ id: usersTable.id, name: usersTable.name })
          .from(usersTable)
          .where(inArray(usersTable.id, hostIds))
      : [];
    const hostName = new Map(hosts.map((h) => [h.id, h.name]));
    return NextResponse.json({
      course,
      materials: mats,
      announcements: anns,
      sessions: sess.map((s) => ({ ...s, hostName: hostName.get(s.hostId) ?? null })),
      assessments: assigns,
      tests: tst,
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
