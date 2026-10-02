import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractDocument } from "./assemble.ts";
import { CLEF_QUESTIONS } from "./clef-questions.ts";
import { chunkDocument } from "./chunk.ts";
import { SAMPLE_DOCUMENT } from "./sample.ts";
import { MemoryRegistry, echoState, emptyState } from "./text.ts";

describe("clef extract", () => {
  const job = extractDocument(SAMPLE_DOCUMENT);

  it("uses only noul and choice, at most 64 questions", () => {
    const questions = Object.values(CLEF_QUESTIONS);
    assert.ok(questions.length >= 7 && questions.length <= 64);
    for (const question of questions) {
      assert.ok(question.type === "noul" || question.type === "choice");
    }
  });

  it("is stable across a second run", () => {
    const again = extractDocument(SAMPLE_DOCUMENT);
    assert.deepEqual(again.output, job.output);
    assert.deepEqual(again.state.ids_used, job.state.ids_used);
  });

  it("keeps quotes as exact substrings and separates facts from theories", () => {
    for (const fact of job.output.facts) {
      assert.equal(SAMPLE_DOCUMENT.includes(fact.evidence_quote), true);
      assert.equal(SAMPLE_DOCUMENT.includes(fact.statement), true);
      assert.ok(fact.polarity === "affirmed" || fact.polarity === "denied" || fact.polarity === "conditional");
    }
    for (const concept of job.output.concepts) {
      if (concept.definition_present === "yes") {
        assert.equal(SAMPLE_DOCUMENT.includes(concept.definition_quote), true);
      }
    }
    assert.deepEqual(
      job.output.theories.map((theory) => theory.claim),
      [
        "The night gap may delay antibiotics.",
        "This reading is an interpretation of the log, not a controlled trial.",
      ],
    );
    const quotes = new Set(job.output.facts.map((fact) => fact.evidence_quote));
    for (const item of job.review) {
      assert.equal(quotes.has(item.quote), false);
    }
  });

  it("labels the standing facts", () => {
    const logged = job.output.facts.find((fact) => fact.statement.includes("42 callbacks"));
    const staffed = job.output.facts.find((fact) => fact.statement.includes("does not staff"));
    const optional = job.output.facts.find((fact) => fact.statement.includes("not optional"));
    const site = job.output.facts.find((fact) => fact.statement.includes("on site"));
    assert.equal(logged?.polarity, "affirmed");
    assert.equal(logged?.time_scope, "past");
    assert.equal(logged?.quantity_present, "yes");
    assert.equal(logged?.deterministic, "yes");
    assert.equal(staffed?.polarity, "denied");
    assert.equal(staffed?.quantity_present, "no");
    assert.equal(job.output.facts.filter((fact) => fact.statement.includes("does not staff")).length, 1);
    assert.equal(optional?.polarity, "conditional");
    assert.equal(site?.time_scope, "present");
  });

  it("extracts defined concepts", () => {
    const score = job.output.concepts.find((concept) => concept.term.toLowerCase() === "trigger score");
    const callback = job.output.concepts.find((concept) => concept.term.toLowerCase().includes("deterioration callback"));
    assert.equal(score?.type, "metric");
    assert.equal(score?.definition_present, "yes");
    assert.equal(callback?.type, "process");
    assert.equal(callback?.definition_present, "yes");
  });

  it("keeps the procedure in order and leaves it incomplete", () => {
    assert.equal(job.output.workflows.length, 1);
    const workflow = job.output.workflows[0];
    assert.deepEqual(workflow.steps.map((step) => step.order), [1, 2, 3, 4, 5]);
    assert.equal(workflow.fully_specified, "no");
    assert.equal(workflow.end_condition, "unspecified");
    assert.notEqual(workflow.trigger, "unspecified");
    assert.equal(workflow.tools_mentioned, "no");
    assert.ok(workflow.steps.every((step) => step.actor !== "unspecified" && step.order > 0));
    assert.equal(workflow.steps.find((step) => step.order === 3)?.decision, "yes");
    assert.equal(workflow.steps.find((step) => step.order === 1)?.decision, "no");
  });

  it("links the contradiction instead of merging it", () => {
    const link = job.output.relations.find((relation) => relation.relation === "contradicts");
    assert.ok(link);
    const ids = new Set(job.output.facts.map((fact) => fact.id));
    assert.equal(ids.has(link.source_id), true);
    assert.equal(ids.has(link.target_id), true);
    assert.notEqual(link.source_id, link.target_id);
    assert.ok(job.output.relations.some((relation) => relation.relation === "part_of"));
    assert.equal(job.state.open_questions.length, 0);
  });

  it("holds unclear rows and closes the gate only after a human accepts them", () => {
    assert.equal(job.review.length, 1);
    assert.equal(job.review[0]?.reasons.includes("conflict"), true);
    assert.equal(job.status, "needs_review");
    assert.equal(
      job.output.coverage.segments_classified + job.output.coverage.unassigned_quotes.length,
      job.output.coverage.segments_total,
    );
    assert.deepEqual(
      job.output.coverage.unassigned_quotes,
      job.review.map((item) => item.quote),
    );
    const done = extractDocument(
      SAMPLE_DOCUMENT,
      [],
      job.review.map((item) => ({ unit_id: item.unit_id, action: "accept" as const })),
    );
    assert.equal(done.status, "complete");
    assert.equal(done.output.coverage.unassigned_quotes.length, 0);
    assert.ok(done.output.theories.length >= 2);
    assert.equal(done.output.facts.map((fact) => fact.id).join(","), job.output.facts.map((fact) => fact.id).join(","));
    assert.equal(done.output.theories.some((theory) => theory.falsifiable === "unclear"), true);
  });

  it("chunks long text on headings inside the word window", () => {
    const block = (word: string) => Array.from({ length: 1800 }, () => word).join(" ");
    const chunks = chunkDocument(`# One\n\n${block("alpha")}\n\n# Two\n\n${block("beta")}`);
    assert.equal(chunks.length, 2);
    assert.ok(chunks.every((chunk) => chunk.word_count <= 2600));
  });

  it("rejects a reused id and a dropped id", () => {
    const registry = new MemoryRegistry();
    registry.issue("doc", "F001");
    assert.throws(() => registry.issue("doc", "F001"), /id reuse rejected/);
    assert.throws(() => echoState({ ...emptyState(), ids_used: ["U001"] }, emptyState()), /state echo failed/);
  });

  it("keeps ids unique", () => {
    assert.equal(new Set(job.state.ids_used).size, job.state.ids_used.length);
  });
});
