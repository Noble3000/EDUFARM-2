// Transactional emails that are not verification codes.
// Lives apart from ./email.ts so the transport chain stays untouched.
import { sendEmail } from "./email";

/** Password reset link (better-auth `sendResetPassword`). */
export async function sendPasswordResetEmail(to: string, url: string) {
  await sendEmail({
    to,
    subject: "Reset your EduFarm password",
    text: `Open this link to choose a new EduFarm password: ${url}\n\nThe link expires in 1 hour. If you did not ask to reset your password, ignore this email — your password stays unchanged.`,
    html: `<div style="font-family:sans-serif;max-width:480px">
      <h2>Reset your EduFarm password</h2>
      <p>Click the button below to choose a new password. The link expires in 1 hour.</p>
      <p><a href="${url}" style="display:inline-block;background:#0e6b3e;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Choose a new password</a></p>
      <p style="color:#666;font-size:13px">If you did not ask to reset your password, ignore this email — your password stays unchanged.</p>
      <p style="color:#666;font-size:12px;word-break:break-all">${url}</p>
    </div>`,
  });
}
