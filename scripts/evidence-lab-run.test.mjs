import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

test("offline experiment runner reports explicit simulated evidence", () => {
  const output = execFileSync(process.execPath, ["--experimental-strip-types", "scripts/evidence-lab-run.mjs"], { encoding: "utf8" });
  const result = JSON.parse(output);
  assert.equal(result.cases, 3);
  assert.deepEqual(result.responseEvidence, ["simulated"]);
  assert.equal(result.models["careful-simulator"].matched, 3);
  assert.equal(result.models["wording-simulator"].matched, 2);
});

test("offline runner keeps protected split separate from the development demo", () => {
  const output = execFileSync(process.execPath, ["--experimental-strip-types", "scripts/evidence-lab-run.mjs", "--split", "protected"], { encoding: "utf8" });
  const result = JSON.parse(output);
  assert.equal(result.split, "protected");
  assert.equal(result.cases, 0);
  assert.deepEqual(result.models, {});
});
