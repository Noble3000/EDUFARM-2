import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ExtractedCourse = {
  code: string;
  title: string;
  lecturerName: string;
  unitLoad: number | null;
  session: string;
};

/** Parse an uploaded registration document to text. Never stored — parsed and discarded. */
export async function documentText(
  bytes: Buffer,
  mime: string,
  filename: string,
): Promise<string> {
  const lower = `${mime} ${filename}`.toLowerCase();
  if (lower.includes("pdf")) {
    const parser = new PDFParse({ data: bytes });
    try {
      const out = await parser.getText();
      return out.text ?? "";
    } finally {
      await parser.destroy().catch(() => {});
    }
  }
  if (lower.includes("wordprocessingml") || lower.includes("docx") || lower.includes("msword") || lower.endsWith(".doc")) {
    const { value } = await mammoth.extractRawText({ buffer: bytes });
    return value;
  }
  if (lower.includes("text") || lower.endsWith(".txt")) {
    return bytes.toString("utf-8");
  }
  throw new Error("Only PDF, Word (.docx), or .txt registration documents are supported.");
}

/** Heuristic candidates: course code / title / lecturer / units / session. */
export function extractCourses(text: string): ExtractedCourse[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const session = text.match(/20\d{2}\s*\/\s*20\d{2}/)?.[0].replace(/\s+/g, "") ?? "";
  const out: ExtractedCourse[] = [];
  const seen = new Set<string>();

  const codeRe = /\b([A-Z]{2,4})\s?(\d{3}[A-Z]?)\b/g;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (const m of line.matchAll(codeRe)) {
      const code = `${m[1]} ${m[2]}`.toUpperCase();
      if (seen.has(code)) continue;
      seen.add(code);

      // Title: remainder of the same line after the code, minus any
      // lecturer/units fragments (still editable in review UI).
      let title = line.slice((m.index ?? 0) + m[0].length).replace(/^[\s:|\-–—]+/, "").trim();
      if (!title && li + 1 < lines.length && !codeRe.test(lines[li + 1])) {
        title = lines[li + 1].slice(0, 80);
      }
      const lectRe = /(Dr|Prof|Mr|Mrs|Ms)\.?\s+[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2}/;
      const unitRe = /(\d)\s*(units?|credits?|hrs?)/i;
      title = title.replace(lectRe, "").replace(unitRe, "").replace(/^[,\s:|\-–—]+|[,\s:|\-–—]+$/g, "").trim();

      // Lecturer/units: same line first, then ±2 neighbouring lines.
      const lecturerHere = line.match(lectRe)?.[0] ?? "";
      const unitHere = line.match(unitRe)?.[1];
      let lecturerName = lecturerHere;
      let unitLoad: number | null = unitHere ? Number(unitHere) : null;
      if (!lecturerName || unitLoad === null) {
        for (let k = Math.max(0, li - 2); k <= Math.min(lines.length - 1, li + 2); k++) {
          if (k === li) continue;
          if (!lecturerName) lecturerName = lines[k].match(lectRe)?.[0] ?? "";
          if (unitLoad === null) {
            const um = lines[k].match(unitRe);
            if (um) unitLoad = Number(um[1]);
          }
          if (lecturerName && unitLoad !== null) break;
        }
      }

      out.push({ code, title, lecturerName, unitLoad, session });
    }
  }
  return out.slice(0, 30);
}
