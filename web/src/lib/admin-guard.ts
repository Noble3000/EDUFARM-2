import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "login" }, { status: 401 }) };
  if (user.role !== "admin") {
    return { error: NextResponse.json({ error: "admin" }, { status: 403 }) };
  }
  return { user };
}
