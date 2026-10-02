import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { takeLines } from "./clef-lines.ts";

describe("clef stream lines", () => {
  it("keeps a partial line until the newline arrives", () => {
    const first = takeLines("", '{"type":"start"');
    assert.deepEqual(first.lines, []);
    assert.equal(first.rest, '{"type":"start"');
    const second = takeLines(first.rest, ',"total":2}\n{"type":"sentence"');
    assert.deepEqual(second.lines, ['{"type":"start","total":2}']);
    assert.equal(second.rest, '{"type":"sentence"');
  });
});
