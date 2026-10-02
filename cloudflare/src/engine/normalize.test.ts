import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnswers, reviewReasons } from "./normalize.ts";

function choice(selected: string, confidence: number) {
  return { choice: selected, confidence, probabilities: { [selected]: confidence } };
}

function noul(p: number) {
  return { noul: p };
}

test("a cited fact is kept when the category and the reading are sure", () => {
  const decision = normalizeAnswers(
    {
      model: "test",
      answers: {
        boilerplate: noul(0.05),
        deterministic: noul(0.2),
        quantity_present: noul(0.51),
        definition_present: noul(0.1),
        decision_point: noul(0.1),
        fully_specified: noul(0.1),
        external_check: noul(0.95),
        polarity: choice("affirmed", 0.9),
        record_kind: choice("fact", 0.88),
        theory_status: choice("not_applicable", 0.4),
        causal: choice("unclear", 0.4),
        falsifiable: choice("unclear", 0.4),
        time_scope: choice("unspecified", 0.4),
        concept_type: choice("not_applicable", 0.4),
      },
    },
    "U001",
  );
  assert.equal(decision.record_kind, "fact");
  assert.equal(decision.polarity, "affirmed");
  assert.equal(decision.external_check, "yes");
  assert.equal(decision.confidence, 0.88);
  assert.deepEqual(reviewReasons(decision, false), []);
  assert.ok(decision.question_scores.quantity_present < 0.72);
  assert.ok(decision.question_scores.external_check >= 0.72);
});

test("an unsure reading waits even when the category score is high", () => {
  const decision = normalizeAnswers(
    {
      answers: {
        boilerplate: noul(0.05),
        external_check: noul(0.1),
        polarity: choice("unclear", 0.91),
        record_kind: choice("fact", 0.93),
      },
    },
    "U002",
  );
  assert.equal(decision.confidence, 0.91);
  assert.deepEqual(reviewReasons(decision, false), ["unclear"]);
});

test("a modest category score is kept and the score stays visible", () => {
  const decision = normalizeAnswers(
    {
      answers: {
        polarity: choice("affirmed", 0.95),
        record_kind: choice("fact", 0.4),
      },
    },
    "U003",
  );
  assert.equal(decision.confidence, 0.4);
  assert.deepEqual(reviewReasons(decision, false), []);
});

test("a says-no reading waits when the sentence does not say no", () => {
  const decision = normalizeAnswers(
    {
      answers: {
        polarity: choice("denied", 0.87),
        record_kind: choice("fact", 0.94),
      },
    },
    "U005",
  );
  assert.deepEqual(reviewReasons(decision, false, "fluconazole is poorly active (MIC90 64)."), ["unsupported_denial"]);
  assert.deepEqual(reviewReasons(decision, false, "CSF cultures are mostly negative"), ["unsupported_denial"]);
});

test("a says-no reading is kept when the sentence itself says no", () => {
  const decision = normalizeAnswers(
    {
      answers: {
        polarity: choice("denied", 0.54),
        record_kind: choice("fact", 0.9),
      },
    },
    "U006",
  );
  assert.deepEqual(
    reviewReasons(decision, false, "despite this, there is no clearly proven optimal regimen and mortality remains high."),
    [],
  );
});

test("the same poorly-active sentence is kept when the reading is says yes", () => {
  const decision = normalizeAnswers(
    {
      answers: {
        polarity: choice("affirmed", 0.51),
        record_kind: choice("fact", 0.69),
      },
    },
    "U007",
  );
  assert.deepEqual(reviewReasons(decision, false, "fluconazole is poorly active (MIC90 64)."), []);
});

test("no label waits", () => {
  const decision = normalizeAnswers(
    {
      answers: {
        polarity: choice("unclear", 0.9),
        record_kind: choice("none", 0.92),
      },
    },
    "U004",
  );
  assert.deepEqual(reviewReasons(decision, false), ["unclear"]);
});
