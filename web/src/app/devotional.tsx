"use client";

import { useEffect, useState } from "react";

type D = { title: string; verseRef?: string | null; body: string } | null;

export function LiveDevotional() {
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
    <section className="mt-8" aria-label="Word of God devotional">
      <div className="rounded-xl border-l-4 border-gold-500 bg-gold-bg p-6">
        <div className="text-xs font-bold tracking-widest text-gold-tx uppercase">
          Word of God · {loaded ? title : "Devotional"}
        </div>
        <blockquote className="mt-3 max-w-2xl">
          <p className="text-lg leading-relaxed font-medium">{body}</p>
          <cite className="mt-2 block text-sm text-gold-tx not-italic">
            {verse} · Refreshed daily by our administrators
          </cite>
        </blockquote>
      </div>
    </section>
  );
}
