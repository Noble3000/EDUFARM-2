import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
      <Link href="/" className="font-display text-lg font-bold">
        EduFarm
      </Link>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
        <Link
          href="/"
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800"
        >
          Home
        </Link>
        <Link
          href="/library"
          className="px-3 py-1.5 text-sm font-medium text-emerald-100/80 hover:text-white"
        >
          Library
        </Link>
        <Link
          href="/sessions"
          className="px-3 py-1.5 text-sm font-medium text-emerald-100/80 hover:text-white"
        >
          Live Sessions
        </Link>
        <Link
          href="/ai"
          className="px-3 py-1.5 text-sm font-medium text-emerald-100/80 hover:text-white"
        >
          AI Help
        </Link>
      </nav>
      <div className="ml-auto flex gap-2">
        <Link
          href="/login"
          className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white ring-1 ring-white/30 hover:bg-white/10"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-edufarm-800 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-edufarm-700"
        >
          Create Account
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-8 rounded-2xl bg-edufarm-900 px-6 py-8 text-emerald-50">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <div className="font-display text-lg font-bold text-white">
            EduFarm
          </div>
          <p className="mt-2 text-[13px] leading-relaxed opacity-80">
            A trusted academic ecosystem for students and lecturers.
            Lecturer-confirmed materials, course activity, assessments, and AI
            support.
          </p>
        </div>
        <div>
          <div className="text-xs font-bold tracking-wide uppercase opacity-70">
            Academic
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li><Link href="/library" className="hover:text-white">Library</Link></li>
            <li><Link href="/sessions" className="hover:text-white">Live Sessions</Link></li>
            <li><Link href="/ai" className="hover:text-white">AI Help</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold tracking-wide uppercase opacity-70">
            Account
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li><Link href="/register" className="hover:text-white">Create Account</Link></li>
            <li><Link href="/login" className="hover:text-white">Log In</Link></li>
            <li><Link href="/register/lecturer" className="hover:text-white">Lecturer Verification</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-6 border-t border-white/15 pt-4 text-xs opacity-70">
        © EduFarm · One university first · Simple, seamless, and useful.
      </div>
    </footer>
  );
}
