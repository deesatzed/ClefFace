import type { Env } from "./env.ts";

/**
 * Global id registry. Keys are `${documentId}:${localId}`.
 * Local ids (F001) may repeat across documents. Reuse inside one document is rejected.
 * Assumption: Durable Object SQLite storage (`ctx.storage.sql`) matches compatibility_date 2026-10-01.
 */
export class IdRegistry extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS issued (
          key TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          local_id TEXT NOT NULL
        )`,
      );
    });
  }

  async fetch(request: Request): Promise<Response> {
    const body = (await request.json()) as { document_id?: string; ids?: string[] };
    const documentId = body.document_id ?? "";
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!documentId || ids.length === 0) {
      return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
    }
    const reused: string[] = [];
    await this.ctx.blockConcurrencyWhile(async () => {
      for (const id of ids) {
        const key = `${documentId}:${id}`;
        const existing = this.ctx.storage.sql.exec("SELECT key FROM issued WHERE key = ?", key).toArray();
        if (existing.length > 0) reused.push(id);
      }
      if (reused.length > 0) return;
      for (const id of ids) {
        const key = `${documentId}:${id}`;
        this.ctx.storage.sql.exec(
          "INSERT INTO issued (key, document_id, local_id) VALUES (?, ?, ?)",
          key,
          documentId,
          id,
        );
      }
    });
    if (reused.length > 0) return Response.json({ ok: false, reused }, { status: 409 });
    return Response.json({ ok: true });
  }
}

export async function reserveIds(env: Env, documentId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const stub = env.REGISTRY.get(env.REGISTRY.idFromName("clef-ids"));
  const response = await stub.fetch("https://registry/issue", {
    method: "POST",
    body: JSON.stringify({ document_id: documentId, ids }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`id registry rejected the set: ${detail}`);
  }
}
