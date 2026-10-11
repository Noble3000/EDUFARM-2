import { NextResponse } from "next/server";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { materials, courses } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ materials: [] }, { status: 401 });
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const courseId = url.searchParams.get("course")?.trim() ?? "";
    const type = url.searchParams.get("type")?.trim() ?? "";
    const sessionName = url.searchParams.get("session")?.trim() ?? "";
    // ?mine=1 — lecturer's own stock: everything they uploaded (drafts +
    // published), so nothing they saved is ever out of reach.
    const mine = url.searchParams.get("mine") === "1";

    const filters = [];
    // Students see published only; lecturers/admins see all (PRD trust rule).
    if (user.role === "student") filters.push(eq(materials.status, "published"));
    if (mine && (user.role === "lecturer" || user.role === "admin")) {
      filters.push(eq(materials.uploaderId, user.id));
    }
    if (courseId) filters.push(eq(materials.courseId, courseId));
    if (type) filters.push(eq(materials.type, type));
    if (sessionName) filters.push(eq(materials.session, sessionName));
    if (q) {
      filters.push(
        or(ilike(materials.title, `%${q}%`), ilike(courses.code, `%${q}%`)),
      );
    }

    const rows = await db
      .select({ material: materials, course: courses })
      .from(materials)
      .innerJoin(courses, eq(materials.courseId, courses.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(materials.createdAt));

    return NextResponse.json({ materials: rows });
  } catch {
    return NextResponse.json({ materials: [], error: "unavailable" }, { status: 503 });
  }
}
