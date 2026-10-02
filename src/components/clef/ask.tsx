import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/lib/clef";
import { answerQuestion, embedText, hitKey, projectLedger, type LedgerAnswer, type LedgerView } from "@/lib/ledger";
import { EMBED_DIM } from "../../../cloudflare/src/ledger/embed.ts";
import { ledgerBridge } from "@/lib/ledger/bridge";
import { rankOnGpu, webGpuAvailable } from "@/lib/ledger/gpu";
import type { LocalVersion } from "@/lib/ledger/vault";

const stamp = "min-h-11 bg-stamp px-4 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50";
const ghost = "min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink hover:border-stamp disabled:opacity-50";

const PROMPTS = [
  "What is a deterioration callback?",
  "Is a physician inside the building at night?",
  "Which antibiotic should be started for a night delay?",
];

type GpuState = "idle" | "working" | "ready" | "unsupported" | "failed";

export function Ask({ job, versions }: { job: Job; versions: LocalVersion[] }) {
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<"current" | "saved">("current");
  const [answer, setAnswer] = useState<LedgerAnswer | null>(null);
  const [gpu, setGpu] = useState<GpuState>("idle");
  const [gpuKey, setGpuKey] = useState("");
  const [copied, setCopied] = useState(false);

  const views = useMemo(() => viewsFor(job, versions, scope), [job, versions, scope]);
  const fingerprint = views.map((view) => view.version_id).join(",");

  useEffect(() => {
    ledgerBridge.views = views;
  }, [views]);

  useEffect(() => {
    setGpu("idle");
    setGpuKey("");
  }, [fingerprint]);

  async function ask(next = question) {
    const trimmed = next.trim();
    setQuestion(next);
    if (!trimmed) {
      setAnswer(answerQuestion("", views));
      return;
    }
    let scores: Map<string, number> | null = null;
    if (gpu === "ready" && gpuKey === fingerprint) {
      scores = await scoreViews(views, trimmed);
    }
    setAnswer(answerQuestion(trimmed, views, scores));
  }

  async function indexOnDevice() {
    setGpu("working");
    const available = await webGpuAvailable();
    if (!available) {
      setGpu("unsupported");
      return;
    }
    try {
      const packed = pack(views);
      if (packed.count === 0) {
        setGpu("failed");
        return;
      }
      await rankOnGpu(packed.docs, embedText("ledger"), packed.count);
      setGpuKey(fingerprint);
      setGpu("ready");
    } catch {
      setGpu("failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-line bg-card p-4">
        <h2 className="font-display text-2xl text-ink">Ask the ledger</h2>
        <p className="mt-2 text-sm text-muted">
          A reply is accepted quotes, or a refusal. Held rows stay out. Nothing here writes a new clinical fact.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void ask();
          }}
        >
          <label className="block text-sm text-muted">
            Question
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              aria-label="Question for the ledger"
              className="mt-1 h-24 w-full resize-y border border-line bg-paper p-3 text-sm text-ink"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={stamp}>
              Ask the ledger
            </button>
            <button type="button" className={ghost} onClick={() => void indexOnDevice()} disabled={gpu === "working"}>
              {gpu === "working" ? "Indexing" : "Rank on this device"}
            </button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((prompt) => (
            <button key={prompt} type="button" className={`${ghost} max-w-full text-left`} onClick={() => void ask(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">{gpuLabel(gpu)}</p>
      </div>

      <fieldset className="border border-line bg-card p-4">
        <legend className="px-1 text-sm text-muted">Versions on this device</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={scope === "current" ? stamp : ghost}
            onClick={() => setScope("current")}
          >
            This extract
          </button>
          <button type="button" className={scope === "saved" ? stamp : ghost} onClick={() => setScope("saved")}>
            Every saved version
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {versions.length === 0 ? (
            <li className="text-sm text-muted">This extract is kept in the page. A second paste becomes the next version.</li>
          ) : (
            versions.map((version, index) => (
              <li key={version.version_id} className="font-mono text-xs text-ink">
                v{index + 1} {version.title} · {version.status === "complete" ? "gate closed" : "gate held"} ·{" "}
                {version.review_count} held
                {version.parent_version_id ? " · follows a prior version" : ""}
              </li>
            ))
          )}
        </ul>
      </fieldset>

      {answer ? <AnswerCard answer={answer} /> : null}

      <div className="border border-line bg-card p-4">
        <h3 className="font-display text-lg text-ink">Connect a chatbot</h3>
        <p className="mt-2 text-sm text-muted">
          Streamable HTTP MCP at <span className="font-mono text-ink">/api/mcp</span>. Tools are list_versions,
          job_status, lookup, quote_answer, and ingest_document. quote_answer is the same refusal rules as this panel.
          Chrome WebMCP, when the browser exposes it, registers quote_ledger on this page. Do not send patient identifiers.
        </p>
        <button
          type="button"
          className={`${ghost} mt-3`}
          onClick={() => {
            const body = JSON.stringify(
              { mcpServers: { "clef-ledger": { url: `${window.location.origin}/api/mcp` } } },
              null,
              2,
            );
            void navigator.clipboard?.writeText(body);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy MCP config"}
        </button>
      </div>
    </div>
  );
}

function AnswerCard({ answer }: { answer: LedgerAnswer }) {
  const tone =
    answer.stance === "conflict" ? "border-l-review" : answer.stance === "grounded" ? "border-l-stamp" : "border-l-line";
  return (
    <div className={`border border-line border-l-2 ${tone} bg-card p-4`}>
      <p className="font-mono text-xs uppercase text-muted">
        {answer.stance} · gate {answer.gate} · {answer.scorer === "webgpu" ? "re-ranked on WebGPU" : "matched by words"}
      </p>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{answer.text}</pre>
      {answer.hits.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {answer.hits.map((hit) => (
            <li key={`${hit.version_id}-${hit.record_id}`}>
              <p className="font-mono text-xs text-muted">
                {hit.record_id} · {hit.kind} · {hit.label}
              </p>
              <blockquote className="mt-1 border-l-2 border-line pl-3 font-mono text-sm text-ink">{hit.quote}</blockquote>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function viewsFor(job: Job, versions: LocalVersion[], scope: "current" | "saved"): LedgerView[] {
  if (scope === "current") return [projectJob(job)];
  const saved = versions.map((version) => projectJob(version.job));
  if (!saved.some((view) => view.version_id === job.id)) saved.push(projectJob(job));
  return saved;
}

function projectJob(job: Job): LedgerView {
  return projectLedger({
    id: job.id,
    status: job.status,
    engine: job.engine,
    title: job.chunks[0]?.heading || "Document",
    review_count: job.review.length,
    output: job.output,
  });
}

function gpuLabel(gpu: GpuState): string {
  if (gpu === "ready") return "WebGPU index is ready. The next question reranks overlapping quotes on this device. It cannot add a record the words do not already support.";
  if (gpu === "unsupported") return "WebGPU is not available here. Word match still answers.";
  if (gpu === "failed") return "The on-device index did not start. Word match still answers.";
  if (gpu === "working") return "Building the on-device index.";
  return "Word match is the default. Rank on this device only reorders quotes that already overlap the question.";
}

async function scoreViews(views: LedgerView[], query: string): Promise<Map<string, number> | null> {
  const packed = pack(views);
  if (packed.count === 0) return null;
  try {
    const dots = await rankOnGpu(packed.docs, embedText(query), packed.count);
    const scores = new Map<string, number>();
    packed.keys.forEach((key, index) => scores.set(key, dots[index] ?? 0));
    return scores;
  } catch {
    return null;
  }
}

function pack(views: LedgerView[]): { docs: Float32Array; keys: string[]; count: number } {
  const records = views.flatMap((view) =>
    view.records.map((record) => ({
      key: hitKey(view.version_id, record.record_id),
      vector: embedText(`${record.text} ${record.quote}`),
    })),
  );
  const docs = new Float32Array(records.length * EMBED_DIM);
  records.forEach((record, index) => docs.set(record.vector, index * EMBED_DIM));
  return { docs, keys: records.map((record) => record.key), count: records.length };
}
