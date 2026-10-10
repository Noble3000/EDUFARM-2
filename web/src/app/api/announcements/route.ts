import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

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
