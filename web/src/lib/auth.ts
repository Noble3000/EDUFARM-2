import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import { sendVerificationCodeEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // University-domain allowlist ships in Phase 3 (needs domain decision).
    sendResetPassword: async ({ user, url }) => {
      // Dev fallback: log the link. Set RESEND_API_KEY + wire delivery for prod.
      console.log(`[auth] reset ${user.email}: ${url}`);
    },
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
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        // Dev: code is visible in the server terminal so signup works
        // without an email provider. Prod: delivered by Resend.
        if (!process.env.RESEND_API_KEY) {
          console.log(`[auth] OTP for ${email} (${type}): ${otp}`);
        }
        if (type === "email-verification") {
          await sendVerificationCodeEmail(email, otp);
        } else {
          console.log(`[auth] OTP for ${email} (${type}): ${otp}`);
        }
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

export type Auth = typeof auth;
