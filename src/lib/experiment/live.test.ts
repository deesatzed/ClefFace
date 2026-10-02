import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_LIVE_CALL_CAP, runBoundedLivePair } from "./live.ts";
import { featuredSeed } from "./fixtures.ts";

describe("bounded live provider adapter", () => {
  const seed = featuredSeed();
  const item = seed.cases[0]!;

  it("does not call a transport without explicit confirmation", async () => {
    let calls = 0;
    await assert.rejects(() => runBoundedLivePair(seed.experiment, item, { providerId: "x", modelId: "y", confirmed: false, remainingCalls: 2 }, async () => { calls += 1; return "no"; }), /explicit confirmation/);
    assert.equal(calls, 0);
  });

  it("requires two calls within the configured cap and preserves live provenance", async () => {
    await assert.rejects(() => runBoundedLivePair(seed.experiment, item, { providerId: "x", modelId: "y", confirmed: true, remainingCalls: DEFAULT_LIVE_CALL_CAP + 1 }, async () => "no"), /call cap/);
    const result = await runBoundedLivePair(seed.experiment, item, { providerId: "local-test", modelId: "fixture", confirmed: true, remainingCalls: 2 }, async (prompt) => prompt.source.includes("5 MB") ? "yes" : "no");
    assert.deepEqual([result.evidenceKind, result.baselineAnswer, result.variantAnswer], ["live", "no", "yes"]);
  });
});
