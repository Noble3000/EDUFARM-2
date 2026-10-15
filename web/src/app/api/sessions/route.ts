import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { liveSessions, courses, user as usersTable } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ sessions: [] }, { status: 401 });
    const url = new URL(req.url);
    const courseId = url.searchParams.get("course")?.trim() ?? "";

    // Simple system: every session is visible to every signed-in user.
    // Courses stay attached for documentation only.
    const rows = await db
      .select({ session: liveSessions, course: courses, host: usersTable })
      .from(liveSessions)
      .innerJoin(courses, eq(liveSessions.courseId, courses.id))
      .innerJoin(usersTable, eq(liveSessions.hostId, usersTable.id))
      .orderBy(desc(liveSessions.startsAt));

    const filtered = rows.filter(({ session: s }) => {
      if (courseId && s.courseId !== courseId) return false;
      return true;
    });

    const now = Date.now();
    type Ranked = (typeof filtered)[number] & { state: "live" | "upcoming" | "past" };
    const ranked: Ranked[] = filtered.map((r) => {
      const start = r.session.startsAt.getTime();
      const end = r.session.endsAt ? r.session.endsAt.getTime() : start + 60 * 60 * 1000;
      const state: Ranked["state"] = end < now ? "past" : start > now ? "upcoming" : "live";
      return { ...r, state };
    });
    // Order: live first, then upcoming, then past.
    const order = { live: 0, upcoming: 1, past: 2 } as const;
    ranked.sort((a, b) => order[a.state] - order[b.state]);
    return NextResponse.json({ sessions: ranked });
  } catch {
    return NextResponse.json({ sessions: [], error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const body = await req.json();
    const { courseId, title, meetingUrl, startsAt, endsAt, instructions } = body ?? {};
    if (!courseId || !title?.trim() || !meetingUrl?.trim() || !startsAt) {
      return NextResponse.json(
        { error: "Course, title, meeting link, and start time are required." },
        { status: 400 },
      );
    }
    try {
      const u = new URL(meetingUrl.trim());
      if (u.protocol !== "https:") throw new Error("https");
    } catch {
      return NextResponse.json(
        { error: "Meeting link must be a valid https URL." },
        { status: 400 },
      );
    }
    const id = crypto.randomUUID();
    // Reject unknown course IDs with a clear message instead of a bare FK error.
    const course = (await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)))[0];
    if (!course) {
      return NextResponse.json({ error: "That course was not found. Pick it from the list — don't type the ID by hand." }, { status: 400 });
    }
    await db.insert(liveSessions).values({
      id,
      courseId,
      hostId: user.id,
      title: title.trim(),
      meetingUrl: meetingUrl.trim(),
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      instructions: instructions?.trim() || null,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
