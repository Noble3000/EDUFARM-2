"use client";

import { useEffect, useState } from "react";

export type DevotionalContent = {
  title: string;
  /** Bible text with its reference — shown before the message body. */
  verseRef?: string | null;
  body: string;
  prayer?: string | null;
  /** Reading date line, already formatted (e.g. TUE OCT 27 2026). */
  date?: string | null;
};

type Row = DevotionalContent & { publishAt?: string | null };

// Static fallback keeps the section prominent before first publish.
const FALLBACK: DevotionalContent = {
  title: "Light for the journey",
  verseRef:
    "“I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.” (John 8:12)",
  body:
    "You are not left to find your own way. The same light that spoke the worlds into being goes ahead of you — in lectures, in study, in the quiet hours — and it does not go out.\n\nLet today be shaped by that light: what you read, how you work, and how you treat the people beside you.",
  prayer:
    "Father, thank You for the light of Your Word. I walk in it today — in my studies, my words and my choices. Your light in me will not be hidden. Amen.",
};

/** e.g. (Ephesians 2:10) · (1 John 4:8) · (Psalm 23:1-3) */
const SCRIPTURE_REF =
  /\((?:[1-3]\s)?[A-Z][A-Za-z]+\.?\s\d+:\d+(?:\s?[-–]\s?\d+)?(?:\s*[,;]\s*\d+)?\)/;

/** "Prayer / Confession", "PRAYER", "Confession:" on a line of its own. */
const PRAYER_HEADING = /^(prayer|confession)(\s*\/\s*(prayer|confession))?\s*:?$/i;

function paragraphs(text?: string | null) {
  if (!text) return [];
  return text
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Older entries typed the prayer into the message under a
 * "Prayer / Confession" heading. Lift it out so it shows in its own block.
 */
function splitLegacyPrayer(body: string, prayer?: string | null) {
  const explicit = prayer?.trim();
  if (explicit) return { body: body.trim(), prayer: explicit };

  const lines = (body ?? "").split(/\r?\n/);
  const at = lines.findIndex((line) => PRAYER_HEADING.test(line.trim()));
  if (at === -1) return { body: body.trim(), prayer: null as string | null };

  const message = lines.slice(0, at).join("\n").trim();
  const extracted = lines.slice(at + 1).join("\n").trim();
  if (!message || !extracted) return { body: body.trim(), prayer: null };
  return { body: message, prayer: extracted };
}

/**
 * Rhapsody-style order: the scripture is always shown before the message body.
 * When a message was typed with its verse as the opening sentence, that
 * sentence is lifted out and shown as the verse instead.
 */
function splitVerse(body: string, verse?: string | null) {
  const explicit = verse?.trim();
  if (explicit) return { verse: explicit, body: body.trim() };

  const message = body.trim();
  const match = new RegExp(
    `^([\\s\\S]{20,}?${SCRIPTURE_REF.source}\\s*[.!]?)\\s+([\\s\\S]{20,})$`,
  ).exec(message);
  if (!match) return { verse: null as string | null, body: message };
  return { verse: match[1].trim(), body: match[2].trim() };
}

/** TUE OCT 27 2026 — same date line the devotional reference uses. */
export function formatDevotionalDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .replace(/,/g, "")
    .toUpperCase();
}

export function DevotionalView({
  content,
  compact = false,
  className = "",
}: {
  content: DevotionalContent;
  /** Tighter type/padding for in-dashboard placement. */
  compact?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const message = splitLegacyPrayer(content.body, content.prayer);
  const { verse, body } = splitVerse(message.body, content.verseRef);
  const bodyParagraphs = paragraphs(body);
  const prayerParagraphs = paragraphs(message.prayer);

  // Dashboards stay academic-first: long messages collapse with a fade.
  const canCollapse = compact && body.length > 340;
  const collapsed = canCollapse && !expanded;

  return (
    <section className={className} aria-label="Word of God devotional">
      <article className="rounded-2xl border border-gold-500/30 bg-gold-bg p-2 sm:p-3">
        <div
          className={`rounded-xl bg-white text-ink-900 shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${
            compact ? "px-4 py-5 sm:px-6" : "px-5 py-7 sm:px-10 sm:py-10"
          }`}
        >
          {/* Reading order: date → title → scripture → body → prayer. */}
          <header className="border-b border-gold-500/40 pb-4 text-center">
            <p
              className={`font-bold text-gold-tx uppercase ${
                compact ? "text-[11px] tracking-[0.18em]" : "text-xs tracking-[0.24em]"
              }`}
            >
              Word of God
            </p>
            {content.date && (
              <p className="mt-1.5 text-[11px] font-medium tracking-[0.18em] text-ink-400 uppercase">
                {content.date}
              </p>
            )}
            <h2
              className={`mt-2.5 font-display font-extrabold tracking-tight text-balance text-ink-900 ${
                compact ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
              }`}
            >
              {content.title}
            </h2>
            <div
              className="mx-auto mt-5 h-px w-24 bg-gold-500/70"
              aria-hidden="true"
            />
          </header>

          {/* The Bible text comes before the message — never after it. */}
          {verse && (
            <p
              className={`mt-6 font-semibold leading-relaxed text-ink-900 ${
                compact ? "text-[15px] sm:text-base" : "text-lg sm:text-xl"
              }`}
            >
              {verse}
            </p>
          )}

          <div
            className={`relative ${verse ? "mt-4" : "mt-6"} ${
              collapsed ? "devotional-fade max-h-60 overflow-hidden" : ""
            }`}
          >
            <div
              className={`space-y-3 leading-relaxed text-ink-900 ${
                compact ? "text-[15px]" : "text-base sm:text-[17px]"
              }`}
            >
              {bodyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-3 text-sm font-bold text-gold-tx hover:underline"
            >
              {expanded ? "Show less" : "Read full message"}
            </button>
          )}

          {prayerParagraphs.length > 0 && (
            <div className={compact ? "mt-5" : "mt-8"}>
              <h3
                className={`text-center font-display font-bold text-gold-tx uppercase ${
                  compact ? "text-xs tracking-[0.2em]" : "text-lg tracking-[0.16em]"
                }`}
              >
                Prayer / Confession
              </h3>
              <div className="mt-3 rounded-xl border border-gold-500/40 bg-gold-bg/60 p-4 sm:p-5">
                <div className="space-y-3 leading-relaxed text-ink-900 italic">
                  {prayerParagraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

export function LiveDevotional({
  compact = false,
  className = "mt-8",
}: {
  /** Tighter padding/labels for in-dashboard placement. */
  compact?: boolean;
  className?: string;
}) {
  const [row, setRow] = useState<Row | null>(null);

  useEffect(() => {
    fetch("/api/devotional/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setRow(json?.devotional ?? null))
      .catch(() => {});
  }, []);

  const content: DevotionalContent = row
    ? { ...row, date: formatDevotionalDate(row.publishAt) }
    : FALLBACK;

  return <DevotionalView content={content} compact={compact} className={className} />;
}
