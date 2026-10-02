import { buildClefRequest } from "./engine/clef-questions.ts";
import { normalizeAnswers } from "./engine/normalize.ts";
import type { NormalizedDecision, Unit } from "./engine/types.ts";
import { runModel } from "./gateway.ts";
import type { Env } from "./env.ts";

const FLASH = "@cf/cloudflare/clef-flash";
const FULL = "@cf/cloudflare/clef";

/**
 * Clef decides. This function does not write summaries.
 * clef-flash is the default. Full clef runs once when confidence is low,
 * a label is unclear, or the top two choices are within 0.08.
 */
export async function decideUnit(
  env: Env,
  unit: Unit,
  neighbors: { before?: string; after?: string },
): Promise<NormalizedDecision> {
  const flashBody = buildClefRequest(unit, neighbors, "clef-flash");
  const flashRaw = await runModel(env, FLASH, flashBody);
  const flash = normalizeAnswers(asClef(flashRaw, "clef-flash"), unit.id);
  if (!needsFullClef(flash)) return flash;
  const fullBody = buildClefRequest(unit, neighbors, "clef");
  const fullRaw = await runModel(env, FULL, fullBody);
  return normalizeAnswers(asClef(fullRaw, "clef"), unit.id);
}

export function needsFullClef(decision: NormalizedDecision): boolean {
  if (decision.confidence < 0.72 || decision.conflict) return true;
  if (decision.polarity === "unclear") return true;
  if (decision.record_kind === "none" && decision.boilerplate === "no") return true;
  if (decision.record_kind === "theory" && (decision.causal === "unclear" || decision.falsifiable === "unclear")) {
    return true;
  }
  return false;
}

function asClef(raw: unknown, model: string): { model: string; answers: Record<string, unknown> } {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nested = obj.result && typeof obj.result === "object" ? (obj.result as Record<string, unknown>) : obj;
  const answers = nested.answers && typeof nested.answers === "object" ? (nested.answers as Record<string, unknown>) : {};
  return { model: typeof nested.model === "string" ? nested.model : model, answers };
}
