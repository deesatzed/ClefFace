import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideUnits } from "./decide-http.ts";
import { CLEF_QUESTIONS } from "./clef-questions.ts";
import type { Unit } from "./types.ts";

const unit: Unit = {
  id: "U001",
  chunk_id: "K001",
  ordinal: 1,
  section_path: "Standing facts",
  text: "The ward logged 42 callbacks in March 2026.",
  from_table: false,
  list_order: null,
};

function answers(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [id, question] of Object.entries(CLEF_QUESTIONS)) {
    if (question.type === "noul") {
      out[id] = { type: "noul", noul: 0.02 };
      continue;
    }
    const keys = Object.keys(question.criteria);
    const selected = keys[0];
    out[id] = {
      type: "choice",
      choice: selected,
      confidence: 0.91,
      probabilities: Object.fromEntries(keys.map((key) => [key, key === selected ? 0.91 : 0.02])),
    };
  }
  out.record_kind = {
    type: "choice",
    choice: "fact",
    confidence: 0.93,
    probabilities: { fact: 0.93, theory: 0.02, concept: 0.02, workflow_step: 0.02, none: 0.01 },
  };
  out.polarity = {
    type: "choice",
    choice: "affirmed",
    confidence: 0.9,
    probabilities: { affirmed: 0.9, denied: 0.04, conditional: 0.04, unclear: 0.02 },
  };
  return { ...out, ...overrides };
}

function fakeFetch(payloads: Record<string, unknown>[]): typeof fetch {
  let call = 0;
  return (async () => {
    const answersBody = payloads[call];
    call += 1;
    return new Response(JSON.stringify({ model: call === 1 ? "clef-flash" : "clef", answers: answersBody }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

describe("local clef client", () => {
  it("uses a caller and keeps sentence order when two run at once", async () => {
    const second: Unit = { ...unit, id: "U002", ordinal: 2, text: "The night service does not staff a physician inside the building." };
    const calls: string[] = [];
    const result = await decideUnits([unit, second], {
      concurrency: 2,
      caller: async (body) => {
        calls.push(body.state.text);
        await new Promise((resolve) => setTimeout(resolve, body.state.unit_id === "U001" ? 30 : 1));
        return { model: "typesafe/jev-1.13", answers: answers() };
      },
    });
    assert.deepEqual(calls.sort(), [second.text, unit.text].sort());
    assert.equal(result.decisions[0]?.unit_id, "U001");
    assert.equal(result.decisions[1]?.unit_id, "U002");
    assert.equal(result.decisions[0]?.model, "typesafe/jev-1.13");
  });

  it("keeps a confident flash answer and does not call the full model", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ model: "clef-flash", answers: answers() }), { status: 200 });
    }) as typeof fetch;
    const seen: number[] = [];
    const result = await decideUnits([unit], {
      flashUrl: "http://127.0.0.1:8000",
      fullUrl: "http://127.0.0.1:8001",
      fetchImpl,
      onDecision: (_decision, index) => {
        seen.push(index);
      },
    });
    assert.equal(calls, 1);
    assert.deepEqual(seen, [0]);
    assert.deepEqual(result.escalated, []);
    assert.equal(result.decisions[0]?.record_kind, "fact");
    assert.equal(result.decisions[0]?.polarity, "affirmed");
    assert.equal(result.engine, "clef-flash");
  });

  it("asks the full model when flash polarity is unclear", async () => {
    const unclear = answers({
      polarity: {
        type: "choice",
        choice: "unclear",
        confidence: 0.88,
        probabilities: { affirmed: 0.04, denied: 0.04, conditional: 0.04, unclear: 0.88 },
      },
    });
    const fetchImpl = fakeFetch([unclear, answers()]);
    const seen: string[] = [];
    const wrapped = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(String(input));
      return fetchImpl(input, init);
    }) as typeof fetch;
    const result = await decideUnits([unit], {
      flashUrl: "http://127.0.0.1:8000",
      fullUrl: "http://127.0.0.1:8001",
      fetchImpl: wrapped,
    });
    assert.deepEqual(seen, ["http://127.0.0.1:8000/v1/systemone", "http://127.0.0.1:8001/v1/systemone"]);
    assert.deepEqual(result.escalated, ["U001"]);
    assert.equal(result.decisions[0]?.polarity, "affirmed");
    assert.equal(result.engine, "clef");
  });
});
