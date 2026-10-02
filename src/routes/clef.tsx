import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SAMPLE_DOCUMENT } from "@/lib/clef";
import { takeLines } from "@/lib/clef-lines";
import { DECISION_ENGINES } from "@/lib/decision-engines";

const ONE_SENTENCE = "The ward logged 42 callbacks in March 2026.";

type Kind = "fact" | "theory" | "concept" | "workflow_step" | "none";

interface LiveRow {
  quote: string;
  kind: Kind;
  polarity: string;
  confidence: number;
  boilerplate: boolean;
  cited: boolean;
  waiting: boolean;
}

interface LiveState {
  total: number;
  done: number;
  rows: LiveRow[];
  finished: boolean;
  engine: string;
  leavesMachine: boolean;
}

export const Route = createFileRoute("/clef")({
  component: ClefDesk,
  head: () => ({
    meta: [{ title: "Send a document to Clef" }],
  }),
});

function ClefDesk() {
  const [text, setText] = useState(ONE_SENTENCE);
  const [engineId, setEngineId] = useState("local");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    setLive(null);
    try {
      const response = await fetch("/api/clef", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, engine: engineId }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("ndjson") || !response.body) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not send that text.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let rest = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        const taken = takeLines(rest, decoder.decode(chunk.value, { stream: true }));
        rest = taken.rest;
        for (const line of taken.lines) applyLine(line, setLive, setError);
      }
      if (rest.trim()) applyLine(rest, setLive, setError);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send that text.");
    } finally {
      setBusy(false);
    }
  }

  const filed = live?.rows.filter((row) => !row.waiting && !row.boilerplate) ?? [];
  const held = live?.rows.filter((row) => row.waiting) ?? [];
  const skipped = live?.rows.filter((row) => row.boilerplate).length ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="border-b border-line pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">On this computer</p>
        <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">Send a document to Clef</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Paste text in the box. Press Send. Each sentence comes back as a fact, a theory, a concept, or a step.
          The page keeps it when the model can name it and read it. The score shows how sure the model is.
          A citation stays on the fact. A sentence waits when the model cannot tell, or when it says no and the sentence does not.
        </p>
      </header>

      <section className="mt-6">
        <label htmlFor="document" className="font-medium text-ink">
          Document
        </label>
        <textarea
          id="document"
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          className="mt-2 h-56 w-full resize-y border border-line bg-card p-3 text-sm leading-relaxed text-ink"
        />
        <fieldset className="mt-4">
          <legend className="font-medium text-ink">Model</legend>
          <div className="mt-2 grid gap-2">
            {DECISION_ENGINES.map((item) => (
              <label key={item.id} className="flex min-h-11 items-start gap-3 border border-line bg-card px-3 py-2">
                <input
                  type="radio"
                  name="engine"
                  value={item.id}
                  checked={engineId === item.id}
                  disabled={busy}
                  onChange={() => setEngineId(item.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{item.label}</span>
                  <span className="block text-sm text-muted">{item.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {DECISION_ENGINES.find((item) => item.id === engineId)?.leavesMachine ? (
          <p className="mt-3 text-sm text-review" role="status">
            The text in the box will be sent to OpenRouter. It will not stay only on this computer.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || text.trim().length === 0}
            className="min-h-11 bg-stamp px-4 text-sm font-medium text-paper disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => {
              setText(ONE_SENTENCE);
              setLive(null);
              setError(null);
            }}
            disabled={busy}
            className="min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink disabled:opacity-50"
          >
            One sentence
          </button>
          <button
            type="button"
            onClick={() => {
              setText(SAMPLE_DOCUMENT);
              setLive(null);
              setError(null);
            }}
            disabled={busy}
            className="min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink disabled:opacity-50"
          >
            Load the sample note
          </button>
        </div>
        {live && live.total > 0 ? (
          <div className="mt-4">
            <div
              className="h-3 w-full bg-line"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={live.total}
              aria-valuenow={live.done}
              aria-label="Sentences read"
            >
              <div className="h-3 bg-stamp" style={{ width: `${(live.done / live.total) * 100}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted" role="status">
              {live.engine ? `${live.engine}. ` : ""}
              {live.done} of {live.total} {live.total === 1 ? "sentence" : "sentences"}
              {live.finished ? "" : ". Leave this page open."}
            </p>
          </div>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-review" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {live && live.rows.length > 0 ? (
        <section className="mt-8" aria-live="polite">
          <h2 className="font-display text-2xl text-ink">What came back</h2>
          <p className="mt-1 text-sm text-muted">
            {filed.length} filed. {held.length} waiting for a person.
            {skipped > 0 ? ` ${skipped} skipped.` : ""}
          </p>

          <h3 className="mt-6 text-sm font-medium uppercase tracking-[0.12em] text-muted">Filed</h3>
          {filed.length === 0 ? (
            <p className="mt-2 border border-line bg-card p-4 text-sm text-muted">
              {live.finished ? "Nothing was filed." : "None yet."}
            </p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {filed.map((item, index) => (
                <Row
                  key={`${item.quote}-${index}`}
                  label={kindWords(item.kind)}
                  detail={`${polarityWords(item.polarity)} · ${item.confidence.toFixed(2)}${item.cited ? " · cites a source" : ""}`}
                  quote={item.quote}
                />
              ))}
            </ul>
          )}

          <h3 className="mt-6 text-sm font-medium uppercase tracking-[0.12em] text-muted">Waiting for a person</h3>
          {held.length === 0 ? (
            <p className="mt-2 border border-line bg-card p-4 text-sm text-muted">
              {live.finished ? "Nothing is waiting." : "None yet."}
            </p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {held.map((item, index) => (
                <li key={`${item.quote}-${index}`} className="border border-line bg-card p-4">
                  <p className="text-sm leading-relaxed text-ink">{item.quote}</p>
                  <p className="mt-2 font-mono text-xs text-muted">
                    Guess: {kindWords(item.kind)} · {polarityWords(item.polarity)} · {item.confidence.toFixed(2)}
                    {item.cited ? " · cites a source" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <p className="mt-8 text-sm text-muted">
        <Link to="/" className="text-stamp">
          Back to the lab
        </Link>
      </p>
    </main>
  );
}

function Row({ label, detail, quote }: { label: string; detail: string; quote: string }) {
  return (
    <li className="border border-line bg-card p-4">
      <p className="font-mono text-xs text-stamp">
        {label}
        {detail ? ` · ${detail}` : ""}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink">{quote}</p>
    </li>
  );
}

function applyLine(
  line: string,
  setLive: (value: LiveState | ((current: LiveState | null) => LiveState | null)) => void,
  setError: (value: string | null) => void,
) {
  const event = JSON.parse(line) as {
    type?: string;
    total?: number;
    engine?: string;
    leavesMachine?: boolean;
    quote?: string;
    kind?: Kind;
    polarity?: string;
    confidence?: number;
    boilerplate?: boolean;
    cited?: boolean;
    waiting?: boolean;
    error?: string;
  };
  if (event.type === "start" && typeof event.total === "number") {
    setLive({
      total: event.total,
      done: 0,
      rows: [],
      finished: false,
      engine: typeof event.engine === "string" ? event.engine : "",
      leavesMachine: Boolean(event.leavesMachine),
    });
    return;
  }
  if (event.type === "sentence" && event.quote && event.kind && event.polarity) {
    const row: LiveRow = {
      quote: event.quote,
      kind: event.kind,
      polarity: event.polarity,
      confidence: event.confidence ?? 0,
      boilerplate: Boolean(event.boilerplate),
      cited: Boolean(event.cited),
      waiting: Boolean(event.waiting),
    };
    setLive((current) => {
      const base = current ?? { total: event.total ?? 0, done: 0, rows: [], finished: false, engine: "", leavesMachine: false };
      return { ...base, total: event.total ?? base.total, done: base.done + 1, rows: [...base.rows, row] };
    });
    return;
  }
  if (event.type === "done") {
    setLive((current) => (current ? { ...current, finished: true } : current));
    return;
  }
  if (event.type === "error" && event.error) setError(event.error);
}

function kindWords(kind: Kind): string {
  if (kind === "workflow_step") return "Step";
  if (kind === "none") return "No label";
  return kind.slice(0, 1).toUpperCase() + kind.slice(1);
}

function polarityWords(polarity: string): string {
  if (polarity === "affirmed") return "says yes";
  if (polarity === "denied") return "says no";
  if (polarity === "conditional") return "only sometimes";
  if (polarity === "unclear") return "not sure";
  return polarity;
}
