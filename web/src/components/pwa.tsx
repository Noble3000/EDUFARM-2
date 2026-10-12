"use client";

import { useCallback, useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Shared install-prompt state: native prompt where supported, iOS guidance otherwise. */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window === "undefined" ? false : isStandalone(),
  );
  const [ios] = useState(() =>
    typeof navigator === "undefined"
      ? false
      : /iphone|ipad|ipod/i.test(navigator.userAgent),
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setDeferred(null);
    return outcome;
  }, [deferred]);

  return { canInstall: deferred !== null, installed, ios, install };
}

/** Visible install button. Renders nothing when installed or not installable
    (except iOS, which gets Add-to-Home-Screen guidance instead of a prompt). */
export function InstallButton({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { canInstall, installed, ios, install } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  if (installed) return null;

  const size = compact ? "px-3 py-1.5 text-[13px]" : "px-6 py-3 text-sm";

  if (canInstall) {
    return (
      <button
        onClick={async () => {
          setBusy(true);
          await install();
          setBusy(false);
        }}
        disabled={busy}
        className={`rounded-xl font-bold disabled:opacity-50 ${size} ${
          dark ? "bg-white text-edufarm-800" : "bg-edufarm-800 text-white"
        }`}
      >
        {busy ? "…" : "📲 Install app"}
      </button>
    );
  }

  if (ios) {
    return (
      <span>
        <button
          onClick={() => setShowIosHelp((v) => !v)}
          className={`rounded-xl font-bold ${size} ${
            dark ? "bg-white text-edufarm-800" : "bg-edufarm-800 text-white"
          }`}
        >
          📲 Install app
        </button>
        {showIosHelp && (
          <span className="mt-2 block max-w-xs rounded-xl bg-white p-3 text-left text-[13px] leading-relaxed text-ink-900 shadow-lg">
            On iPhone/iPad: tap <strong>Share</strong> (the square with an
            arrow) → <strong>Add to Home Screen</strong> → <strong>Add</strong>.
            EduFarm then opens full-screen like a native app.
          </span>
        )}
      </span>
    );
  }

  return null;
}

/** Registers /sw.js in production only (dev stays uncached). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is best-effort */
      });
    }
  }, []);
  return null;
}
