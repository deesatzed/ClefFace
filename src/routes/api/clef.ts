import { readFileSync } from "node:fs";
import { createFileRoute } from "@tanstack/react-router";
import { decideUnits, extractDocument, reviewReasons, segmentDocument } from "@/lib/clef";
import type { ClefRequest } from "../../../cloudflare/src/engine/clef-questions.ts";
import { findEngine } from "@/lib/decision-engines";
import { env } from "@/lib/env.server";
import type { NormalizedDecision } from "@/lib/clef";

const LOCAL_CLEF = "http://127.0.0.1:8010";
const OPENROUTER_DECISIONS = "https://openrouter.ai/api/alpha/decisions";

export const Route = createFileRoute("/api/clef")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { text?: string; engine?: string };
        try {
          body = (await request.json()) as { text?: string; engine?: string };
        } catch {
          return Response.json({ error: "That was not a document." }, { status: 400 });
        }
        const text = body.text ?? "";
        if (!text.trim()) return Response.json({ error: "Paste a document first." }, { status: 400 });
        if (text.length > 100_000) {
          return Response.json({ error: "That document is too long. The limit is 100,000 characters." }, { status: 413 });
        }
        const engine = findEngine(body.engine);
        if (!engine) return Response.json({ error: "That model is not on the list." }, { status: 400 });
        const flashUrl = env("CLEF_URL") ?? LOCAL_CLEF;
        const cloudKey = engine.leavesMachine ? openRouterKey() : "";
        if (engine.leavesMachine && !cloudKey) {
          return Response.json({ error: "No OpenRouter key on this machine." }, { status: 400 });
        }
        const { chunks, units } = segmentDocument(text, []);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (value: unknown) => {
              controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
            };
            try {
              send({ type: "start", total: units.length, engine: engine.label, leavesMachine: engine.leavesMachine });
              const decided = await decideUnits(units, {
                flashUrl,
                fullUrl: engine.leavesMachine ? undefined : env("CLEF_FULL_URL"),
                concurrency: engine.leavesMachine ? 4 : 1,
                caller: engine.model ? (requestBody) => callOpenRouter(cloudKey, engine.model as string, requestBody) : undefined,
                onDecision: (decision, index) => {
                  const unit = units[index];
                  if (!unit) return;
                  send(sentenceEvent(decision, unit.text, index, units.length));
                },
              });
              const job = extractDocument(text, [], [], {
                units,
                chunks,
                decisions: decided.decisions,
                engine: `${decided.engine}:deterministic-segment`,
              });
              send({ type: "done", status: job.status });
              controller.close();
            } catch (error) {
              const message = error instanceof Error ? error.message : "";
              const localDown =
                !engine.leavesMachine &&
                (message.includes("fetch failed") || message.includes("ECONNREFUSED") || message.startsWith("clef "));
              send({
                type: "error",
                error: localDown
                  ? "The model is not answering on port 8010. Start that server, then press Send again."
                  : engine.leavesMachine
                    ? "OpenRouter did not answer. The text was sent, and no labels came back."
                    : "The model did not return labels.",
              });
              controller.close();
            }
          },
        });
        return new Response(stream, {
          headers: {
            "content-type": "application/x-ndjson; charset=utf-8",
            "cache-control": "no-cache",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});

function openRouterKey(): string {
  const fromEnv = env("OPENROUTER_API_KEY");
  if (fromEnv) return fromEnv;
  try {
    for (const line of readFileSync("/Volumes/WS4TB/ClefExtract/.env", "utf8").split("\n")) {
      if (!line.startsWith("OPENROUTER_API_KEY=")) continue;
      return line.slice("OPENROUTER_API_KEY=".length).trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    return "";
  }
  return "";
}

async function callOpenRouter(
  key: string,
  model: string,
  body: ClefRequest,
): Promise<{ model: string; answers: Record<string, unknown> }> {
  const response = await fetch(OPENROUTER_DECISIONS, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, state: body.state, questions: body.questions }),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`clef ${response.status}: ${text.slice(0, 300)}`);
  const parsed = JSON.parse(text) as { model?: string; answers?: Record<string, unknown>; error?: { message?: string } };
  if (!parsed.answers || typeof parsed.answers !== "object") {
    throw new Error(parsed.error?.message || "clef response missing answers");
  }
  return { model: parsed.model ?? model, answers: parsed.answers };
}

function sentenceEvent(decision: NormalizedDecision, quote: string, index: number, total: number) {
  const boilerplate = decision.boilerplate === "yes";
  return {
    type: "sentence" as const,
    index: index + 1,
    total,
    quote,
    kind: decision.record_kind,
    polarity: decision.polarity,
    confidence: decision.confidence,
    boilerplate,
    waiting: !boilerplate && reviewReasons(decision, false).length > 0,
  };
}
