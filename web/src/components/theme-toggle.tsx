"use client";

/**
 * Light/dark switch. Flips `.dark` on <html> and remembers the choice.
 *
 * Visually driven by CSS (`dark:hidden` / `hidden dark:inline`) rather than
 * React state, so there is no hydration mismatch and no flicker on first paint
 * — the pre-paint script in app/layout.tsx has already applied the saved theme.
 */
export function ThemeToggle({
  className = "",
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("edufarm-theme", next ? "dark" : "light");
    } catch {
      // Private mode — the toggle still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Switch between light and dark mode"
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {/* Moon: shown in light mode (tap for dark) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0 dark:hidden"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      {/* Sun: shown in dark mode (tap for light) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden h-4 w-4 shrink-0 dark:inline"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
      </svg>
      {showLabel && (
        <>
          <span className="dark:hidden">Dark</span>
          <span className="hidden dark:inline">Light</span>
        </>
      )}
    </button>
  );
}
