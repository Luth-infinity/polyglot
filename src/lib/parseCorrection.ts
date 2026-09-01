import type { CorrectionChange, CorrectionResult } from "@/store/appStore";

/** Reads the JSON string literal starting at `from` (which must be a `"`). */
function readJsonString(src: string, from: number): { value: string; end: number } | null {
  if (src[from] !== '"') return null;
  let i = from + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === '"') {
      try {
        return { value: JSON.parse(src.slice(from, i + 1)), end: i + 1 };
      } catch {
        return null;
      }
    }
    i += 1;
  }
  return null;
}

/** Finds the array literal starting at `from` and returns its source span. */
function readJsonArray(src: string, from: number): string | null {
  if (src[from] !== "[") return null;
  let depth = 0;
  let inString = false;
  for (let i = from; i < src.length; i += 1) {
    const c = src[i];
    if (inString) {
      if (c === "\\") i += 1;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "[") depth += 1;
    else if (c === "]") {
      depth -= 1;
      if (depth === 0) return src.slice(from, i + 1);
    }
  }
  return null;
}

/**
 * The model returns JSON, but a run cut short by max_tokens or a stray fence
 * used to fail `JSON.parse` and leave the UI silently empty. Salvage what we
 * can: the corrected text alone is still useful without the change list.
 */
export function parseCorrection(raw: string): CorrectionResult | null {
  let text = raw.trim();
  if (!text) return null;

  // Defensive: the assistant prefill normally rules fences out.
  text = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.corrected === "string") {
      return {
        corrected: parsed.corrected,
        changes: Array.isArray(parsed.changes) ? (parsed.changes as CorrectionChange[]) : [],
      };
    }
  } catch {
    // fall through to salvage
  }

  const correctedKey = text.indexOf('"corrected"');
  if (correctedKey === -1) return null;
  const quote = text.indexOf('"', text.indexOf(":", correctedKey) + 1);
  const corrected = quote === -1 ? null : readJsonString(text, quote);
  if (!corrected) return null;

  let changes: CorrectionChange[] = [];
  const changesKey = text.indexOf('"changes"', corrected.end);
  if (changesKey !== -1) {
    const bracket = text.indexOf("[", changesKey);
    const arraySrc = bracket === -1 ? null : readJsonArray(text, bracket);
    if (arraySrc) {
      try {
        const parsed = JSON.parse(arraySrc);
        if (Array.isArray(parsed)) changes = parsed as CorrectionChange[];
      } catch {
        changes = [];
      }
    }
  }

  return { corrected: corrected.value, changes };
}
