import type {
  ConceptType,
  NormalizedDecision,
  Polarity,
  RecordKind,
  ReviewReason,
  Ternary,
  TheoryStatus,
  TimeScope,
  YesNo,
} from "./types.ts";

const POLARITY = ["affirmed", "denied", "conditional", "unclear"] as const;
const KIND = ["fact", "theory", "concept", "workflow_step", "none"] as const;
const STATUS = ["hypothesis", "model", "interpretation", "prediction", "not_applicable"] as const;
const TERNARY = ["yes", "no", "unclear"] as const;
const TIME = ["past", "present", "future", "unspecified"] as const;
const CONCEPT = ["entity", "process", "metric", "role", "tool", "other", "not_applicable"] as const;

export function normalizeAnswers(
  raw: { model?: string; answers?: Record<string, unknown> },
  unitId: string,
): NormalizedDecision {
  const answers = raw.answers ?? {};
  const boilerplate = readNoul(answers.boilerplate);
  const deterministic = readNoul(answers.deterministic);
  const quantity = readNoul(answers.quantity_present);
  const defined = readNoul(answers.definition_present);
  const decision = readNoul(answers.decision_point);
  const full = readNoul(answers.fully_specified);
  const external = readNoul(answers.external_check);
  const polarity = readChoice(answers.polarity, POLARITY, "unclear");
  const kind = readChoice(answers.record_kind, KIND, "none");
  const status = readChoice(answers.theory_status, STATUS, "not_applicable");
  const causal = readChoice(answers.causal, TERNARY, "unclear");
  const falsifiable = readChoice(answers.falsifiable, TERNARY, "unclear");
  const timeScope = readChoice(answers.time_scope, TIME, "unspecified");
  const conceptType = readChoice(answers.concept_type, CONCEPT, "not_applicable");

  const question_scores = {
    boilerplate: boilerplate.confidence,
    deterministic: deterministic.confidence,
    quantity_present: quantity.confidence,
    definition_present: defined.confidence,
    decision_point: decision.confidence,
    fully_specified: full.confidence,
    external_check: external.confidence,
    polarity: polarity.confidence,
    record_kind: kind.confidence,
    theory_status: status.confidence,
    causal: causal.confidence,
    falsifiable: falsifiable.confidence,
    time_scope: timeScope.confidence,
    concept_type: conceptType.confidence,
  };
  // The keep score is the category and the reading. A citation, a time scope,
  // or a number question stays on the record and does not pull this down.
  const confidence =
    kind.value === "none" ? kind.confidence : Math.min(kind.confidence, polarity.confidence);

  const conflict = kind.conflict || polarity.conflict;

  return {
    unit_id: unitId,
    boilerplate: boilerplate.yes,
    deterministic: deterministic.yes,
    quantity_present: quantity.yes,
    definition_present: defined.yes,
    decision_point: decision.yes,
    fully_specified: full.yes,
    polarity: polarity.value as Polarity,
    record_kind: kind.value as RecordKind,
    theory_status: status.value as TheoryStatus,
    causal: causal.value as Ternary,
    falsifiable: falsifiable.value as Ternary,
    time_scope: timeScope.value as TimeScope,
    concept_type: conceptType.value as ConceptType | "not_applicable",
    external_check: external.yes,
    confidence,
    question_scores,
    conflict,
    model: raw.model ?? "unknown",
  };
}

export function reviewReasons(decision: NormalizedDecision, human: boolean, text = ""): ReviewReason[] {
  if (decision.boilerplate === "yes") return [];
  const reasons = new Set<ReviewReason>();
  if (!human && decision.conflict) reasons.add("conflict");
  if (decision.record_kind === "none") reasons.add("unclear");
  if (decision.record_kind !== "none" && decision.polarity === "unclear") reasons.add("unclear");
  // "Poorly active" and "mostly negative" state the claim. They are not a no.
  // A says-no reading waits unless the sentence itself says no.
  if (!human && decision.polarity === "denied" && text && !statesDenial(text)) {
    reasons.add("unsupported_denial");
  }
  return [...reasons];
}

export function statesDenial(text: string): boolean {
  return /\b(no|not|never|cannot|can't|doesn't|does not|do not|don't|isn't|aren't|wasn't|weren't|won't|must not|shall not)\b/i.test(
    text,
  );
}

function readNoul(value: unknown): { yes: YesNo; confidence: number } {
  let p: number | null = null;
  if (typeof value === "number") p = value;
  else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.noul === "number") p = obj.noul;
    else if (typeof obj.probability === "number") p = obj.probability;
  }
  if (p === null || Number.isNaN(p) || p < 0 || p > 1) return { yes: "no", confidence: 0 };
  return { yes: p >= 0.5 ? "yes" : "no", confidence: Math.abs(p - 0.5) * 2 };
}

function readChoice<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): { value: T; confidence: number; conflict: boolean } {
  if (!value || typeof value !== "object") return { value: fallback, confidence: 0, conflict: false };
  const obj = value as Record<string, unknown>;
  const selected = typeof obj.choice === "string" ? obj.choice : fallback;
  const known = (allowed as readonly string[]).includes(selected);
  const safe = (known ? selected : fallback) as T;
  let confidence = typeof obj.confidence === "number" ? obj.confidence : 0;
  let conflict = false;
  if (obj.probabilities && typeof obj.probabilities === "object") {
    const ranked = Object.entries(obj.probabilities as Record<string, unknown>)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number")
      .sort((a, b) => b[1] - a[1]);
    if (ranked.length >= 2 && ranked[1][1] >= ranked[0][1] - 0.08) conflict = true;
    if (typeof obj.confidence !== "number" && ranked[0]) confidence = ranked[0][1];
  }
  if (!known) confidence = Math.min(confidence, 0.4);
  return { value: safe, confidence, conflict };
}
