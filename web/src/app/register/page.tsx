import Link from "next/link";

export default function RegisterChoice() {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
        <Link href="/" className="font-display text-lg font-bold text-edufarm-800">
          ← EduFarm
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Choose your path first — you will see the right form next.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/register/student"
            className="rounded-2xl border border-line p-6 hover:border-edufarm-700 hover:bg-edufarm-050"
          >
            <div className="font-display text-lg font-bold">Student</div>
            <p className="mt-1 text-sm text-ink-600">
              University email, course setup, dashboard, Library, AI help.
            </p>
            <span className="mt-4 inline-block rounded-xl bg-edufarm-800 px-4 py-2 text-sm font-semibold text-white">
              Continue as Student →
            </span>
          </Link>
          <Link
            href="/register/lecturer"
            className="rounded-2xl border border-line p-6 hover:border-edufarm-700 hover:bg-edufarm-050"
          >
            <div className="font-display text-lg font-bold">Lecturer</div>
            <p className="mt-1 text-sm text-ink-600">
              Extra verification before lecturer tools are enabled.
            </p>
            <span className="mt-4 inline-block rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white">
              Continue as Lecturer →
            </span>
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-edufarm-800 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
