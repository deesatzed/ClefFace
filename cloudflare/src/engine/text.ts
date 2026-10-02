import type { SwarmState } from "./types.ts";

export const CONFIDENCE_THRESHOLD = 0.72;

const ABBR =
  /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Fig|No|St|Dept|Inc|Ltd|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|e\.g|i\.e|U\.S|U\.K)\./g;

export function wordCount(text: string): number {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

export function textHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function formatId(prefix: string, n: number): string {
  return prefix + String(n).padStart(3, "0");
}

export function shortQuote(text: string): string {
  const clean = text.trim();
  if (clean.length <= 180) return clean;
  const slice = clean.slice(0, 180);
  const sp = slice.lastIndexOf(" ");
  return sp > 80 ? slice.slice(0, sp) : slice;
}

export function splitSentences(paragraph: string): string[] {
  let marked = paragraph.replace(ABBR, (match) => match.replace(/\./g, "∯"));
  marked = marked.replace(/(\d)\.(\d)/g, "$1∯$2");
  const parts = marked.split(/(?<=[.!?])\s+(?=[A-Z0-9“"(\[])/);
  const out: string[] = [];
  for (const part of parts) {
    const restored = part.replace(/∯/g, ".").trim();
    if (!restored) continue;
    const bits = restored.split(/;\s+/);
    if (bits.length > 1 && bits.every((bit) => wordCount(bit) >= 6)) {
      for (const bit of bits) {
        const piece = bit.trim();
        if (piece) out.push(piece);
      }
    } else {
      out.push(restored);
    }
  }
  return out;
}

export function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ROLES = [
  "ward nurse",
  "night supervisor",
  "covering physician",
  "physician",
  "nurse",
  "supervisor",
  "operator",
  "reviewer",
  "clerk",
  "clinician",
];

const VERBS = [
  "records",
  "calls",
  "writes",
  "states",
  "starts",
  "reviews",
  "notifies",
  "checks",
  "confirms",
  "sends",
  "opens",
  "closes",
  "assigns",
  "rejects",
  "merges",
  "stores",
  "reads",
  "logs",
  "pages",
  "contacts",
  "documents",
  "enters",
  "signs",
  "extracts",
  "submits",
  "queues",
  "marks",
  "accepts",
];

export function actorOf(text: string): string {
  const re = new RegExp(
    `((?:[Tt]he )?(?:${ROLES.join("|")}))\\s+(?:${VERBS.join("|")})\\b`,
    "i",
  );
  const match = text.match(re);
  return match ? match[1] : "unspecified";
}

export function slot(text: string, kind: "input" | "output"): string {
  const re =
    kind === "input"
      ? /\b(?:from|using|given|based on)\s+([^.,;]+)/i
      : /\b(?:produces?|producing|outputs?|writes|records|logs)\s+([^.,;]+)/i;
  const match = text.match(re);
  if (!match) return "unspecified";
  const phrase = match[1].trim();
  if (!phrase || phrase.length > 80 || !text.includes(phrase)) return "unspecified";
  return phrase;
}

export function emptyState(): SwarmState {
  return { ids_used: [], open_questions: [], rejected_labels: [] };
}

/** Rejects a stage that drops an id it was given. */
export function echoState(prior: SwarmState, next: SwarmState): SwarmState {
  for (const id of prior.ids_used) {
    if (!next.ids_used.includes(id)) {
      throw new Error(`state echo failed for ${id}`);
    }
  }
  return next;
}

export class MemoryRegistry {
  private used = new Set<string>();

  issue(documentId: string, id: string): string {
    const key = `${documentId}:${id}`;
    if (this.used.has(key)) {
      throw new Error(`id reuse rejected: ${key}`);
    }
    this.used.add(key);
    return id;
  }
}

const STOP = new Set(
  "a an the and or of to for from with within on in into over that this those these than then not does do did is are was were be been being by as at it its their they he she you we who whom which what when where while".split(
    " ",
  ),
);

export function contentWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP.has(word));
  return new Set(words);
}

export function isContrast(text: string): boolean {
  return /^(however|but)\b/i.test(text.trim()) || /\b(contrary|in contrast)\b/i.test(text);
}
