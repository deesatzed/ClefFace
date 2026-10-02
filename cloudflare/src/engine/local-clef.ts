import type { Unit } from "./types.ts";
import { actorOf, slot } from "./text.ts";

/**
 * Preview stand-in. Same response shape as Clef (noul + choice).
 * Not a model call. The Worker path uses @cf/cloudflare/clef instead.
 */
export function localClef(unit: Unit): { model: string; answers: Record<string, unknown> } {
  const text = unit.text.trim();
  const kind = kindOf(unit);
  const polarity = polarityOf(text);
  const status = theoryStatus(text, kind);
  const causal = causalOf(text);
  const falsifiable = falsifiableOf(text, kind);
  const timeScope = timeOf(text);
  const conceptType = conceptTypeOf(text, kind);
  const deterministic = deterministicOf(text, kind);
  const quantity = quantityOf(text);
  const defined = definitionOf(text);
  const decision = decisionOf(text);
  const full = fullySpecified(text, kind);
  const external = externalOf(text);
  const boilerplate = kind === "none" && wordish(text) < 8;
  const conflict = isConflict(text, kind);

  const kindConfidence = conflict ? 0.5 : kind === "none" && !boilerplate ? 0.55 : 0.9;

  return {
    model: "local-stand-in",
    answers: {
      boilerplate: noul(boilerplate),
      deterministic: noul(deterministic),
      quantity_present: noul(quantity),
      definition_present: noul(defined),
      decision_point: noul(decision),
      fully_specified: noul(full),
      external_check: noul(external),
      polarity: choice(polarity, ["affirmed", "denied", "conditional", "unclear"], polarity === "unclear" ? 0.5 : 0.9),
      record_kind: choice(
        kind,
        ["fact", "theory", "concept", "workflow_step", "none"],
        kindConfidence,
        conflict ? "fact" : undefined,
      ),
      theory_status: choice(
        status,
        ["hypothesis", "model", "interpretation", "prediction", "not_applicable"],
        0.88,
      ),
      causal: choice(causal, ["yes", "no", "unclear"], causal === "unclear" ? 0.5 : 0.9),
      falsifiable: choice(
        falsifiable,
        ["yes", "no", "unclear"],
        falsifiable === "unclear" ? 0.86 : 0.9,
      ),
      time_scope: choice(timeScope, ["past", "present", "future", "unspecified"], 0.88),
      concept_type: choice(
        conceptType,
        ["entity", "process", "metric", "role", "tool", "other", "not_applicable"],
        0.88,
      ),
    },
  };
}

function kindOf(unit: Unit): "fact" | "theory" | "concept" | "workflow_step" | "none" {
  const text = unit.text.trim();
  if (unit.from_table) return quantityOf(text) ? "fact" : "concept";
  if (/^\d+[.)]\s+/.test(text) || /^[-*•]\s+/.test(text)) return "workflow_step";
  if (isDefinition(text)) return "concept";
  if (/^when\b/i.test(text) && /procedure|workflow|process|steps/i.test(unit.section_path)) {
    return "workflow_step";
  }
  if (theorySignal(text)) return "theory";
  if (wordish(text) >= 5) return "fact";
  return "none";
}

function isDefinition(text: string): boolean {
  return /\b(is defined as|are defined as|defined as|refers to|means)\b/i.test(text);
}

function theorySignal(text: string): boolean {
  return /\b(may|might|could|suggests?|likely|possibly|perhaps|hypothesis|hypothesi[sz]e|appears to|seems to|interpreted as|interpretation|presumably|we believe|according to)\b/i.test(
    text,
  );
}

function isConflict(text: string, kind: string): boolean {
  return kind === "theory" && /\bleads? to\b/i.test(text) && /\baccording to\b/i.test(text) && !/\b(may|might|could)\b/i.test(text);
}

function polarityOf(text: string): "affirmed" | "denied" | "conditional" | "unclear" {
  const conditional = /\b(if|unless|provided that|only if|only when|when)\b/i.test(text);
  if (conditional && !/^\d+[.)]\s+/.test(text)) return "conditional";
  if (/\bnot optional\b/i.test(text)) return "affirmed";
  const trailingContrast = /,\s+not\b/i.test(text);
  const negated = /\b(no|not|never|cannot|can't|doesn't|does not|do not|don't|isn't|aren't|wasn't|weren't|won't|must not|shall not)\b/i.test(
    text,
  );
  if (negated && !trailingContrast) return "denied";
  if (wordish(text) < 4) return "unclear";
  return "affirmed";
}

function theoryStatus(text: string, kind: string): "hypothesis" | "model" | "interpretation" | "prediction" | "not_applicable" {
  if (kind !== "theory") return "not_applicable";
  if (/hypothes/i.test(text)) return "hypothesis";
  if (/\bmodel\b/i.test(text)) return "model";
  if (/\b(predict|forecast|expected to|will)\b/i.test(text)) return "prediction";
  if (/\b(may|might|could)\b/i.test(text)) return "hypothesis";
  return "interpretation";
}

function causalOf(text: string): "yes" | "no" | "unclear" {
  if (/\b(because|causes?|caused|leads? to|results? in|due to|therefore|hence|consequently)\b/i.test(text)) {
    return "yes";
  }
  return "no";
}

function falsifiableOf(text: string, kind: string): "yes" | "no" | "unclear" {
  if (kind !== "theory") return "unclear";
  if (/\b(cannot be tested|unfalsifiable)\b/i.test(text)) return "no";
  if (/\b(measured by|if and only if|percent|within \d+)\b/i.test(text)) return "yes";
  return "unclear";
}

function timeOf(text: string): "past" | "present" | "future" | "unspecified" {
  const future = /\b(will|going to|forecast)\b/i.test(text);
  const past = /\b(was|were|had|did|logged|arrived|recorded|stated|previously)\b/i.test(text) || /\b(19|20)\d{2}\b/.test(text);
  const present = /\b(is|are|does|do|means|shall)\b/i.test(text);
  if (future && past) return "unspecified";
  if (future) return "future";
  if (past && !/\bis defined as\b|\bmeans\b/i.test(text)) return "past";
  if (present) return "present";
  return "unspecified";
}

function conceptTypeOf(
  text: string,
  kind: string,
): "entity" | "process" | "metric" | "role" | "tool" | "other" | "not_applicable" {
  if (kind !== "concept") return "not_applicable";
  const term = termOf(text) ?? text;
  if (/\b(score|rate|ratio|index|threshold|percent|count|sum)\b/i.test(term)) return "metric";
  if (/\b(nurse|physician|supervisor|operator|reviewer|clerk|clinician|officer)\b/i.test(term)) return "role";
  if (/\b(system|software|database|dashboard|platform|ehr|epic)\b/i.test(term)) return "tool";
  if (/\b(process|procedure|protocol|workflow|pipeline|callback|drill)\b/i.test(term)) return "process";
  return "other";
}

function deterministicOf(text: string, kind: string): boolean {
  if (kind === "theory") return false;
  if (theorySignal(text)) return false;
  return kind === "fact" || kind === "concept";
}

function quantityOf(text: string): boolean {
  return /\b\d+(?:[.:]\d+)?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|percent)\b/i.test(text);
}

function definitionOf(text: string): boolean {
  return isDefinition(text);
}

function decisionOf(text: string): boolean {
  return /\b(if|whether|otherwise|decide|decision)\b/i.test(text);
}

function fullySpecified(text: string, kind: string): boolean {
  if (kind !== "workflow_step") return false;
  const actor = actorOf(text);
  if (actor === "unspecified") return false;
  const input = slot(text, "input");
  const output = slot(text, "output");
  return input !== "unspecified" || output !== "unspecified";
}

function externalOf(text: string): boolean {
  return /\b(according to (?:the )?(?:literature|guidelines|published)|et al\.|citation needed)\b/i.test(text);
}

function termOf(text: string): string | null {
  const match = /^(.{2,80}?)\s+(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(text);
  if (!match) return null;
  return match[1].replace(/^(a|an|the)\s+/i, "").trim();
}

function wordish(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function noul(yes: boolean, confidence = 0.9): { type: "noul"; noul: number } {
  const p = Math.min(0.99, Math.max(0.51, 0.5 + confidence / 2));
  return { type: "noul", noul: yes ? p : 1 - p };
}

function choice(
  selected: string,
  labels: string[],
  confidence: number,
  runnerUp?: string,
): { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> } {
  const probabilities: Record<string, number> = {};
  const rest = labels.filter((label) => label !== selected);
  const top = runnerUp ? 0.48 : confidence;
  const second = runnerUp ? 0.44 : 0;
  let used = top + (runnerUp ? second : 0);
  for (const label of labels) {
    if (label === selected) probabilities[label] = top;
    else if (label === runnerUp) probabilities[label] = second;
    else probabilities[label] = 0;
  }
  const others = rest.filter((label) => label !== runnerUp);
  const share = others.length > 0 ? (1 - used) / others.length : 0;
  for (const label of others) probabilities[label] = share;
  used = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
  if (used > 0 && Math.abs(used - 1) > 0.001) {
    probabilities[selected] += 1 - used;
  }
  return { type: "choice", choice: selected, confidence: runnerUp ? 0.5 : confidence, probabilities };
}
