import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReplayArtifact } from "./artifacts.ts";
import { featuredSeed } from "./fixtures.ts";
import { simulatedResponses } from "./providers.ts";
import { renderReplayReport } from "./report.ts";

describe("replay report", () => {
  it("is standalone and makes simulated provenance explicit", () => {
    const seed = featuredSeed();
    const report = renderReplayReport(createReplayArtifact(seed.experiment, seed.cases, seed.cases.flatMap(simulatedResponses), "2026-10-02T00:00:00.000Z"));
    assert.match(report, /<!doctype html>/i);
    assert.match(report, /simulated/);
    assert.match(report, /not evidence of internal beliefs/);
    assert.doesNotMatch(report, /<script/i);
  });
});
