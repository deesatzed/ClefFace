import type { InterventionCategory } from "./core.ts";

export type TrialOutcome = "matched_expectation" | "did_not_match" | "inconclusive" | "invalid_response" | "execution_error";

export interface PairExpectation {
  category: InterventionCategory;
  expectedBaseline: string;
  expectedVariant: string;
  answers?: readonly string[];
}

export interface PairScore {
  outcome: TrialOutcome;
  baselineCorrect: boolean | null;
  variantCorrect: boolean | null;
}

export function scorePair(expectation: PairExpectation, baseline: string | null, variant: string | null, error?: string): PairScore {
  if (error) return { outcome: "execution_error", baselineCorrect: null, variantCorrect: null };
  if (baseline === null || variant === null) return { outcome: "inconclusive", baselineCorrect: null, variantCorrect: null };
  const allowed = new Set(expectation.answers ?? ["yes", "no", "insufficient_evidence"]);
  if (!allowed.has(baseline) || !allowed.has(variant)) return { outcome: "invalid_response", baselineCorrect: null, variantCorrect: null };
  const baselineCorrect = baseline === expectation.expectedBaseline;
  const variantCorrect = variant === expectation.expectedVariant;
  return { outcome: baselineCorrect && variantCorrect ? "matched_expectation" : "did_not_match", baselineCorrect, variantCorrect };
}

export function summarizeTrials(scores: readonly PairScore[]): { scheduled: number; matched: number; didNotMatch: number; invalid: number; executionErrors: number } {
  return scores.reduce(
    (summary, score) => {
      summary.scheduled += 1;
      if (score.outcome === "matched_expectation") summary.matched += 1;
      if (score.outcome === "did_not_match") summary.didNotMatch += 1;
      if (score.outcome === "invalid_response") summary.invalid += 1;
      if (score.outcome === "execution_error") summary.executionErrors += 1;
      return summary;
    },
    { scheduled: 0, matched: 0, didNotMatch: 0, invalid: 0, executionErrors: 0 },
  );
}
