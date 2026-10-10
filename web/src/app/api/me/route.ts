import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    // DB not yet migrated / unreachable — client shows a friendly retry state.
    return NextResponse.json(
      { user: null, error: "unavailable" },
      { status: 503 },
    );
  }
}
