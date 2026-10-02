import { createFileRoute } from "@tanstack/react-router";
import { extractDocument, type Resolution, type TableInput } from "@/lib/clef";
import { jobStore } from "@/lib/extract-store";

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
          const job = extractDocument(text, body.tables ?? [], body.resolutions ?? []);
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
          return Response.json({ error: message }, { status: message === "empty_document" ? 400 : 500 });
        }
      },
    },
  },
});
