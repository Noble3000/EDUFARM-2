import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

const FEATURES = [
  {
    icon: "✓",
    title: "Lecturer-confirmed Library",
    body: "Notes, past questions, and guides labelled only when a lecturer confirms and publishes them.",
  },
  {
    icon: "◉",
    title: "Deadlines & Announcements First",
    body: "Your dashboard opens on what needs action: assignments, tests, announcements, and live sessions.",
  },
  {
    icon: "✎",
    title: "Assignments, Tests & Feedback",
    body: "Submit files or written answers. Marks and feedback stay private until your lecturer publishes them.",
  },
  {
    icon: "✦",
    title: "AI Study Help",
    body: "Explanations, summaries, and practice questions — always labelled course-material or general knowledge.",
  },
];

const STEPS = [
  ["1", "Create your account", "Choose Student or Lecturer, verify your email."],
  ["2", "Add your courses", "Enter manually or upload your registration document and review what we extract."],
  ["3", "Learn with trust", "Follow deadlines, join live sessions, use confirmed materials and AI help."],
];

export default function Home() {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-6">
        <SiteHeader />

        {/* Hero */}
        <section className="banner-a mt-4 rounded-2xl p-8 text-white sm:p-10">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">
            Trusted academic ecosystem
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
            Reliable course materials, deadlines, and lecturer guidance — in one
            place.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-90 sm:text-base">
            EduFarm connects students and lecturers through course activity,
            lecturer-confirmed learning materials, assessments, live-session
            information, announcements and Q&amp;A, and AI learning support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-edufarm-800"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/10"
            >
              Log In
            </Link>
          </div>
        </section>

        {/* Key academic features */}
        <section className="mt-8" aria-label="Key features">
          <h2 className="font-display text-xl font-bold">Why EduFarm</h2>
          <p className="mt-1 text-sm text-ink-600">
            Every feature makes an academic task easier, improves trust, or
            supports the community.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-edufarm-050 text-base text-edufarm-800">
                  {f.icon}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-8" aria-label="How it works">
          <h2 className="font-display text-xl font-bold">How it works</h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {STEPS.map(([n, title, body]) => (
              <li
                key={n}
                className="rounded-2xl border border-line bg-appwash p-5"
              >
                <span className="tabular inline-flex h-8 w-8 items-center justify-center rounded-full bg-edufarm-800 text-sm font-bold text-white">
                  {n}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Platform highlights */}
        <section
          className="mt-8 rounded-2xl border border-line p-6"
          aria-label="Platform highlights"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">
              Built for course life
            </h2>
            <Link
              href="/register"
              className="text-sm font-semibold text-edufarm-800 hover:underline"
            >
              Get started →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-edufarm-050 p-4">
              <div className="font-display font-semibold">Course pages</div>
              <p className="mt-1 text-ink-600">
                Materials, announcements, sessions, Q&amp;A, and assessments
                together per course.
              </p>
            </div>
            <div className="rounded-xl bg-edufarm-050 p-4">
              <div className="font-display font-semibold">Live sessions</div>
              <p className="mt-1 text-ink-600">
                Central list + in-course details. One tap to join the external
                call.
              </p>
            </div>
            <div className="rounded-xl bg-edufarm-050 p-4">
              <div className="font-display font-semibold">Results you own</div>
              <p className="mt-1 text-ink-600">
                Only your grades, only after publication. Nothing leaks early.
              </p>
            </div>
          </div>
        </section>

        {/* Devotional — prominent but secondary */}
        <section className="mt-8" aria-label="Word of God devotional">
          <div className="rounded-xl border-l-4 border-gold-500 bg-gold-bg p-6">
            <div className="text-xs font-bold tracking-widest text-gold-tx uppercase">
              Word of God · Devotional
            </div>
            <blockquote className="mt-3 max-w-2xl">
              <p className="text-lg leading-relaxed font-medium">
                “I am the light of the world. Whoever follows me will never
                walk in darkness, but will have the light of life.”
              </p>
              <cite className="mt-2 block text-sm text-gold-tx not-italic">
                John 8:12 · Refreshed daily by our administrators
              </cite>
            </blockquote>
          </div>
        </section>

        {/* Final CTA */}
        <section className="banner-a mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl p-8 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold">
              Find your next academic task in minutes.
            </h2>
            <p className="mt-1 text-sm opacity-90">
              Register, add your courses, and see deadlines, materials, and
              announcements without extra steps.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-bold text-edufarm-800"
          >
            Create free account
          </Link>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
