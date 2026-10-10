import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Current signed-in user (or null). Runtime only — never call during prerender. */
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return session.user as {
    id: string;
    name: string;
    email: string;
    role?: string;
    status?: string;
  };
}

export function isLecturerApproved(role?: string) {
  return role === "lecturer" || role === "admin";
}
