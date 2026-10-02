import { needsFullClef } from "../decision.ts";
import { buildClefRequest, type ClefRequest } from "./clef-questions.ts";
import { normalizeAnswers } from "./normalize.ts";
import type { NormalizedDecision, Unit } from "./types.ts";

/**
 * One local Clef server, started with `clef_mlx.py serve`.
 * Flash is the default. Full Clef runs only when CLEF_FULL_URL is set and
 * the flash answer is low-confidence, conflicting, or unclear.
 */
export async function decideUnits(
  units: Unit[],
  options: {
    flashUrl?: string;
    fullUrl?: string;
    fetchImpl?: typeof fetch;
    concurrency?: number;
    caller?: (body: ClefRequest) => Promise<{ model: string; answers: Record<string, unknown> }>;
    onDecision?: (decision: NormalizedDecision, index: number) => void | Promise<void>;
  },
): Promise<{ decisions: NormalizedDecision[]; engine: string; escalated: string[] }> {
  const decisions: NormalizedDecision[] = new Array(units.length);
  const escalated: string[] = [];
  const workers = Math.max(1, Math.min(options.concurrency ?? 1, units.length || 1));
  let cursor = 0;
  async function next(): Promise<void> {
    while (cursor < units.length) {
      const index = cursor;
      cursor += 1;
      const unit = units[index];
      if (!unit) continue;
      const neighbors = { before: units[index - 1]?.text, after: units[index + 1]?.text };
      const request = buildClefRequest(unit, neighbors, "clef-flash");
      const flash = options.caller
        ? await options.caller(request)
        : await postSystemone(options.fetchImpl ?? fetch, options.flashUrl ?? "", request);
      let decision = normalizeAnswers(flash, unit.id);
      if (needsFullClef(decision)) {
        escalated.push(unit.id);
        if (options.fullUrl && !options.caller) {
          const full = await postSystemone(
            options.fetchImpl ?? fetch,
            options.fullUrl,
            buildClefRequest(unit, neighbors, "clef"),
          );
          decision = normalizeAnswers(full, unit.id);
        }
      }
      decisions[index] = decision;
      await options.onDecision?.(decision, index);
    }
  }
  await Promise.all(Array.from({ length: workers }, () => next()));
  const engine = decisions.some((item) => item?.model === "clef") ? "clef" : "clef-flash";
  return { decisions, engine, escalated };
}

async function postSystemone(
  fetchImpl: typeof fetch,
  baseUrl: string,
  body: ClefRequest,
): Promise<{ model: string; answers: Record<string, unknown> }> {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/systemone`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`clef ${response.status}: ${text.slice(0, 300)}`);
  }
  const parsed = JSON.parse(text) as { model?: string; answers?: Record<string, unknown> };
  if (!parsed.answers || typeof parsed.answers !== "object") {
    throw new Error("clef response missing answers");
  }
  return { model: parsed.model ?? body.model, answers: parsed.answers };
}
