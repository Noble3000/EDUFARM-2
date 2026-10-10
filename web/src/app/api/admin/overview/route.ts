import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user,
  lecturerVerifications,
  reports,
  materials,
  submissions,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const users = await db.select({ role: user.role }).from(user);
    const students = users.filter((u) => u.role === "student").length;
    const lecturers = users.filter((u) => u.role === "lecturer").length;
    const pendingLect = users.filter((u) => u.role === "lecturer_pending").length;

    const [openReports, pendingVerif, matCount, subCount] = await Promise.all([
      db.select({ id: reports.id }).from(reports).where(eq(reports.status, "open")),
      db.select({ id: lecturerVerifications.id }).from(lecturerVerifications).where(eq(lecturerVerifications.status, "pending")),
      db.select({ n: sql<number>`count(*)` }).from(materials),
      db.select({ n: sql<number>`count(*)` }).from(submissions),
    ]);

    return NextResponse.json({
      totalUsers: users.length,
      students,
      lecturers,
      pendingLecturers: pendingLect,
      openReports: openReports.length,
      pendingVerifications: pendingVerif.length,
      materials: Number(matCount[0]?.n ?? 0),
      submissions: Number(subCount[0]?.n ?? 0),
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
