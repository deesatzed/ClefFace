import { createFileRoute } from "@tanstack/react-router";
import { decideUnits, extractDocument, segmentDocument, type Resolution, type TableInput } from "@/lib/clef";
import { jobStore } from "@/lib/extract-store";
import { env } from "@/lib/env.server";

export const Route = createFileRoute("/api/extract")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { text?: string; tables?: TableInput[]; resolutions?: Resolution[] };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "bad_json" }, { status: 400 });
        }
        const text = body.text ?? "";
        if (text.length > 100_000) return Response.json({ error: "document_too_large" }, { status: 413 });
        try {
          const tables = body.tables ?? [];
          const resolutions = body.resolutions ?? [];
          const clefUrl = env("CLEF_URL");
          const job = clefUrl
            ? await jobFromClef(text, tables, resolutions, clefUrl, env("CLEF_FULL_URL"))
            : extractDocument(text, tables, resolutions);
          jobStore.set(job.id, job);
          return Response.json({
            id: job.id,
            status: job.status,
            engine: job.engine,
            threshold: job.threshold,
            output: job.output,
            review_queue: job.review,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "extract_failed";
          const status = message === "empty_document" ? 400 : message.startsWith("clef ") ? 502 : 500;
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});

async function jobFromClef(
  text: string,
  tables: TableInput[],
  resolutions: Resolution[],
  flashUrl: string,
  fullUrl: string | undefined,
) {
  const { chunks, units } = segmentDocument(text, tables);
  const decided = await decideUnits(units, { flashUrl, fullUrl });
  return extractDocument(text, tables, resolutions, {
    units,
    chunks,
    decisions: decided.decisions,
    engine: `${decided.engine}:deterministic-segment`,
  });
}
