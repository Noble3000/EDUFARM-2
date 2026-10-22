import Link from "next/link";

export const metadata = {
  title: "Download EduFarm for Android",
  description: "Get the EduFarm Android app (APK) or install the web app on your device.",
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl bg-edufarm-900 px-3 py-2 text-white sm:gap-4 sm:px-4">
          <Link href="/" className="font-display text-lg font-bold">
            EduFarm
          </Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Android App
          </span>
        </header>

        <h1 className="mt-6 font-display text-2xl font-bold">
          Download EduFarm for Android
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Version 1.0.0 · ~1 MB · Android 7.0 and above · Free
        </p>

        <a
          href="/downloads/edufarm-v1.0.0.apk"
          download
          className="mt-6 block rounded-2xl bg-edufarm-800 p-5 text-center text-white hover:opacity-90"
        >
          <span className="text-base font-bold">⬇ Download EduFarm APK</span>
          <span className="mt-1 block text-[13px] opacity-90">
            edufarm-v1.0.0.apk — tap to download on your phone
          </span>
        </a>

        <section className="mt-6 rounded-2xl border border-line p-5">
          <h2 className="font-display text-lg font-semibold">
            How to install (2 minutes)
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              Open this page on your Android phone and tap{" "}
              <strong>Download EduFarm APK</strong> above.
            </li>
            <li>
              Open the downloaded file (from your notifications or the
              Downloads folder).
            </li>
            <li>
              If Android asks, allow{" "}
              <strong>“Install unknown apps”</strong> for your browser, then
              tap <strong>Install</strong>.
            </li>
            <li>
              Open <strong>EduFarm</strong> from your app drawer and sign in —
              it opens the live app full-screen.
            </li>
          </ol>
        </section>

        <section className="mt-4 rounded-2xl bg-appwash p-5">
          <h2 className="font-display text-base font-semibold">
            No download? Install instantly instead
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            Open{" "}
            <a
              href="https://edufarm-app.netlify.app"
              className="font-semibold text-edufarm-800 underline"
            >
              edufarm-app.netlify.app
            </a>{" "}
            in Chrome on your phone → tap the <strong>⋮</strong> menu →{" "}
            <strong>Add to Home screen</strong> → <strong>Install</strong>.
            Same app, no file needed.
          </p>
        </section>
      </div>
    </div>
  );
}
