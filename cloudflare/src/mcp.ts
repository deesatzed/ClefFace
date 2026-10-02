import type { Env } from "./env.ts";
import { loadJob } from "./compiler.ts";
import { handleExtract } from "./ingest.ts";
import { mcpResponse, type Corpus, type VersionSummary } from "./ledger/mcp.ts";
import { projectLedger, type LedgerSource } from "./ledger/project.ts";

interface DocRow {
  id: string;
  title: string | null;
  status: string;
  engine: string;
  created_at: string;
  result_json: string | null;
}

export async function handleMcp(request: Request, env: Env): Promise<Response> {
  return mcpResponse(request, corpus(env));
}

function corpus(env: Env): Corpus {
  return {
    async list() {
      const rows = await rowsOf(env);
      return rows.map(summaryOf).filter((item): item is VersionSummary => item !== null);
    },
    async load(versionId: string) {
      const job = await loadJob(env.DB, versionId);
      if (!job) return null;
      const row = await env.DB
        .prepare(`SELECT id, title, created_at FROM documents WHERE id = ?`)
        .bind(versionId)
        .first<{ id: string; title: string | null; created_at: string }>();
      return projectLedger(storedSource(job, row?.title, row?.created_at));
    },
    async loadAll() {
      const views = [];
      for (const row of await rowsOf(env)) {
        const source = sourceFromRow(row);
        if (source) views.push(projectLedger(source));
      }
      return views;
    },
    async ingest(text: string) {
      const response = await handleExtract(env, { text });
      const body = (await response.json()) as { id?: string; status?: string; review_queue?: unknown[]; error?: string };
      if (!response.ok || !body.id) throw new Error(body.error || "ingest_failed");
      const status = body.status === "complete" ? "complete" : "needs_review";
      return {
        version_id: body.id,
        status,
        review_count: Array.isArray(body.review_queue) ? body.review_queue.length : 0,
      };
    },
  };
}

async function rowsOf(env: Env): Promise<DocRow[]> {
  const listed = await env.DB.prepare(
    `SELECT id, title, status, engine, created_at, result_json
     FROM documents ORDER BY created_at DESC LIMIT 40`,
  ).all<DocRow>();
  return listed.results ?? [];
}

function summaryOf(row: DocRow): VersionSummary | null {
  const source = sourceFromRow(row);
  if (!source) return null;
  const view = projectLedger(source);
  return {
    version_id: view.version_id,
    title: view.title,
    status: view.status,
    engine: view.engine,
    created_at: view.created_at,
    review_count: view.review_count,
    segments_total: view.segments_total,
    segments_classified: view.segments_classified,
    unassigned: view.unassigned,
  };
}

function sourceFromRow(row: DocRow): LedgerSource | null {
  if (!row.result_json) return null;
  try {
    const parsed = JSON.parse(row.result_json) as { output?: LedgerSource["output"]; review_queue?: unknown[] };
    if (!parsed.output) return null;
    return storedSource(
      {
        id: row.id,
        status: row.status === "complete" ? "complete" : "needs_review",
        engine: row.engine,
        output: parsed.output,
        review_queue: parsed.review_queue ?? [],
      },
      row.title,
      row.created_at,
    );
  } catch {
    return null;
  }
}

function storedSource(
  job: {
    id: string;
    status: "complete" | "needs_review";
    engine: string;
    output: LedgerSource["output"];
    review_queue: unknown[];
  },
  title?: string | null,
  createdAt?: string,
): LedgerSource {
  return {
    id: job.id,
    status: job.status,
    engine: job.engine,
    title: title || undefined,
    created_at: createdAt,
    review_count: job.review_queue.length,
    output: job.output,
  };
}
