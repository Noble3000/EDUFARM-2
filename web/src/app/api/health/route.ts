import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "edufarm-web",
    // DB/R2 checks stay out of the public probe; Phase 10 adds an authed probe.
    db: process.env.DATABASE_URL ? "configured" : "missing",
    r2: process.env.R2_BUCKET ? "configured" : "missing",
  });
}
