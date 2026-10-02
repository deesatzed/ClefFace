/** Accepted ledger only. Held review rows are not projected, so a chatbot cannot quote them. */

export interface LedgerRecord {
  version_id: string;
  record_id: string;
  kind: "concept" | "fact" | "theory" | "workflow_step";
  label: string;
  text: string;
  quote: string;
}

export interface LedgerRelation {
  version_id: string;
  source_id: string;
  target_id: string;
  relation: string;
}

export interface LedgerView {
  version_id: string;
  title: string;
  status: "complete" | "needs_review";
  engine: string;
  created_at: string;
  review_count: number;
  segments_total: number;
  segments_classified: number;
  unassigned: number;
  records: LedgerRecord[];
  relations: LedgerRelation[];
}

export interface LedgerSource {
  id: string;
  status: "complete" | "needs_review";
  engine: string;
  title?: string;
  created_at?: string;
  review_count: number;
  output: {
    concepts: { id: string; term: string; definition_present: string; definition_quote: string; type: string }[];
    facts: { id: string; statement: string; evidence_quote: string; polarity: string; time_scope: string }[];
    theories: { id: string; claim: string; evidence_quote: string; status: string }[];
    workflows: {
      id: string;
      name: string;
      trigger: string;
      end_condition: string;
      steps: { order: number; action: string; actor: string; decision: string }[];
    }[];
    relations: { source_id: string; target_id: string; relation: string }[];
    coverage: { segments_total: number; segments_classified: number; unassigned_quotes: string[] };
  };
}

export function projectLedger(source: LedgerSource): LedgerView {
  const version_id = source.id;
  const records: LedgerRecord[] = [];
  for (const concept of source.output.concepts) {
    const quote = concept.definition_quote || concept.term;
    records.push({
      version_id,
      record_id: concept.id,
      kind: "concept",
      label: concept.type,
      text: concept.term,
      quote,
    });
  }
  for (const fact of source.output.facts) {
    records.push({
      version_id,
      record_id: fact.id,
      kind: "fact",
      label: `${fact.polarity} · ${fact.time_scope}`,
      text: fact.statement,
      quote: fact.evidence_quote || fact.statement,
    });
  }
  for (const theory of source.output.theories) {
    records.push({
      version_id,
      record_id: theory.id,
      kind: "theory",
      label: theory.status,
      text: theory.claim,
      quote: theory.evidence_quote || theory.claim,
    });
  }
  for (const workflow of source.output.workflows) {
    workflow.steps.forEach((step, index) => {
      records.push({
        version_id,
        record_id: `${workflow.id}.${step.order || index + 1}`,
        kind: "workflow_step",
        label: step.decision === "yes" ? "decision" : "step",
        text: `${workflow.name}. ${step.actor}: ${step.action}`,
        quote: step.action,
      });
    });
  }
  return {
    version_id,
    title: source.title?.trim() || "Document",
    status: source.status,
    engine: source.engine,
    created_at: source.created_at ?? "",
    review_count: source.review_count,
    segments_total: source.output.coverage.segments_total,
    segments_classified: source.output.coverage.segments_classified,
    unassigned: source.output.coverage.unassigned_quotes.length,
    records,
    relations: source.output.relations.map((relation) => ({
      version_id,
      source_id: relation.source_id,
      target_id: relation.target_id,
      relation: relation.relation,
    })),
  };
}
