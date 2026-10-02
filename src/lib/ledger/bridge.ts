import { answerQuestion, type LedgerAnswer } from "../../../cloudflare/src/ledger/answer.ts";
import type { LedgerView } from "../../../cloudflare/src/ledger/project.ts";

/** Page-local tool target. WebMCP reads this at call time. */
export const ledgerBridge: { views: LedgerView[] } = { views: [] };

type ToolHost = {
  registerTool(tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: Record<string, unknown>;
    execute: (args: { query?: string }) => Promise<LedgerAnswer | { error: string }>;
  }): Promise<void>;
};

let registered = false;

export async function registerLedgerTools(): Promise<"webmcp" | "unavailable"> {
  if (registered || typeof document === "undefined") return registered ? "webmcp" : "unavailable";
  const host = modelContext();
  if (!host) return "unavailable";
  try {
    await host.registerTool({
      name: "quote_ledger",
      description:
        "Answer from the accepted Clef ledger open in this page. Quote hits only. If stance is unspecified, the document does not say. If stance is conflict, report both records. Do not use held rows.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Question about the ingested document" } },
        required: ["query"],
      },
      annotations: { readOnlyHint: true },
      execute: async ({ query }) => {
        const asked = query?.trim() ?? "";
        if (!asked) return { error: "query is required" };
        return answerQuestion(asked, ledgerBridge.views);
      },
    });
    registered = true;
    return "webmcp";
  } catch {
    return "unavailable";
  }
}

function modelContext(): ToolHost | null {
  const doc = document as Document & { modelContext?: ToolHost };
  const nav = navigator as Navigator & { modelContext?: ToolHost };
  const host = doc.modelContext ?? nav.modelContext;
  if (!host || typeof host.registerTool !== "function") return null;
  return host;
}
