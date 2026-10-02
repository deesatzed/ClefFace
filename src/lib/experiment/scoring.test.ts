import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scorePair, summarizeTrials } from "./scoring.ts";

describe("experiment scoring", () => {
  it("requires both correct answers for a valid meaning-preserving pair", () => {
    const score = scorePair({ category: "meaning_preserving", expectedBaseline: "no", expectedVariant: "no" }, "no", "no");
    assert.equal(score.outcome, "matched_expectation");
    assert.equal(score.baselineCorrect, true);
    assert.equal(score.variantCorrect, true);
  });

  it("does not call a stable wrong answer a successful invariance", () => {
    const score = scorePair({ category: "meaning_preserving", expectedBaseline: "no", expectedVariant: "no" }, "yes", "yes");
    assert.equal(score.outcome, "did_not_match");
    assert.equal(score.baselineCorrect, false);
  });

  it("distinguishes malformed outputs and execution errors", () => {
    assert.equal(scorePair({ category: "meaning_change", expectedBaseline: "no", expectedVariant: "yes" }, "maybe", "yes").outcome, "invalid_response");
    assert.equal(scorePair({ category: "meaning_change", expectedBaseline: "no", expectedVariant: "yes" }, "no", null, "timeout").outcome, "execution_error");
  });

  it("keeps denominators honest", () => {
    const summary = summarizeTrials([
      scorePair({ category: "meaning_change", expectedBaseline: "no", expectedVariant: "yes" }, "no", "yes"),
      scorePair({ category: "meaning_change", expectedBaseline: "no", expectedVariant: "yes" }, "maybe", "yes"),
      scorePair({ category: "evidence_removal", expectedBaseline: "no", expectedVariant: "insufficient_evidence" }, "no", null, "network"),
    ]);
    assert.deepEqual(summary, { scheduled: 3, matched: 1, didNotMatch: 0, invalid: 1, executionErrors: 1 });
  });
});
