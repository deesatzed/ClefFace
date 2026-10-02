import { answerQuestion } from "./answer.ts";
import type { LedgerView } from "./project.ts";

export interface VersionSummary {
  version_id: string;
  title: string;
  status: "complete" | "needs_review";
  engine: string;
  created_at: string;
  review_count: number;
  segments_total: number;
  segments_classified: number;
  unassigned: number;
}

export interface IngestResult {
  version_id: string;
  status: "complete" | "needs_review";
  review_count: number;
}

export interface Corpus {
  list(): Promise<VersionSummary[]>;
  load(versionId: string): Promise<LedgerView | null>;
  loadAll(): Promise<LedgerView[]>;
  ingest?(text: string): Promise<IngestResult>;
}

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

const PROTOCOL = "2025-03-26";

export function discovery() {
  return {
    protocol: "mcp",
    transport: "streamable-http",
    protocolVersion: PROTOCOL,
    note: "Tools return accepted ledger rows only. Held rows are counted and omitted. This server does not answer from outside the ledger.",
    tools: TOOLS.map((tool) => tool.name),
  };
}

export async function mcpResponse(request: Request, corpus: Corpus): Promise<Response> {
  const headers = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, accept, mcp-protocol-version",
    "cache-control": "no-store",
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method === "GET") return Response.json(discovery(), { headers });
  if (request.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405, headers });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(rpcError(null, -32700, "parse error"), { status: 400, headers });
  }
  if (Array.isArray(body)) {
    const replies = [];
    for (const item of body) {
      const reply = await dispatch(item, corpus);
      if (reply) replies.push(reply);
    }
    if (replies.length === 0) return new Response(null, { status: 202, headers });
    return Response.json(replies, { headers });
  }
  const reply = await dispatch(body, corpus);
  if (!reply) return new Response(null, { status: 202, headers });
  return Response.json(reply, { headers });
}

export async function dispatch(message: unknown, corpus: Corpus): Promise<Record<string, unknown> | null> {
  if (!message || typeof message !== "object") return rpcError(null, -32600, "invalid request");
  const rpc = message as RpcRequest;
  const id = rpc.id ?? null;
  const method = rpc.method ?? "";
  if (!method) return rpcError(id, -32600, "invalid request");
  if (rpc.id === undefined) return null;
  if (method === "initialize") {
    const requested = protocolOf(rpc.params);
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: requested === "2025-06-18" ? requested : PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "clef-ledger", version: "1.0.0" },
        instructions:
          "Quote accepted records only. If stance is unspecified, say the document does not say. If stance is conflict, report both records. Never treat a held row as policy.",
      },
    };
  }
  if (method === "ping") return { jsonrpc: "2.0", id, result: {} };
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  if (method === "tools/call") return toolCall(id, rpc.params, corpus);
  return rpcError(id, -32601, `unknown method ${method}`);
}

async function toolCall(id: string | number | null, params: unknown, corpus: Corpus): Promise<Record<string, unknown>> {
  const name = params && typeof params === "object" ? String((params as { name?: string }).name ?? "") : "";
  const args = argumentsOf(params);
  try {
    const data = await runTool(name, args, corpus);
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: data,
        isError: false,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "tool_failed";
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: message }],
        isError: true,
      },
    };
  }
}

async function runTool(name: string, args: Record<string, unknown>, corpus: Corpus): Promise<unknown> {
  if (name === "list_versions") return { versions: await corpus.list() };
  if (name === "job_status") {
    const versionId = stringArg(args.version_id);
    if (!versionId) throw new Error("version_id is required");
    const view = await corpus.load(versionId);
    if (!view) throw new Error("not_found");
    return statusOf(view);
  }
  if (name === "lookup" || name === "quote_answer") {
    const query = stringArg(args.query);
    if (!query) throw new Error("query is required");
    const versionId = stringArg(args.version_id);
    const views = versionId ? compact(await corpus.load(versionId)) : await corpus.loadAll();
    if (versionId && views.length === 0) throw new Error("not_found");
    const answer = answerQuestion(query, views);
    if (name === "lookup") {
      return {
        stance: answer.stance,
        gate: answer.gate,
        held_records: answer.held_records,
        hits: answer.hits,
        contradictions: answer.contradictions,
      };
    }
    return answer;
  }
  if (name === "ingest_document") {
    if (!corpus.ingest) throw new Error("ingest_unavailable");
    const text = stringArg(args.text);
    if (!text.trim()) throw new Error("empty_document");
    if (text.length > 100_000) throw new Error("document_too_large");
    return corpus.ingest(text);
  }
  throw new Error(`unknown tool ${name || "(missing)"}`);
}

function statusOf(view: LedgerView) {
  return {
    version_id: view.version_id,
    title: view.title,
    status: view.status,
    engine: view.engine,
    review_count: view.review_count,
    segments_total: view.segments_total,
    segments_classified: view.segments_classified,
    unassigned: view.unassigned,
    accepted_records: view.records.length,
    note: view.review_count > 0 ? "Held rows are not returned by lookup." : "Gate closed.",
  };
}

function compact(view: LedgerView | null): LedgerView[] {
  return view ? [view] : [];
}

function stringArg(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function argumentsOf(params: unknown): Record<string, unknown> {
  if (!params || typeof params !== "object") return {};
  const raw = (params as { arguments?: unknown }).arguments;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function protocolOf(params: unknown): string {
  if (!params || typeof params !== "object") return PROTOCOL;
  const version = (params as { protocolVersion?: unknown }).protocolVersion;
  return typeof version === "string" ? version : PROTOCOL;
}

function rpcError(id: string | number | null, code: number, message: string): Record<string, unknown> {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

const TOOLS = [
  {
    name: "list_versions",
    description: "List ingested document versions. Does not return source text or held rows.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "job_status",
    description: "Coverage and review count for one version. Held rows are not policy.",
    inputSchema: {
      type: "object",
      properties: { version_id: { type: "string" } },
      required: ["version_id"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "lookup",
    description:
      "Find accepted records whose quotes overlap the question. Omits held rows. A miss means the document does not say.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        version_id: { type: "string", description: "Omit to search every ingested version." },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "quote_answer",
    description:
      "Deterministic answer made only of accepted quotes. stance is grounded, conflict, or unspecified. Do not add facts the hits do not contain.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        version_id: { type: "string" },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "ingest_document",
    description:
      "Compile a document into a ledger version. Do not send text that contains patient identifiers. Returns id and gate status, not an answer.",
    inputSchema: {
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
    },
    annotations: { readOnlyHint: false },
  },
];
