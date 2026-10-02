import { useState, type ReactNode } from "react";
import type { ReplayArtifact } from "@/lib/experiment/artifacts";
import { createExploratoryArtifact } from "@/lib/experiment/authoring";
import type { InterventionCategory } from "@/lib/experiment/core";

const categories: Array<{ value: InterventionCategory; label: string }> = [
  { value: "meaning_change", label: "Meaning changes" },
  { value: "meaning_preserving", label: "Meaning stays" },
  { value: "evidence_removal", label: "Evidence removed" },
];

export function ExperimentBuilder({ onCreate }: { onCreate: (artifact: ReplayArtifact) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Untitled evidence experiment");
  const [source, setSource] = useState("Files larger than 10 MB require review. Exactly 10 MB does not require review.");
  const [question, setQuestion] = useState("Does an 8 MB file require review?");
  const [answers, setAnswers] = useState("yes, no, insufficient_evidence");
  const [target, setTarget] = useState("10");
  const [replacement, setReplacement] = useState("5");
  const [category, setCategory] = useState<InterventionCategory>("meaning_change");
  const [baseline, setBaseline] = useState("no");
  const [variant, setVariant] = useState("yes");
  const [rationale, setRationale] = useState("Changing the threshold from 10 to 5 changes the status of an 8 MB file.");
  const [error, setError] = useState("");

  function create() {
    try {
      onCreate(createExploratoryArtifact({ title, source, question, answers, target, replacement, category, expectedBaseline: baseline, expectedVariant: variant, rationale }));
      setError("");
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create experiment.");
    }
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${primaryButton} mt-6`}>Create experiment</button>;
  return <section className="mt-6 rounded-2xl border border-stamp/30 bg-stamp/5 p-4 shadow-sm sm:p-5" aria-labelledby="create-experiment-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-[0.12em] text-stamp">Custom case</p><h2 id="create-experiment-heading" className="mt-1 font-display text-2xl text-ink">Create an exploratory experiment</h2></div><button type="button" onClick={() => setOpen(false)} className={secondaryButton}>Close</button></div>
    <p className="mt-2 max-w-3xl text-sm text-muted">Paste plain text or Markdown. This creates one exact replacement intervention. Review and promote the expected outcome before treating it as validated evidence.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputStyle} /></Field>
      <Field label="Question"><input value={question} onChange={(event) => setQuestion(event.target.value)} className={inputStyle} /></Field>
      <Field label="Allowed answers (comma separated)"><input value={answers} onChange={(event) => setAnswers(event.target.value)} className={inputStyle} /></Field>
      <Field label="Intervention type"><select value={category} onChange={(event) => setCategory(event.target.value as InterventionCategory)} className={inputStyle}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      <Field label="Exact text to replace"><input value={target} onChange={(event) => setTarget(event.target.value)} className={inputStyle} /></Field>
      <Field label="Replacement text (blank removes evidence)"><input value={replacement} onChange={(event) => setReplacement(event.target.value)} className={inputStyle} /></Field>
      <Field label="Expected original answer"><input value={baseline} onChange={(event) => setBaseline(event.target.value)} className={inputStyle} /></Field>
      <Field label="Expected edited answer"><input value={variant} onChange={(event) => setVariant(event.target.value)} className={inputStyle} /></Field>
    </div>
    <Field label="Source" className="mt-4"><textarea value={source} onChange={(event) => setSource(event.target.value)} className={`${inputStyle} min-h-32`} /></Field>
    <Field label="Why this expected outcome is justified" className="mt-4"><textarea value={rationale} onChange={(event) => setRationale(event.target.value)} className={`${inputStyle} min-h-20`} /></Field>
    {error ? <p role="alert" className="mt-4 text-sm text-review">{error}</p> : null}
    <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={create} className={primaryButton}>Create exploratory case</button><p className="text-xs text-muted">No provider call occurs. The case starts as exploratory.</p></div>
  </section>;
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-ink ${className}`}><span>{label}</span><span className="mt-1.5 block">{children}</span></label>;
}

const inputStyle = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-stamp focus:ring-2 focus:ring-stamp/20";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-stamp px-4 text-sm font-medium text-paper transition-colors hover:bg-ink";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-4 text-sm font-medium text-ink transition-colors hover:border-stamp hover:text-stamp";
