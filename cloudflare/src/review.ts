import type { D1Database } from "./env.ts";
import type { ReviewItem } from "./engine/types.ts";

export async function enqueueReview(db: D1Database, documentId: string, items: ReviewItem[]): Promise<void> {
  for (const item of items) {
    await db
      .prepare(
        `INSERT INTO review_queue (id, document_id, unit_id, reason, confidence, payload, status)
         VALUES (?, ?, ?, ?, ?, ?, 'open')`,
      )
      .bind(
        `${documentId}:${item.id}`,
        documentId,
        item.unit_id,
        item.reasons.join(","),
        item.confidence,
        JSON.stringify(item),
      )
      .run();
  }
}

export async function listReview(db: D1Database, documentId: string): Promise<ReviewItem[]> {
  const rows = await db
    .prepare(
      `SELECT payload FROM review_queue WHERE document_id = ? AND status = 'open' ORDER BY id`,
    )
    .bind(documentId)
    .all<{ payload: string }>();
  return rows.results.map((row) => JSON.parse(row.payload) as ReviewItem);
}
