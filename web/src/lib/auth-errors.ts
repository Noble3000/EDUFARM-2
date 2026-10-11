// Friendly mapping for sign-up failures.
// better-auth returns code USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL (HTTP 422)
// when the address is taken. Emails live in ONE shared "user" table with a
// UNIQUE constraint (see schema.ts), so no address can ever register twice —
// not as student + lecturer, not as two students. This helper turns that
// technical error into a plain instruction.

type SignupError = {
  message?: string | null;
  code?: string | null;
  status?: number;
} | null;

export function signupErrorMessage(error: SignupError): {
  message: string;
  emailInUse: boolean;
} {
  const code = (error?.code ?? "").toUpperCase();
  const msg = (error?.message ?? "").toLowerCase();
  const emailInUse =
    code.includes("ALREADY_EXISTS") ||
    msg.includes("already exists") ||
    msg.includes("use another email");
  if (emailInUse) {
    return {
      message:
        "This email is already registered. Enter another email — one email can only belong to one account (student or lecturer).",
      emailInUse: true,
    };
  }
  return {
    message: error?.message || "Could not create your account. Try again.",
    emailInUse: false,
  };
}
