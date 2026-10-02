import { segmentDocument } from "./engine/segment.ts";
import { runModel } from "./gateway.ts";
import { SEGMENT_MODEL, type Env } from "./env.ts";
import type { Chunk, TableInput, Unit } from "./engine/types.ts";

export interface SegmentResult {
  chunks: Chunk[];
  units: Unit[];
  segmenter: "workers-ai" | "deterministic-fallback";
}

/**
 * The text model may only propose exact substrings. Anything paraphrased,
 * empty, or the wrong shape is discarded and the deterministic segmenter stands.
 * Assumption: SEGMENT_MODEL is a current Workers AI chat model. Change the id
 * if the catalog has moved on.
 */
export async function segmentWithModel(env: Env, text: string, tables: TableInput[] = []): Promise<SegmentResult> {
  const fallback = segmentDocument(text, tables);
  try {
    const raw = await runModel(env, env.SEGMENT_MODEL || SEGMENT_MODEL, {
      messages: [
        {
          role: "system",
          content:
            "Split the document into atomic sentences, bullets, steps, and definitions. " +
            "Return JSON only: {\"units\":[\"exact substring\", ...]}. " +
            "Copy text exactly. Do not paraphrase, merge claims, or add steps.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 4096,
    });
    const proposed = readUnits(raw);
    if (!proposed || proposed.length === 0) return { ...fallback, segmenter: "deterministic-fallback" };
    const usable = proposed.every((quote) => quote.length > 0 && text.includes(quote));
    const ratio = proposed.length / Math.max(fallback.units.length, 1);
    if (!usable || ratio < 0.5 || ratio > 1.5) return { ...fallback, segmenter: "deterministic-fallback" };
    const units: Unit[] = proposed.map((quote, index) => ({
      id: `U${String(index + 1).padStart(3, "0")}`,
      chunk_id: fallback.chunks[0]?.id ?? "K001",
      ordinal: index + 1,
      section_path: sectionFor(quote, fallback.units) || "Document",
      text: quote,
      from_table: false,
      list_order: /^\d+[.)]\s+/.test(quote) ? Number(/^(\d+)/.exec(quote)?.[1]) : null,
    }));
    const tableUnits = fallback.units.filter((unit) => unit.from_table).map((unit, index) => ({
      ...unit,
      id: `U${String(units.length + index + 1).padStart(3, "0")}`,
      ordinal: units.length + index + 1,
    }));
    return { chunks: fallback.chunks, units: [...units, ...tableUnits], segmenter: "workers-ai" };
  } catch {
    return { ...fallback, segmenter: "deterministic-fallback" };
  }
}

function sectionFor(quote: string, units: Unit[]): string {
  return units.find((unit) => unit.text === quote)?.section_path ?? "";
}

function readUnits(raw: unknown): string[] | null {
  const text = readText(raw);
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { units?: unknown };
    if (!Array.isArray(parsed.units)) return null;
    return parsed.units.filter((item): item is string => typeof item === "string").map((item) => item.trim());
  } catch {
    return null;
  }
}

function readText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  if (typeof obj.response === "string") return obj.response;
  if (typeof obj.result === "string") return obj.result;
  return "";
}
