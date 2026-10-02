import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Beaker, BookOpen, Check, Copy, Download, FlaskConical, GitCompare, Info, RotateCcw } from "lucide-react";
import { featuredSeed } from "@/lib/experiment/fixtures";
import { simulatedResponses } from "@/lib/experiment/providers";
import { scorePair } from "@/lib/experiment/scoring";
import { createReplayArtifact } from "@/lib/experiment/artifacts";
import { parseArtifactText, serializeCasesJsonl, type ReplayArtifact } from "@/lib/experiment/artifacts";
import { renderReplayReport } from "@/lib/experiment/report";
import { archiveLibraryEntry, createLibraryEntry, deleteLibraryEntry, experimentLibraryKey, parseLibrary, serializeLibrary, type LibraryEntry } from "@/lib/experiment/library";
import { ExperimentBuilder } from "@/components/evidence-lab/experiment-builder";

const seed = featuredSeed();
const vaultKey = "evidence-lab/latest-replay-v1";

const categoryLabel = {
  meaning_change: "Meaning changes",
  meaning_preserving: "Meaning stays",
  evidence_removal: "Evidence removed",
} as const;

export function EvidenceLabWorkspace() {
  const [artifact, setArtifact] = useState<ReplayArtifact | null>(null);
  const [selectedId, setSelectedId] = useState(seed.cases[0]?.id ?? "");
  const [showVariant, setShowVariant] = useState(true);
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState("");
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const experiment = artifact?.experiment ?? seed.experiment;
  const cases = artifact?.cases ?? seed.cases;
  const item = cases.find((candidate) => candidate.id === selectedId) ?? cases[0];
  const responses = useMemo(
    () => artifact?.responses.filter((response) => response.caseId === item.id) ?? simulatedResponses(item),
    [artifact, item],
  );
  const original = experiment.source.normalized;

  useEffect(() => {
    const saved = window.localStorage.getItem(vaultKey);
    if (!saved) return;
    const parsed = parseArtifactText(saved);
    if (parsed.artifact) {
      setArtifact(parsed.artifact);
      setSelectedId(parsed.artifact.cases[0]?.id ?? "");
    } else {
      window.localStorage.removeItem(vaultKey);
    }
  }, []);

  useEffect(() => {
    setLibrary(parseLibrary(window.localStorage.getItem(experimentLibraryKey)));
  }, []);

  useEffect(() => {
    if (artifact) window.localStorage.setItem(vaultKey, JSON.stringify(artifact));
  }, [artifact]);

  function exportCase() {
    download(new Blob([JSON.stringify(currentArtifact(), null, 2)], { type: "application/json" }), `${experiment.id}.evidence-lab.json`);
  }

  function exportReport() {
    const report = renderReplayReport(currentArtifact());
    download(new Blob([report], { type: "text/html" }), `${experiment.id}.evidence-lab.html`);
  }

  function exportJsonl() {
    download(new Blob([serializeCasesJsonl(currentArtifact())], { type: "application/x-ndjson" }), `${experiment.id}.evidence-lab.jsonl`);
  }

  function currentArtifact() {
    const allResponses = artifact?.responses ?? cases.flatMap((candidate) => simulatedResponses(candidate));
    return createReplayArtifact(experiment, cases, allResponses);
  }

  function writeLibrary(next: LibraryEntry[]) {
    try {
      window.localStorage.setItem(experimentLibraryKey, serializeLibrary(next));
      setLibrary(next);
      setSaveStatus("Saved locally in this browser.");
    } catch {
      setSaveStatus("Save failed: browser storage is unavailable or full.");
    }
  }

  function saveToLibrary() {
    writeLibrary([...library, createLibraryEntry(currentArtifact())]);
  }

  function download(blob: Blob, filename: string) {
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(href);
  }

  async function importArtifact(file: File | undefined) {
    if (!file) return;
    const parsed = parseArtifactText(await file.text());
    if (!parsed.artifact) {
      setImportError(parsed.errors.join(" "));
      return;
    }
    setArtifact(parsed.artifact);
    setSelectedId(parsed.artifact.cases[0]?.id ?? "");
    setShowVariant(true);
    setCopied(false);
    setImportError("");
  }

  function openCreatedArtifact(next: ReplayArtifact) {
    setArtifact(next);
    setSelectedId(next.cases[0]?.id ?? "");
    setShowVariant(true);
    setCopied(false);
    setSaveStatus("Exploratory case created locally. Save it when ready.");
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper shadow-sm"><FlaskConical size={21} aria-hidden="true" /></div>
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-stamp">AI Evidence Laboratory</p>
            <h1 className="mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl">Does the answer follow the evidence?</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Change one condition. Keep the question fixed. Inspect the behavior—not a claim about what a model believes.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(JSON.stringify({ experiment, case: item }, null, 2)); setCopied(true); }} className={secondaryButton}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied ? "Copied" : "Copy case"}
          </button>
          <Link to="/clef" className={secondaryButton}>Send a document</Link>
          <input ref={inputRef} className="sr-only" type="file" accept="application/json,application/x-ndjson,.json,.jsonl" onChange={(event) => { void importArtifact(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          <button type="button" onClick={() => inputRef.current?.click()} className={secondaryButton}>Import replay</button>
          <button type="button" onClick={saveToLibrary} className={secondaryButton}>Save to library</button>
          <button type="button" onClick={exportReport} className={secondaryButton}>Export report</button>
          <button type="button" onClick={exportJsonl} className={secondaryButton}>Export JSONL</button>
          <button type="button" onClick={exportCase} className={primaryButton}><Download size={16} aria-hidden="true" />Export replay bundle</button>
        </div>
      </header>

      <ExperimentBuilder onCreate={openCreatedArtifact} />

      <section className="mt-6 rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-ink"><Beaker size={16} className="text-stamp" aria-hidden="true" />{artifact ? "Imported replay artifact" : "Built-in, hand-validated experiment"}</div>
            <p className="mt-1 text-sm text-muted">{artifact ? `Saved locally in this browser · exported ${new Date(artifact.exportedAt).toLocaleDateString()}` : "Threshold boundary · offline demo · no provider call or uploaded document"}</p>
          </div>
          <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Intervention type">
            {cases.map((candidate) => (
              <button key={candidate.id} type="button" role="tab" aria-selected={candidate.id === item.id} onClick={() => { setSelectedId(candidate.id); setCopied(false); }} className={`min-h-11 rounded-lg border px-3 text-left text-xs font-medium transition-colors ${candidate.id === item.id ? "border-stamp bg-stamp text-paper" : "border-line bg-paper text-muted hover:border-stamp hover:text-ink"}`}>
                {categoryLabel[candidate.category]}
              </button>
            ))}
          </div>
        </div>
      </section>
      {importError ? <p role="alert" className="mt-3 rounded-lg border border-review/30 bg-review/10 px-4 py-3 text-sm text-review">Replay import failed: {importError}</p> : null}
      {saveStatus ? <p role="status" className="mt-3 rounded-lg border border-stamp/30 bg-stamp/5 px-4 py-3 text-sm text-stamp">{saveStatus}</p> : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">Question</p>
              <h2 className="mt-1 font-display text-2xl text-ink">{experiment.question}</h2>
            </div>
            <button type="button" onClick={() => setShowVariant((value) => !value)} className={secondaryButton}><GitCompare size={16} aria-hidden="true" />{showVariant ? "Show original" : "Show edit"}</button>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${showVariant ? "bg-review" : "bg-stamp"}`} aria-hidden="true" /><p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{showVariant ? "Edited evidence" : "Original evidence"}</p></div>
              <div className="flex flex-wrap justify-end gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.category === "meaning_change" ? "bg-review/10 text-review" : "bg-stamp/10 text-stamp"}`}>{categoryLabel[item.category]}</span><span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-muted">{item.validation} · {item.split}</span></div>
            </div>
            <p className="whitespace-pre-wrap font-display text-xl leading-relaxed text-ink">{showVariant ? renderPatch(original, item.patch.start, item.patch.end, item.patch.replacement) : original}</p>
          </div>

          <aside className="mt-4 rounded-xl border border-stamp/30 bg-stamp/5 p-4">
            <div className="flex gap-3"><Info size={18} className="mt-0.5 shrink-0 text-stamp" aria-hidden="true" /><div><p className="font-medium text-ink">Why this edit is valid</p><p className="mt-1 text-sm leading-relaxed text-muted">{item.rationale}</p><p className="mt-3 font-mono text-xs text-stamp">Expected: {item.expectedBaseline} <ArrowRight className="inline" size={12} aria-hidden="true" /> {item.expectedVariant}</p></div></div>
          </aside>
        </div>

        <aside className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2"><BookOpen size={17} className="text-stamp" aria-hidden="true" /><h2 className="font-display text-xl text-ink">Observed responses</h2></div>
          <p className="mt-1 text-sm text-muted">{responses.length ? "Response provenance is shown on every receipt." : "No response has been recorded for this case."}</p>
          {responses.length === 0 ? <p role="status" className="mt-4 rounded-xl border border-dashed border-line bg-paper p-4 text-sm leading-relaxed text-muted">Provider unavailable: this exploratory case has not been run. Save or export it for review, then use a configured, explicitly bounded provider run when available.</p> : <div className="mt-4 space-y-3">
            {responses.map((response) => {
              const score = scorePair({ category: item.category, expectedBaseline: item.expectedBaseline, expectedVariant: item.expectedVariant }, response.baselineAnswer, response.variantAnswer);
              return <article key={response.modelId} className="rounded-xl border border-line bg-paper p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted">{response.providerId}</p><h3 className="mt-1 font-medium text-ink">{response.modelId}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-medium ${score.outcome === "matched_expectation" ? "bg-stamp/10 text-stamp" : "bg-review/10 text-review"}`}>{score.outcome === "matched_expectation" ? "matched" : "did not match"}</span></div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-muted">Original</dt><dd className="mt-0.5 font-medium text-ink">{response.baselineAnswer}</dd></div><div><dt className="text-muted">Edited</dt><dd className="mt-0.5 font-medium text-ink">{response.variantAnswer}</dd></div></dl>
                <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">{response.rationale}</p>
              </article>;
            })}
          </div>}
          <button type="button" onClick={() => { if (artifact) { window.localStorage.removeItem(vaultKey); setArtifact(null); } setSelectedId(seed.cases[0]?.id ?? ""); setShowVariant(true); setImportError(""); }} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-stamp hover:text-ink"><RotateCcw size={16} aria-hidden="true" />{artifact ? "Return to built-in demo" : "Reset experiment"}</button>
        </aside>
      </section>

      <section className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-4"><p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">What this is</p><p className="mt-2 text-sm leading-relaxed text-ink">A controlled input-output experiment with inspectable source changes.</p></div>
        <div className="rounded-xl bg-card p-4"><p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">What this is not</p><p className="mt-2 text-sm leading-relaxed text-ink">Evidence of internal beliefs, general intelligence, or factual truth beyond this case.</p></div>
        <div className="rounded-xl bg-card p-4"><p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">Next step</p><p className="mt-2 text-sm leading-relaxed text-ink">Import a case, validate its expected outcome, then run a bounded live comparison.</p></div>
      </section>

      <section className="mt-8 border-t border-line pt-6" aria-labelledby="library-heading">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">Local only</p><h2 id="library-heading" className="mt-1 font-display text-2xl text-ink">Experiment library</h2></div><p className="max-w-lg text-sm text-muted">Saved artifacts remain in this browser until you explicitly archive or delete them. Export a bundle for backup or sharing.</p></div>
        {library.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted">No saved experiments yet.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{library.map((entry) => <article key={entry.id} className="rounded-xl border border-line bg-card p-4"><p className="font-mono text-xs text-muted">{entry.archivedAt ? "archived" : "saved"} · {new Date(entry.updatedAt).toLocaleString()}</p><h3 className="mt-1 font-medium text-ink">{entry.title}</h3><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => { setArtifact(entry.artifact); setSelectedId(entry.artifact.cases[0]?.id ?? ""); setSaveStatus("Opened saved artifact."); }} className={smallButton}>Open</button>{!entry.archivedAt ? <button type="button" onClick={() => writeLibrary(archiveLibraryEntry(library, entry.id))} className={smallButton}>Archive</button> : null}<button type="button" onClick={() => { if (window.confirm(`Delete ${entry.title}? This removes only the local copy.`)) writeLibrary(deleteLibraryEntry(library, entry.id)); }} className={smallButton}>Delete</button></div></article>)}</div>}
      </section>
    </main>
  );
}

function renderPatch(source: string, start: number, end: number, replacement: string) {
  return <>{source.slice(0, start)}<mark className="rounded bg-review/20 px-1 text-ink line-through decoration-review">{source.slice(start, end)}</mark><mark className="rounded bg-stamp/20 px-1 text-ink">{replacement}</mark>{source.slice(end)}</>;
}

const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-stamp px-4 text-sm font-medium text-paper transition-colors hover:bg-ink";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-4 text-sm font-medium text-ink transition-colors hover:border-stamp hover:text-stamp";
const smallButton = "inline-flex min-h-9 items-center justify-center rounded-md border border-line bg-paper px-3 text-xs font-medium text-ink transition-colors hover:border-stamp hover:text-stamp";
