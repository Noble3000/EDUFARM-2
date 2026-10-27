"use client";

import { useEffect, useState } from "react";

type D = { title: string; verseRef?: string | null; body: string } | null;

export function LiveDevotional({
  compact = false,
  className = "mt-8",
}: {
  /** Tighter padding/labels for in-dashboard placement. */
  compact?: boolean;
  className?: string;
}) {
  const [d, setD] = useState<D>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/devotional/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        setD(json?.devotional ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Static fallback keeps the section prominent before first publish.
  const title = d?.title ?? "Light for the journey";
  const verse = d?.verseRef ?? "John 8:12";
  const body =
    d?.body ??
    "“I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.”";

  return (
    <section className={className} aria-label="Word of God devotional">
      <div
        className={`rounded-xl border-l-4 border-gold-500 bg-gold-bg ${
          compact ? "p-5" : "p-6"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tracking-widest text-gold-tx uppercase">
            Word of God
          </span>
          <span className="text-xs text-gold-tx opacity-80">
            · {loaded ? title : "Devotional"}
          </span>
        </div>
        <blockquote className="mt-3 max-w-2xl">
          <p
            className={`leading-relaxed font-medium ${
              compact ? "text-base" : "text-lg"
            }`}
          >
            {body}
          </p>
          <cite className="mt-2 block text-sm text-gold-tx not-italic">
            {verse} · Refreshed daily by our administrators
          </cite>
        </blockquote>
      </div>
    </section>
  );
}
