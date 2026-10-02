import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { featuredSeed } from "./fixtures.ts";
import { assertSplitIsolation, casesForSplit } from "./splits.ts";

describe("development and protected split separation", () => {
  it("only selects the requested split and rejects leakage", () => {
    const seed = featuredSeed();
    const protectedCase = { ...seed.cases[0]!, id: "protected-copy", split: "protected" as const };
    const all = [...seed.cases, protectedCase];
    assert.deepEqual(casesForSplit(all, "protected").map((item) => item.id), ["protected-copy"]);
    assert.throws(() => assertSplitIsolation(all, [seed.cases[0]!], "protected"), /another split/);
  });
});
