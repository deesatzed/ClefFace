import { extractDocument } from "./engine/assemble.ts";
import type { Resolution, TableInput } from "./engine/types.ts";
import { CHAR_LIMIT, type Env } from "./env.ts";
import { loadJob } from "./compiler.ts";
import { decideUnit } from "./decision.ts";
import { reserveIds } from "./registry.ts";
import { enqueueReview } from "./review.ts";
import { segmentWithModel, type SegmentResult } from "./segmenter.ts";

export interface ExtractBody {
  text?: string;
  tables?: TableInput[];
  resolutions?: Resolution[];
}

export async function handleExtract(env: Env, body: ExtractBody): Promise<Response> {
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim() && !(body.tables && body.tables.length > 0)) {
    return json({ error: "empty_document" }, 400);
  }
  if (text.length > CHAR_LIMIT) return json({ error: "document_too_large" }, 413);
  const tables = Array.isArray(body.tables) ? body.tables : [];
  const resolutions = Array.isArray(body.resolutions) ? body.resolutions : [];
  const documentId = crypto.randomUUID();
  const segmented = await segmentWithModel(env, text, tables);
  const decisions = [];
  for (let index = 0; index < segmented.units.length; index++) {
    const unit = segmented.units[index];
    const before = segmented.units[index - 1]?.text;
    const after = segmented.units[index + 1]?.text;
    decisions.push(await decideUnit(env, unit, { before, after }));
  }
  const engine = decisions.some((item) => item.model === "clef") ? "clef" : "clef-flash";
  const job = extractDocument(text, tables, resolutions, {
    units: segmented.units,
    chunks: segmented.chunks,
    decisions,
    engine: `${engine}:${segmented.segmenter}`,
  });
  try {
    await reserveIds(env, documentId, job.state.ids_used);
  } catch (error) {
    const message = error instanceof Error ? error.message : "id_reuse";
    return json({ error: "id_reuse", detail: message }, 409);
  }
  await store(env, documentId, text, job, segmented);
  return json(envelope(documentId, job), 200);
}

export async function handleGet(env: Env, documentId: string): Promise<Response> {
  const job = await loadJob(env.DB, documentId);
  if (!job) return json({ error: "not_found" }, 404);
  return json(job, 200);
}

async function store(
  env: Env,
  documentId: string,
  text: string,
  job: ReturnType<typeof extractDocument>,
  segmented: SegmentResult,
): Promise<void> {
  const db = env.DB;
  const status = job.status;
  const payload = JSON.stringify({ output: job.output, review_queue: job.review });
  await db
    .prepare(
      `INSERT INTO documents (id, created_at, title, source_text, status, engine, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      documentId,
      new Date().toISOString(),
      job.chunks[0]?.heading ?? "Document",
      text,
      status,
      job.engine,
      payload,
    )
    .run();
  for (const [index, chunk] of segmented.chunks.entries()) {
    await db
      .prepare(
        `INSERT INTO chunks (id, document_id, ordinal, heading, word_count, body) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(`${documentId}:${chunk.id}`, documentId, index + 1, chunk.heading, chunk.word_count, chunk.text)
      .run();
  }
  const linked = new Set<string>();
  for (const quote of job.output.coverage.unassigned_quotes) {
    const unit = job.units.find((item) => item.text === quote);
    if (unit) linked.add(unit.id);
  }
  for (const unit of job.units) {
    const boilerplate = job.decisions.find((item) => item.unit_id === unit.id)?.boilerplate === "yes" ? 1 : 0;
    await db
      .prepare(
        `INSERT INTO units (id, document_id, chunk_id, ordinal, section_path, text, boilerplate, linked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        `${documentId}:${unit.id}`,
        documentId,
        unit.chunk_id,
        unit.ordinal,
        unit.section_path,
        unit.text,
        boilerplate,
        linked.has(unit.id) ? 0 : 1,
      )
      .run();
  }
  for (const decision of job.decisions) {
    const accepted = job.review.some((item) => item.unit_id === decision.unit_id) ? 0 : 1;
    await db
      .prepare(
        `INSERT INTO decisions (id, unit_id, document_id, model, confidence, accepted, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        `${documentId}:${decision.unit_id}`,
        decision.unit_id,
        documentId,
        decision.model,
        decision.confidence,
        accepted,
        JSON.stringify(decision),
      )
      .run();
  }
  for (const id of job.state.ids_used) {
    await db
      .prepare(`INSERT INTO ids (id, document_id, kind) VALUES (?, ?, ?)`)
      .bind(`${documentId}:${id}`, documentId, id.replace(/[0-9]/g, "") || "id")
      .run();
  }
  await enqueueReview(db, documentId, job.review);
}

function envelope(documentId: string, job: ReturnType<typeof extractDocument>) {
  return {
    id: documentId,
    status: job.status,
    engine: job.engine,
    output: job.output,
    review_queue: job.review,
  };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
