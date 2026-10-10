import { NextResponse } from "next/server";
import { eq, and, lte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { devotionals } from "@/lib/db/schema";

// Public: only admin-published content configured for landing display.
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(devotionals)
      .where(
        and(
          eq(devotionals.status, "published"),
          eq(devotionals.showOnLanding, true),
          lte(devotionals.publishAt, new Date()),
        ),
      )
      .orderBy(desc(devotionals.publishAt));
    const current = rows[0] ?? null;
    return NextResponse.json({ devotional: current });
  } catch {
    return NextResponse.json({ devotional: null });
  }
}
