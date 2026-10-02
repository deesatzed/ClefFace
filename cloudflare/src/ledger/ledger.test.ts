import assert from "node:assert/strict";
import test from "node:test";
import { extractDocument, SAMPLE_DOCUMENT } from "../engine/index.ts";
import { answerQuestion } from "./answer.ts";
import { dot, embedText } from "./embed.ts";
import { dispatch } from "./mcp.ts";
import { projectLedger, type LedgerSource } from "./project.ts";

function sourceFromSample(): LedgerSource {
  const job = extractDocument(SAMPLE_DOCUMENT);
  return {
    id: job.id,
    status: job.status,
    engine: job.engine,
    title: job.chunks[0]?.heading || "Ward callback drill",
    review_count: job.review.length,
    output: job.output,
  };
}

test("accepted projection drops held theory wording", () => {
  const job = extractDocument(SAMPLE_DOCUMENT);
  const view = projectLedger(sourceFromSample());
  const blob = JSON.stringify(view.records);
  assert.ok(job.review.length > 0);
  assert.equal(view.review_count, job.review.length);
  assert.equal(blob.includes("may delay antibiotics"), false);
  assert.equal(view.status, "needs_review");
});

test("night staffing stays a conflict and both quotes survive", () => {
  const view = projectLedger(sourceFromSample());
  const answer = answerQuestion("Is a physician inside the building at night?", [view]);
  assert.equal(answer.stance, "conflict");
  assert.equal(answer.gate, "held");
  const quotes = answer.hits.map((hit) => hit.quote).join("\n");
  assert.match(quotes, /does not staff a physician/i);
  assert.match(quotes, /arrived in person/i);
  assert.equal(quotes.includes("may delay antibiotics"), false);
});

test("a question the accepted ledger does not answer stays unspecified", () => {
  const view = projectLedger(sourceFromSample());
  const answer = answerQuestion("Which antibiotic should be started for a night delay?", [view]);
  assert.equal(answer.stance, "unspecified");
  assert.equal(answer.hits.length, 0);
  assert.match(answer.text, /does not say/);
});

test("definition lookup quotes the source sentence", () => {
  const view = projectLedger(sourceFromSample());
  const answer = answerQuestion("What is a deterioration callback?", [view]);
  assert.equal(answer.stance, "grounded");
  assert.match(answer.hits[0]?.quote ?? "", /phone call from the ward nurse/);
});

test("hashed vectors agree with themselves more than with an unrelated line", () => {
  const same = dot(embedText("ward nurse callback physician"), embedText("callback from the ward nurse to the physician"));
  const other = dot(embedText("ward nurse callback physician"), embedText("quarterly invoice for linen"));
  assert.ok(same > other);
});

test("MCP quote_answer omits held rows and lists tools", async () => {
  const view = projectLedger(sourceFromSample());
  const listed = await dispatch({ jsonrpc: "2.0", id: 1, method: "tools/list" }, emptyCorpus());
  const tools = (listed?.result as { tools: { name: string }[] }).tools.map((tool) => tool.name);
  assert.deepEqual(tools, ["list_versions", "job_status", "lookup", "quote_answer", "ingest_document"]);
  const reply = await dispatch(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "quote_answer", arguments: { query: "Which antibiotic should be started?" } },
    },
    {
      async list() {
        return [];
      },
      async load() {
        return view;
      },
      async loadAll() {
        return [view];
      },
    },
  );
  const text = (reply?.result as { content: { text: string }[] }).content[0].text;
  assert.equal(text.includes("may delay antibiotics"), false);
  assert.match(text, /does not say/);
});

function emptyCorpus() {
  return {
    async list() {
      return [];
    },
    async load() {
      return null;
    },
    async loadAll() {
      return [];
    },
  };
}
