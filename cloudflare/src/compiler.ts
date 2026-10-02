import type { D1Database } from "./env.ts";
import type { ExtractionOutput, ReviewItem } from "./engine/types.ts";

export interface StoredJob {
  id: string;
  status: "complete" | "needs_review";
  engine: string;
  output: ExtractionOutput;
  review_queue: ReviewItem[];
}

/** Reads the compiled JSON written by ingest. Does not invent rows. */
export async function loadJob(db: D1Database, documentId: string): Promise<StoredJob | null> {
  const row = await db
    .prepare(`SELECT id, status, engine, result_json FROM documents WHERE id = ?`)
    .bind(documentId)
    .first<{ id: string; status: string; engine: string; result_json: string | null }>();
  if (!row || !row.result_json) return null;
  const parsed = JSON.parse(row.result_json) as { output: ExtractionOutput; review_queue: ReviewItem[] };
  const status = row.status === "complete" ? "complete" : "needs_review";
  return { id: row.id, status, engine: row.engine, output: parsed.output, review_queue: parsed.review_queue };
}
