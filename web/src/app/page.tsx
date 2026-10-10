export default function Home() {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-6">
        {/* Green header bar */}
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <span className="font-display text-lg font-bold">
            EduFarm
          </span>
          <nav className="hidden items-center gap-2 md:flex">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
              Dashboard
            </span>
            <span className="px-3 text-sm font-medium text-emerald-100/80">
              Courses
            </span>
            <span className="px-3 text-sm font-medium text-emerald-100/80">
              Assignments
            </span>
            <span className="px-3 text-sm font-medium text-emerald-100/80">
              Help Center
            </span>
          </nav>
          <div className="ml-auto flex gap-2">
            <span className="rounded-xl bg-ink-900 px-3 py-1.5 text-[13px] font-semibold text-white">
              New Assignment
            </span>
            <span className="rounded-xl bg-edufarm-800 px-3 py-1.5 text-[13px] font-semibold text-white">
              Upload Resource
            </span>
          </div>
        </header>

        {/* Welcome banner — Option A Deep, 2 stops */}
        <section className="banner-a mt-4 flex items-center justify-between gap-4 rounded-2xl p-6 text-white">
          <div>
            <h1 className="font-display text-2xl font-bold">
              Trusted academic ecosystem
            </h1>
            <p className="mt-1 text-[13px] opacity-90">
              Lecturer-confirmed materials, deadlines, live sessions, Q&amp;A,
              and AI support — in one place.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-edufarm-800">
            Create Account
          </span>
        </section>

        {/* Stat cards */}
        <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Enrolled Courses", "8", "+2 this semester"],
            ["Study Hours", "42h", "+5.2% this week"],
            ["Avg. Grade", "87%", "published only"],
            ["Pending Tasks", "3", "2 assignments · 1 test"],
          ].map(([label, value, sub]) => (
            <div
              key={label}
              className="rounded-2xl border border-line bg-white p-4"
            >
              <div className="text-xs font-medium text-ink-600">{label}</div>
              <div className="tabular mt-1 font-display text-2xl font-bold">
                {value}
              </div>
              <div className="mt-0.5 text-xs text-ink-600">{sub}</div>
            </div>
          ))}
        </section>

        {/* Status pills + devotional */}
        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Timetable</h2>
            <p className="text-[13px] text-ink-600">
              Anatomy 102 · now in Theater A10
            </p>
            <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-edufarm-100 text-[13px] font-bold text-edufarm-800">
                A
              </span>
              <div>
                <div className="text-sm font-semibold">Anatomy 102 – C</div>
                <div className="text-xs text-ink-600">
                  Theater A10 · Dr. Smith
                </div>
              </div>
              <span className="tabular ml-auto rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-tx">
                10:00–12:30
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-tx">
                Confirmed
              </span>
              <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning-tx">
                Pending
              </span>
              <span className="rounded-full bg-danger-bg px-2.5 py-1 text-xs font-semibold text-danger-tx">
                Tomorrow
              </span>
              <span className="rounded-full bg-gold-bg px-2.5 py-1 text-xs font-semibold text-gold-tx">
                Devotional
              </span>
            </div>
          </div>
          <div className="rounded-xl border-l-4 border-gold-500 bg-gold-bg p-5">
            <div className="text-xs font-bold tracking-wide text-gold-tx uppercase">
              Word of God · John 8:12
            </div>
            <p className="mt-2 text-[15px] leading-relaxed">
              “I am the light of the world. Whoever follows me will never walk
              in darkness, but will have the light of life.”
            </p>
          </div>
        </section>

        <p className="mt-4 text-[13px] text-ink-600">
          Design shell live — tokens from{" "}
          <span className="font-semibold">docs/DESIGN_SYSTEM.md</span>. Full
          landing (hero, features, How It Works, devotional section, footer)
          ships in Phase 3.
        </p>
      </div>
    </div>
  );
}
