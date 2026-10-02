/**
 * Classify one document with a local Clef server.
 * Start the server first:
 *   python clef_mlx.py serve --model mlx-community/clef-flash-4bit --port 8000
 * Optional second server for escalation: CLEF_FULL_URL=http://127.0.0.1:8001
 */
import { writeFileSync } from "node:fs";
import { decideUnits } from "../src/engine/decide-http.ts";
import { extractDocument, SAMPLE_DOCUMENT } from "../src/engine/index.ts";
import { segmentDocument } from "../src/engine/segment.ts";

const flashUrl = process.env.CLEF_URL ?? "http://127.0.0.1:8010";
const text = process.argv[2] ?? SAMPLE_DOCUMENT;
const { chunks, units } = segmentDocument(text, []);
const decided = await decideUnits(units, { flashUrl, fullUrl: process.env.CLEF_FULL_URL });
const job = extractDocument(text, [], [], {
  units,
  chunks,
  decisions: decided.decisions,
  engine: `${decided.engine}:deterministic-segment`,
});
const summary = {
  engine: job.engine,
  status: job.status,
  escalated_without_full_model: process.env.CLEF_FULL_URL ? [] : decided.escalated,
  escalated: decided.escalated,
  counts: {
    units: units.length,
    facts: job.output.facts.length,
    theories: job.output.theories.length,
    concepts: job.output.concepts.length,
    workflows: job.output.workflows.length,
    relations: job.output.relations.length,
    review: job.review.length,
  },
};
writeFileSync("/tmp/clef-extract-real.json", JSON.stringify({ summary, output: job.output, review: job.review }, null, 2));
console.log(JSON.stringify(summary, null, 2));
