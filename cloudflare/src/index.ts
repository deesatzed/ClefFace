import type { Env } from "./env.ts";
import { handleExtract, handleGet, type ExtractBody } from "./ingest.ts";
import { handleMcp } from "./mcp.ts";
import { IdRegistry } from "./registry.ts";

export { IdRegistry };

/**
 * Public surface: POST /extract, GET /jobs/:id, and POST|GET /mcp.
 * /mcp is a tool server. It quotes the accepted ledger. It is not a chat model.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") return handleMcp(request, env);
    if (request.method === "POST" && url.pathname === "/extract") {
      let body: ExtractBody;
      try {
        body = (await request.json()) as ExtractBody;
      } catch {
        return Response.json({ error: "bad_json" }, { status: 400 });
      }
      return handleExtract(env, body);
    }
    if (request.method === "GET" && url.pathname.startsWith("/jobs/")) {
      const id = decodeURIComponent(url.pathname.slice("/jobs/".length));
      if (!id) return Response.json({ error: "not_found" }, { status: 404 });
      return handleGet(env, id);
    }
    return Response.json({ error: "not_found" }, { status: 404 });
  },
};