import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReplayArtifact, parseArtifactText, parseReplayArtifact, serializeCasesJsonl } from "./artifacts.ts";
import { featuredSeed } from "./fixtures.ts";
import { simulatedResponses } from "./providers.ts";

describe("portable replay artifacts", () => {
  const seed = featuredSeed();
  const responses = seed.cases.flatMap((item) => simulatedResponses(item));

  it("round trips canonical cases and response provenance", () => {
    const artifact = createReplayArtifact(seed.experiment, seed.cases, responses, "2026-10-02T00:00:00.000Z");
    const result = parseReplayArtifact(JSON.stringify(artifact));
    assert.deepEqual(result.errors, []);
    assert.equal(result.artifact?.experiment.source.sha256, seed.experiment.source.sha256);
    assert.equal(result.artifact?.cases.length, 3);
    assert.equal(result.artifact?.responses.filter((item) => item.evidenceKind === "simulated").length, 6);
  });

  it("rejects malformed and schema-incompatible imports", () => {
    assert.deepEqual(parseReplayArtifact("{").errors, ["Expected property name or '}' in JSON at position 1 (line 1 column 2)"]);
    assert.deepEqual(parseReplayArtifact(JSON.stringify({ kind: "other", schemaVersion: "x" })).errors, ["unsupported artifact kind"]);
  });

  it("round trips individual cases through JSONL", () => {
    const artifact = createReplayArtifact(seed.experiment, seed.cases, responses, "2026-10-02T00:00:00.000Z");
    const parsed = parseArtifactText(serializeCasesJsonl(artifact));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.artifact?.cases.length, 3);
    assert.equal(parsed.artifact?.responses.length, 6);
  });
});
