import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ profile: null }, { status: 401 });
    const rows = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));
    return NextResponse.json({ profile: rows[0] ?? null });
  } catch {
    return NextResponse.json({ profile: null, error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "student" }, { status: 403 });
    }
    const { matricNo, department, level } = (await req.json()) ?? {};
    const existing = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));
    const values = {
      matricNo: matricNo?.trim() || null,
      department: department?.trim() || null,
      level: level?.trim() || null,
    };
    if (existing[0]) {
      await db.update(studentProfiles).set(values).where(eq(studentProfiles.userId, user.id));
    } else {
      await db.insert(studentProfiles).values({ userId: user.id, ...values });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
