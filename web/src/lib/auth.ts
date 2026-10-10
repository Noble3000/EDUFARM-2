import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // University-domain allowlist ships in Phase 3 (needs domain decision).
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // Dev: verification links log to console until RESEND_API_KEY is set (Phase 3).
    sendVerificationEmail: async ({ user, url }) => {
      if (!process.env.RESEND_API_KEY) {
        console.log(`[auth] verify ${user.email}: ${url}`);
        return;
      }
      // Phase 3 wires Resend/Postmark delivery here.
      console.log(`[auth] verify ${user.email}: ${url}`);
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "student", required: false },
      status: { type: "string", defaultValue: "active", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

export type Auth = typeof auth;
