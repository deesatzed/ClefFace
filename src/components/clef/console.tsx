import { useEffect, useMemo, useState } from "react";
import {
  CLEF_QUESTIONS,
  CONFIDENCE_THRESHOLD,
  SAMPLE_DOCUMENT,
  buildClefRequest,
  extractDocument,
  type Job,
  type Resolution,
  type TableInput,
} from "@/lib/clef";
import { Ask } from "@/components/clef/ask";
import { STARTER_FILES } from "@/components/clef/sources";
import { ledgerBridge, registerLedgerTools } from "@/lib/ledger/bridge";
import { projectLedger } from "@/lib/ledger";
import { listVersions, saveVersion, type LocalVersion } from "@/lib/ledger/vault";

type Tab =
  | "overview"
  | "ask"
  | "concepts"
  | "facts"
  | "theories"
  | "workflows"
  | "relations"
  | "review"
  | "json"
  | "contract";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "ask", label: "Ask" },
  { id: "concepts", label: "Concepts" },
  { id: "facts", label: "Facts" },
  { id: "theories", label: "Theories" },
  { id: "workflows", label: "Workflows" },
  { id: "relations", label: "Relations" },
  { id: "review", label: "Review" },
  { id: "json", label: "JSON" },
  { id: "contract", label: "Contract" },
];

export function Console() {
  const [text, setText] = useState(SAMPLE_DOCUMENT);
  const [tableText, setTableText] = useState("");
  const [showTables, setShowTables] = useState(false);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [job, setJob] = useState<Job>(() => extractDocument(SAMPLE_DOCUMENT));
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<string | null>(null);
  const [filePath, setFilePath] = useState(STARTER_FILES[0].path);
  const [copied, setCopied] = useState("");
  const [versions, setVersions] = useState<LocalVersion[]>([]);

  const tables = useMemo(() => parseTables(tableText), [tableText]);

  useEffect(() => {
    ledgerBridge.views = [
      projectLedger({
        id: job.id,
        status: job.status,
        engine: job.engine,
        title: job.chunks[0]?.heading || "Document",
        review_count: job.review.length,
        output: job.output,
      }),
    ];
    void registerLedgerTools();
    void saveVersion(job)
      .then(() => listVersions())
      .then(setVersions)
      .catch(() => setVersions([]));
    if (text.trim() || tables.length > 0) {
      void fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, tables, resolutions }),
      }).catch(() => undefined);
    }
  }, [job, resolutions, tables, text]);

  function run(nextText = text, nextTables = tables, nextResolutions: Resolution[] = []) {
    if (!nextText.trim() && nextTables.length === 0) {
      setError("Paste a document first.");
      return;
    }
    if (nextText.length > 100_000) {
      setError("This desk reads up to 100,000 characters.");
      return;
    }
    try {
      const next = extractDocument(nextText, nextTables, nextResolutions);
      setJob(next);
      setResolutions(nextResolutions);
      setError(null);
      setTab("overview");
      void fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: nextText, tables: nextTables, resolutions: nextResolutions }),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read that document.");
    }
  }

  function resolve(unitId: string, action: Resolution["action"], polarity?: Resolution["polarity"]) {
    const next = [
      ...resolutions.filter((item) => item.unit_id !== unitId),
      { unit_id: unitId, action, polarity },
    ];
    try {
      setJob(extractDocument(text, tables, next));
      setResolutions(next);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not apply that review.");
    }
  }

  const output = JSON.stringify(job.output, null, 2);
  const file = STARTER_FILES.find((item) => item.path === filePath) ?? STARTER_FILES[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center bg-stamp font-display text-lg text-paper">C</span>
            <div>
              <h1 className="font-display text-3xl leading-none text-ink">Clef Extract</h1>
              <p className="mt-1 text-sm text-muted">Closed labels, exact quotes, a human on anything unclear.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={ghost} onClick={() => download(output)}>
            Export JSON
          </button>
          <button
            type="button"
            className={stamp}
            onClick={() => {
              void navigator.clipboard?.writeText(output);
              setCopied("json");
            }}
          >
            {copied === "json" ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="order-2 lg:sticky lg:top-4 lg:order-1 lg:self-start">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-xl text-ink">Source</h2>
            <span className="font-mono text-xs text-muted">{wordCount(text)} words</span>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") run();
            }}
            spellCheck={false}
            aria-label="Document text"
            className="h-56 w-full resize-y border border-line bg-card p-3 font-sans text-sm leading-relaxed text-ink lg:h-80"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={stamp} onClick={() => run()}>
              Extract
            </button>
            <button
              type="button"
              className={ghost}
              onClick={() => {
                setText(SAMPLE_DOCUMENT);
                setTableText("");
                run(SAMPLE_DOCUMENT, [], []);
              }}
            >
              Load sample
            </button>
            <button type="button" className={ghost} onClick={() => setShowTables((open) => !open)}>
              {showTables ? "Hide table" : "Add table"}
            </button>
          </div>
          {showTables ? (
            <label className="mt-3 block text-sm text-muted">
              Table rows, cells separated by |
              <textarea
                value={tableText}
                onChange={(event) => setTableText(event.target.value)}
                aria-label="Table rows"
                className="mt-1 h-24 w-full resize-y border border-line bg-card p-3 font-mono text-xs text-ink"
              />
            </label>
          ) : null}
          {error ? <p className="mt-3 text-sm text-review">{error}</p> : null}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            This desk runs the closed-label stand-in so you can read a document without a Cloudflare account.
            The Worker sends the same questions to Clef-flash, then full Clef when confidence is under{" "}
            {CONFIDENCE_THRESHOLD}.
          </p>
        </section>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
            {TABS.map((item) => {
              const active = tab === item.id;
              const extra = item.id === "review" && job.review.length > 0 ? ` ${job.review.length}` : "";
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`min-h-11 shrink-0 border-b-2 px-3 text-sm ${
                    active ? "border-stamp text-ink" : "border-transparent text-muted"
                  }`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                  {extra}
                </button>
              );
            })}
          </div>

          {tab === "overview" ? <Overview job={job} onReview={() => setTab("review")} /> : null}
          {tab === "ask" ? <Ask job={job} versions={versions} /> : null}
          {tab === "concepts" ? <Concepts job={job} onPick={setSelected} selected={selected} /> : null}
          {tab === "facts" ? <Facts job={job} onPick={setSelected} selected={selected} /> : null}
          {tab === "theories" ? <Theories job={job} /> : null}
          {tab === "workflows" ? <Workflows job={job} /> : null}
          {tab === "relations" ? <Relations job={job} /> : null}
          {tab === "review" ? <Review job={job} onResolve={resolve} /> : null}
          {tab === "json" ? (
            <pre className="max-h-[36rem] overflow-auto border border-line bg-card p-4 font-mono text-xs leading-relaxed text-ink">
              {output}
            </pre>
          ) : null}
          {tab === "contract" ? (
            <Contract
              job={job}
              selected={selected}
              filePath={file.path}
              fileBody={file.body}
              onFile={setFilePath}
              copied={copied === file.path}
              onCopy={() => {
                void navigator.clipboard?.writeText(file.body);
                setCopied(file.path);
              }}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Overview({ job, onReview }: { job: Job; onReview: () => void }) {
  const coverage = job.output.coverage;
  const total = coverage.segments_total;
  const pct = total === 0 ? 100 : Math.round((coverage.segments_classified / total) * 100);
  const link = job.output.relations.find((relation) => relation.relation === "contradicts");
  const left = job.output.facts.find((fact) => fact.id === link?.source_id);
  const right = job.output.facts.find((fact) => fact.id === link?.target_id);
  return (
    <div className="space-y-4">
      <div className="border border-line bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-2xl text-ink">{job.status === "complete" ? "Gate closed" : "Gate held"}</p>
          <p className="font-mono text-sm text-muted">
            {coverage.segments_classified}/{total} classified
          </p>
        </div>
        <div className="mt-3 h-2 bg-line" aria-hidden="true">
          <div className="h-2 bg-stamp" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">
          {job.status === "complete"
            ? "Every sentence is a record or boilerplate. Humans still own any field left unclear."
            : "Unclear and low-confidence rows stay out of the export until you accept them."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Tile label="Concepts" value={job.output.concepts.length} />
        <Tile label="Facts" value={job.output.facts.length} />
        <Tile label="Theories" value={job.output.theories.length} />
        <Tile label="Workflows" value={job.output.workflows.length} />
        <Tile label="Relations" value={job.output.relations.length} />
        <Tile label="Held" value={job.review.length} />
      </div>
      {left && right ? (
        <div className="border border-line bg-card p-4">
          <h3 className="font-display text-lg text-ink">Contradiction kept apart</h3>
          <p className="mt-1 text-sm text-muted">
            {link?.source_id} contradicts {link?.target_id}. They were not merged.
          </p>
          <blockquote className="mt-3 border-l-2 border-review pl-3 font-mono text-sm text-ink">{left.evidence_quote}</blockquote>
          <blockquote className="mt-3 border-l-2 border-stamp pl-3 font-mono text-sm text-ink">{right.evidence_quote}</blockquote>
        </div>
      ) : null}
      {job.review.length > 0 ? (
        <button type="button" className={ghost} onClick={onReview}>
          Review {job.review.length} held {job.review.length === 1 ? "row" : "rows"}
        </button>
      ) : null}
      <p className="font-mono text-xs text-muted">
        {job.chunks.length} chunk{job.chunks.length === 1 ? "" : "s"} · {job.engine} · {job.id}
      </p>
    </div>
  );
}

function Concepts({ job, onPick, selected }: { job: Job; onPick: (id: string) => void; selected: string | null }) {
  if (job.output.concepts.length === 0) return <Empty>No accepted concepts.</Empty>;
  return (
    <ul className="space-y-3">
      {job.output.concepts.map((concept) => (
        <li key={concept.id}>
          <button
            type="button"
            onClick={() => onPick(concept.id)}
            className={`w-full border bg-card p-4 text-left ${selected === concept.id ? "border-stamp" : "border-line"}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-muted">{concept.id}</span>
              <span className="font-mono text-xs uppercase text-stamp">{concept.type}</span>
            </div>
            <p className="mt-1 font-display text-xl text-ink">{concept.term}</p>
            <p className="mt-2 font-mono text-sm text-ink">
              {concept.definition_present === "yes" ? concept.definition_quote : "No definition in the sentence."}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Facts({ job, onPick, selected }: { job: Job; onPick: (id: string) => void; selected: string | null }) {
  if (job.output.facts.length === 0) return <Empty>No accepted facts.</Empty>;
  return (
    <ul className="space-y-3">
      {job.output.facts.map((fact) => (
        <li key={fact.id}>
          <button
            type="button"
            onClick={() => onPick(fact.id)}
            className={`w-full border bg-card p-4 text-left ${selected === fact.id ? "border-stamp" : "border-line"}`}
          >
            <div className="flex flex-wrap gap-3 font-mono text-xs uppercase">
              <span className="text-muted">{fact.id}</span>
              <Polarity value={fact.polarity} />
              <span className="text-muted">{fact.time_scope}</span>
              <span className="text-muted">{fact.deterministic === "yes" ? "deterministic" : "not deterministic"}</span>
              <span className="text-muted">{fact.quantity_present === "yes" ? "quantity" : "no quantity"}</span>
            </div>
            <p className="mt-2 font-mono text-sm text-ink">{fact.evidence_quote}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Theories({ job }: { job: Job }) {
  if (job.output.theories.length === 0) {
    return <Empty>No theories in the export. Hedged readings wait in Review until you accept them.</Empty>;
  }
  return (
    <ul className="space-y-3">
      {job.output.theories.map((theory) => (
        <li key={theory.id} className="border border-line bg-card p-4">
          <div className="flex flex-wrap gap-3 font-mono text-xs uppercase">
            <span className="text-muted">{theory.id}</span>
            <span className="text-stamp">{theory.status}</span>
            <span className="text-muted">causal {theory.causal}</span>
            <span className="text-muted">falsifiable {theory.falsifiable}</span>
          </div>
          <p className="mt-2 font-mono text-sm text-ink">{theory.evidence_quote}</p>
          <p className="mt-2 text-xs text-muted">Conflicts with {theory.conflicts_with_fact_id}</p>
        </li>
      ))}
    </ul>
  );
}

function Workflows({ job }: { job: Job }) {
  if (job.output.workflows.length === 0) return <Empty>No workflow in the accepted set.</Empty>;
  return (
    <div className="space-y-4">
      {job.output.workflows.map((workflow) => (
        <article key={workflow.id} className="border border-line bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-2xl text-ink">{workflow.name}</h3>
            <span className="font-mono text-xs text-muted">{workflow.id}</span>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Trigger" v={workflow.trigger} />
            <Row k="End" v={workflow.end_condition} />
            <Row k="Roles" v={workflow.roles.join(", ")} />
            <Row k="Tools" v={workflow.tools_mentioned} />
            <Row k="Fully specified" v={workflow.fully_specified} />
          </dl>
          <ol className="mt-4 space-y-3">
            {workflow.steps.map((step) => (
              <li key={step.order} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                <span className="grid h-10 w-10 place-items-center bg-stamp font-mono text-sm text-paper">{step.order}</span>
                <div>
                  <p className="font-mono text-sm text-ink">{step.action}</p>
                  <p className="mt-1 text-xs text-muted">
                    {step.actor} · in {step.input} · out {step.output} · decision {step.decision}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </article>
      ))}
    </div>
  );
}

function Relations({ job }: { job: Job }) {
  if (job.output.relations.length === 0) return <Empty>No relations between accepted records.</Empty>;
  return (
    <ul className="space-y-2">
      {job.output.relations.map((relation) => (
        <li key={`${relation.source_id}-${relation.relation}-${relation.target_id}`} className="border border-line bg-card px-4 py-3 font-mono text-sm text-ink">
          {relation.source_id} <span className="text-stamp">{relation.relation}</span> {relation.target_id}
        </li>
      ))}
    </ul>
  );
}

function Review({
  job,
  onResolve,
}: {
  job: Job;
  onResolve: (unitId: string, action: Resolution["action"], polarity?: Resolution["polarity"]) => void;
}) {
  if (job.review.length === 0) return <Empty>Nothing is waiting. The gate is closed for this text.</Empty>;
  return (
    <ul className="space-y-3">
      {job.review.map((item) => (
        <li key={item.id} className="border border-line border-l-2 border-l-review bg-card p-4">
          <div className="flex flex-wrap gap-2 font-mono text-xs uppercase text-muted">
            <span>{item.id}</span>
            <span>{Math.round(item.confidence * 100)}%</span>
            <span>{item.reasons.join(" · ")}</span>
          </div>
          <p className="mt-2 font-mono text-sm text-ink">{item.quote}</p>
          <p className="mt-2 text-xs text-muted">
            Proposed {item.proposed_kind}
            {item.proposed_kind === "theory" ? ` · ${item.proposed_status}` : ""} · {item.proposed_polarity}
            {item.conflict ? " · choice was close" : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.proposed_kind === "fact" && item.proposed_polarity === "unclear" ? (
              <>
                <button type="button" className={stamp} onClick={() => onResolve(item.unit_id, "accept", "affirmed")}>
                  Affirmed
                </button>
                <button type="button" className={ghost} onClick={() => onResolve(item.unit_id, "accept", "denied")}>
                  Denied
                </button>
                <button type="button" className={ghost} onClick={() => onResolve(item.unit_id, "accept", "conditional")}>
                  Conditional
                </button>
              </>
            ) : (
              <button type="button" className={stamp} onClick={() => onResolve(item.unit_id, "accept")}>
                Accept
              </button>
            )}
            {item.conflict ? (
              <button type="button" className={ghost} onClick={() => onResolve(item.unit_id, "file_as_fact")}>
                File as fact
              </button>
            ) : null}
            <button type="button" className={ghost} onClick={() => onResolve(item.unit_id, "boilerplate")}>
              Mark boilerplate
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Contract({
  job,
  selected,
  filePath,
  fileBody,
  onFile,
  copied,
  onCopy,
}: {
  job: Job;
  selected: string | null;
  filePath: string;
  fileBody: string;
  onFile: (path: string) => void;
  copied: boolean;
  onCopy: () => void;
}) {
  const unit =
    job.units.find((item) => item.id === selected) ??
    job.units.find((item) => item.text === job.output.facts[0]?.statement) ??
    job.units[0];
  const index = unit ? job.units.findIndex((item) => item.id === unit.id) : -1;
  const request = unit
    ? buildClefRequest(unit, {
        before: job.units[index - 1]?.text,
        after: job.units[index + 1]?.text,
      })
    : { model: "clef-flash", state: {}, questions: CLEF_QUESTIONS };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-2xl text-ink">Question schema</h3>
        <p className="mt-2 text-sm text-muted">
          Written once. Grok does not re-label each sentence. Clef returns probabilities over these noul and choice
          questions. Evidence quotes stay with the segmenter.
        </p>
        <pre className="mt-3 max-h-80 overflow-auto border border-line bg-card p-4 font-mono text-xs text-ink">
          {JSON.stringify(request, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="font-display text-2xl text-ink">Runbook</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink">
          <li>Create the D1 database `clef_extract`, an AI Gateway named `clef-extract`, and log in with Wrangler.</li>
          <li>Put the database id in `cloudflare/wrangler.jsonc`, then apply `schema.sql`.</li>
          <li>From `cloudflare/`, deploy with Wrangler. The bundle includes the shared engine.</li>
          <li>POST one document to `/extract`.</li>
          <li>GET `/jobs/:id` and read `output.coverage`. Classified plus unassigned equals the total.</li>
          <li>Accept or drop held rows by POSTing the same text with `resolutions`. Review is not its own route.</li>
          <li>Export the `output` object only after status is `complete` if you need a system of record.</li>
          <li>A chatbot calls POST /api/mcp (streamable HTTP). lookup and quote_answer omit held rows.</li>
        </ol>
      </div>
      <div>
        <h3 className="font-display text-2xl text-ink">v1 limits</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Images are out of scope unless already OCR’d. Tables arrive as rows.</li>
          <li>The desk you are using is the deterministic stand-in, not a Clef call.</li>
          <li>Clef has noul, choice, and score. This schema uses noul and choice only.</li>
          <li>IDs are stable for the same text. They are not a global corpus sequence.</li>
          <li>One synchronous pass, 100,000 characters. Queue fan-out is deferred.</li>
          <li>Unclear, conflicting, and external-check rows stay in the human queue.</li>
          <li>Ask and MCP quote accepted records only. WebGPU reranks those quotes. It does not generate new ones.</li>
        </ul>
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-2xl text-ink">Starter files</h3>
          <button type="button" className={ghost} onClick={onCopy}>
            {copied ? "Copied" : "Copy file"}
          </button>
        </div>
        <label className="mt-3 block text-sm text-muted">
          File
          <select
            value={filePath}
            onChange={(event) => onFile(event.target.value)}
            className="mt-1 min-h-11 w-full border border-line bg-card px-3 text-sm text-ink"
          >
            {STARTER_FILES.map((item) => (
              <option key={item.path} value={item.path}>
                {item.path}
              </option>
            ))}
          </select>
        </label>
        <pre className="mt-3 max-h-96 overflow-auto border border-line bg-card p-4 font-mono text-xs text-ink">{fileBody}</pre>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line bg-card px-3 py-3">
      <div className="font-mono text-2xl text-ink">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="text-muted">{k}</dt>
      <dd className="font-mono text-sm text-ink">{v}</dd>
    </div>
  );
}

function Polarity({ value }: { value: string }) {
  const tone = value === "denied" ? "text-review" : value === "affirmed" ? "text-stamp" : "text-ink";
  return <span className={tone}>{value}</span>;
}

function Empty({ children }: { children: string }) {
  return <p className="border border-line bg-card p-4 text-sm text-muted">{children}</p>;
}

function parseTables(raw: string): TableInput[] {
  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("|").map((cell) => cell.trim()));
  if (rows.length === 0) return [];
  return [{ name: "Pasted", rows }];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function download(body: string) {
  const blob = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clef-extract.json";
  link.click();
  URL.revokeObjectURL(url);
}

const stamp = "min-h-11 bg-stamp px-4 text-sm font-medium text-paper hover:opacity-90";
const ghost = "min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink hover:border-stamp";
