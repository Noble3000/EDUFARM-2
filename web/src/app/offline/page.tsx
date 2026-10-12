import Link from "next/link";

export default function Offline() {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_8px_30px_rgba(11,77,46,0.12)]">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-xl text-warning-tx">
          ◌
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">You are offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          EduFarm needs a connection for your courses, Library, and results.
          Anything you opened before is still readable — reconnect to continue.
        </p>
        <Link
          href="/"
          className="mt-6 block h-11 rounded-xl bg-edufarm-800 py-3 text-center text-sm font-bold text-white"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
