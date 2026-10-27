import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import { sendVerificationCodeEmail } from "./email";
import { sendPasswordResetEmail } from "./email-templates";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  // Live deploys must list their public URL here or every login/signup is
  // rejected with "Invalid origin". Localhost works without it.
  // BETTER_AUTH_URL on the host must exactly match the live site URL.
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "https://edufarm-2.vercel.app",
    "https://edufarm-app.netlify.app",
    "http://localhost:3000",
  ].filter((v): v is string => !!v),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // University-domain allowlist ships in Phase 3 (needs domain decision).
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    // IMPORTANT: do NOT define sendVerificationEmail here.
    //
    // The emailOTP plugin (overrideDefaultEmailVerification) installs its own
    // handler that generates the 6-digit code, stores it, and sends it inside
    // the sign-up request. better-auth merges plugin options with `defu`,
    // where the app's own config wins — so a handler defined here silently
    // replaced the plugin's sender. Sign-up then created the account but sent
    // no code, which is why users had to tap "Resend" before any mail arrived.
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
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
      // Allow signed-in users to change their email after proving ownership
      // of the new address with a 6-digit code.
      changeEmail: { enabled: true },
      async sendVerificationOTP({ email, otp, type }) {
        // Dev: the code also lands in the server terminal so signup works
        // without an email provider. Prod: delivered by the email chain.
        if (!process.env.RESEND_API_KEY) {
          console.log(`[auth] OTP for ${email} (${type}): ${otp}`);
        }
        // Every OTP type is delivered — including password reset codes.
        await sendVerificationCodeEmail(email, otp);
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

export type Auth = typeof auth;
