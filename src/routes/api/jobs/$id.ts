import { createFileRoute } from "@tanstack/react-router";
import { jobStore } from "@/lib/extract-store";

export const Route = createFileRoute("/api/jobs/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const job = jobStore.get(params.id);
        if (!job) return Response.json({ error: "not_found" }, { status: 404 });
        return Response.json({
          id: job.id,
          status: job.status,
          engine: job.engine,
          threshold: job.threshold,
          output: job.output,
          review_queue: job.review,
        });
      },
    },
  },
});
