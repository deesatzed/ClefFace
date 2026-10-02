import { createFileRoute } from "@tanstack/react-router";
import { extractDocument, type Job } from "@/lib/clef";
import { jobStore } from "@/lib/extract-store";
import { projectLedger, type LedgerSource } from "@/lib/ledger";
import { mcpResponse, type Corpus, type VersionSummary } from "../../../cloudflare/src/ledger/mcp.ts";

const seen = new Map<string, string>();

function viewOf(job: Job): ReturnType<typeof projectLedger> {
  if (!seen.has(job.id)) seen.set(job.id, new Date().toISOString());
  const source: LedgerSource = {
    id: job.id,
    status: job.status,
    engine: job.engine,
    title: job.chunks[0]?.heading || "Document",
    created_at: seen.get(job.id),
    review_count: job.review.length,
    output: job.output,
  };
  return projectLedger(source);
}

function summaryOf(job: Job): VersionSummary {
  const view = viewOf(job);
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

function corpus(): Corpus {
  return {
    async list() {
      return [...jobStore.values()].map(summaryOf);
    },
    async load(versionId: string) {
      const job = jobStore.get(versionId);
      return job ? viewOf(job) : null;
    },
    async loadAll() {
      return [...jobStore.values()].map(viewOf);
    },
    async ingest(text: string) {
      const job = extractDocument(text);
      jobStore.set(job.id, job);
      return { version_id: job.id, status: job.status, review_count: job.review.length };
    },
  };
}

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      GET: async ({ request }) => mcpResponse(request, corpus()),
      POST: async ({ request }) => mcpResponse(request, corpus()),
      OPTIONS: async ({ request }) => mcpResponse(request, corpus()),
    },
  },
});
