import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createExploratoryArtifact } from "./authoring.ts";

describe("custom exploratory authoring", () => {
  const draft = {
    title: "Custom threshold", source: "Files over 10 MB require review.", question: "Does 12 MB require review?", answers: "yes, no, insufficient_evidence",
    target: "10", replacement: "15", category: "meaning_change" as const, expectedBaseline: "yes", expectedVariant: "no", rationale: "Increasing the threshold changes the answer.",
  };

  it("creates a portable exploratory artifact with exact patch offsets", () => {
    const artifact = createExploratoryArtifact(draft);
    assert.equal(artifact.cases[0]?.validation, "exploratory");
    assert.equal(artifact.cases[0]?.patch.expected, "10");
    assert.equal(artifact.cases[0]?.variant.normalized, "Files over 15 MB require review.");
  });

  it("rejects ambiguous target text", () => {
    assert.throws(() => createExploratoryArtifact({ ...draft, source: "10 is greater than 10.", target: "10" }), /appears more than once/);
  });
});
