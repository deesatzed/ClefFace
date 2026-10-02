import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyPatch,
  createCase,
  createExperiment,
  createSourceVersion,
  sha256,
  validateCase,
} from "./core.ts";
import { buildSeedExperiments } from "./fixtures.ts";

describe("experiment core", () => {
  const source = "Files larger than 10 MB require review. Exactly 10 MB does not.";

  it("normalizes source and creates stable content-addressed versions", () => {
    const first = createSourceVersion("  Files   larger than 10 MB require review.\n");
    const second = createSourceVersion("Files larger than 10 MB require review.");
    assert.equal(first.normalized, second.normalized);
    assert.equal(first.id, second.id);
    assert.match(first.sha256, /^[a-f0-9]{64}$/);
    assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("applies an exact patch and preserves the original source", () => {
    const start = source.indexOf("10 MB");
    const patch = { start, end: start + 2, replacement: "5" };
    const changed = applyPatch(source, patch);
    assert.equal(changed, "Files larger than 5 MB require review. Exactly 10 MB does not.");
    assert.equal(source, "Files larger than 10 MB require review. Exactly 10 MB does not.");
  });

  it("rejects patches whose source span does not match", () => {
    assert.throws(
      () => applyPatch(source, { start: 19, end: 21, replacement: "5", expected: "99" }),
      /patch mismatch/,
    );
  });

  it("requires a finite answer schema and valid expected answers", () => {
    assert.throws(
      () =>
        createExperiment({
          title: "Missing answer",
          source,
          question: "Does 8 MB require review?",
          answers: ["yes", "no"],
        }),
      /insufficient_evidence/,
    );

    const experiment = createExperiment({
      title: "Threshold test",
      source,
      question: "Does 8 MB require review?",
      answers: ["yes", "no", "insufficient_evidence"],
    });
    const item = createCase(experiment, {
      id: "threshold-change",
      category: "meaning_change",
      patch: { start: source.indexOf("10 MB"), end: source.indexOf("10 MB") + 2, replacement: "5", expected: "10" },
      expectedBaseline: "no",
      expectedVariant: "yes",
      rationale: "Changing the threshold from 10 to 5 changes the status of an 8 MB file.",
    });
    assert.equal(validateCase(experiment, item).valid, true);
    assert.equal(item.parentExperimentId, experiment.id);
  });

  it("ships twelve hand-validated synthetic seed cases", () => {
    const seeds = buildSeedExperiments();
    assert.equal(seeds.length, 4);
    const cases = seeds.flatMap((seed) => seed.cases);
    assert.equal(cases.length, 12);
    assert.equal(cases.filter((item) => item.category === "evidence_removal").length, 4);
    assert.ok(cases.every((item) => item.validation === "validated"));
    assert.ok(cases.every((item) => item.split === "development"));
  });
});
