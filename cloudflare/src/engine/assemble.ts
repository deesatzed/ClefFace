import { localClef } from "./local-clef.ts";
import { normalizeAnswers, reviewReasons } from "./normalize.ts";
import { segmentDocument } from "./segment.ts";
import {
  CONFIDENCE_THRESHOLD,
  MemoryRegistry,
  actorOf,
  contentWords,
  echoState,
  emptyState,
  formatId,
  isContrast,
  normalizeKey,
  shortQuote,
  slot,
  textHash,
} from "./text.ts";
import type {
  Chunk,
  Concept,
  ConceptType,
  ExtractionOutput,
  Fact,
  FactPolarity,
  Job,
  NormalizedDecision,
  Relation,
  Resolution,
  ReviewItem,
  SwarmState,
  TableInput,
  Theory,
  TheoryStatus,
  Unit,
  Workflow,
  WorkflowStep,
  YesNo,
} from "./types.ts";

interface Tuned extends NormalizedDecision {
  human: boolean;
}

interface FactRec extends Fact {
  unit_ids: string[];
  held: boolean;
}

interface TheoryRec extends Theory {
  unit_ids: string[];
  held: boolean;
}

interface ConceptRec extends Concept {
  unit_ids: string[];
  held: boolean;
}

interface StepRec extends WorkflowStep {
  unit_id: string;
  held: boolean;
}

interface WorkflowRec extends Workflow {
  unit_ids: string[];
  held: boolean;
}

interface RelationRec extends Relation {
  held: boolean;
}

export function extractDocument(
  text: string,
  tables: TableInput[] = [],
  resolutions: Resolution[] = [],
  provided?: {
    units: Unit[];
    chunks: Chunk[];
    decisions: NormalizedDecision[];
    engine: string;
  },
): Job {
  const source = text.replace(/\r\n/g, "\n").trim();
  if (!source && tables.length === 0) {
    throw new Error("empty_document");
  }
  const id = "job_" + textHash(JSON.stringify({ source, tables, resolutions, engine: provided?.engine ?? "local" }));
  const registry = new MemoryRegistry();
  let state = emptyState();
  const { chunks, units } = provided
    ? { chunks: provided.chunks, units: provided.units }
    : segmentDocument(source, tables);
  if (provided && provided.decisions.length !== units.length) {
    throw new Error("decision count does not match units");
  }
  state = take(state, registry, id, units.map((unit) => unit.id));

  const byUnit = new Map(resolutions.map((item) => [item.unit_id, item]));
  const tuned = units.map((unit, index) => {
    const decision = provided ? provided.decisions[index] : normalizeAnswers(localClef(unit), unit.id);
    if (decision.unit_id !== unit.id) throw new Error(`decision unit mismatch for ${unit.id}`);
    return tune(decision, byUnit.get(unit.id));
  });

  const facts: FactRec[] = [];
  const theories: TheoryRec[] = [];
  const concepts: ConceptRec[] = [];
  const factKey = new Map<string, FactRec>();
  let factN = 0;
  let theoryN = 0;
  let conceptN = 0;
  let reviewN = 0;
  const review: ReviewItem[] = [];
  const boilerplate = new Set<string>();

  for (const unit of units) {
    const decision = tuned[unit.ordinal - 1];
    const reasons = reviewReasons(decision, decision.human);
    if (decision.boilerplate === "yes") {
      boilerplate.add(unit.id);
      continue;
    }
    const held = reasons.length > 0;
    if (held) {
      reviewN += 1;
      const reviewId = formatId("Q", reviewN);
      state = take(state, registry, id, [reviewId]);
      review.push({
        id: reviewId,
        unit_id: unit.id,
        section_path: unit.section_path,
        quote: unit.text,
        reasons,
        confidence: round(decision.confidence),
        proposed_kind: decision.record_kind,
        proposed_polarity: decision.polarity,
        proposed_status: decision.theory_status,
        causal: decision.causal,
        falsifiable: decision.falsifiable,
        deterministic: decision.deterministic,
        conflict: decision.conflict,
      });
    }

    if (decision.record_kind === "concept") {
      conceptN += 1;
      const conceptId = formatId("C", conceptN);
      state = take(state, registry, id, [conceptId]);
      const term = termOf(unit.text);
      const quote = decision.definition_present === "yes" ? definitionQuote(unit.text) : "";
      concepts.push({
        id: conceptId,
        term,
        definition_present: quote ? "yes" : "no",
        definition_quote: quote,
        type: conceptType(term, unit.text, decision.concept_type),
        unit_ids: [unit.id],
        held,
      });
      continue;
    }

    if (decision.record_kind === "theory") {
      theoryN += 1;
      const theoryId = formatId("T", theoryN);
      state = take(state, registry, id, [theoryId]);
      theories.push({
        id: theoryId,
        claim: unit.text,
        evidence_quote: shortQuote(unit.text),
        status: theoryStatus(decision.theory_status),
        causal: decision.causal,
        falsifiable: decision.falsifiable,
        conflicts_with_fact_id: "none",
        unit_ids: [unit.id],
        held: held || decision.theory_status === "not_applicable",
      });
      continue;
    }

    if (decision.record_kind === "fact") {
      const key = normalizeKey(unit.text);
      const existing = factKey.get(key);
      if (existing) {
        existing.unit_ids.push(unit.id);
        continue;
      }
      const polarity = decision.polarity;
      if (polarity === "unclear") continue;
      factN += 1;
      const factId = formatId("F", factN);
      state = take(state, registry, id, [factId]);
      const fact: FactRec = {
        id: factId,
        statement: unit.text,
        evidence_quote: shortQuote(unit.text),
        deterministic: decision.deterministic,
        polarity,
        time_scope: decision.time_scope,
        quantity_present: decision.quantity_present,
        unit_ids: [unit.id],
        held,
      };
      facts.push(fact);
      factKey.set(key, fact);
    }
  }

  const workflows = buildWorkflows(units, tuned, state, registry, id);
  state = workflows.state;

  const relations = buildRelations(concepts, facts, theories, workflows.records, state, registry, id);
  state = relations.state;

  const rejected = critique(source, tables, facts, theories, concepts, workflows.records);
  state = echoState(state, {
    ...state,
    open_questions: [...state.open_questions, ...relations.openQuestions, ...rejected.open],
    rejected_labels: [...state.rejected_labels, ...rejected.rejected],
  });
  for (const unitId of rejected.holdUnits) {
    for (const fact of facts) {
      if (fact.unit_ids.includes(unitId)) fact.held = true;
    }
  }

  const output = project(units, boilerplate, concepts, facts, theories, workflows.records, relations.records);
  return {
    id,
    status: output.coverage.unassigned_quotes.length === 0 && review.length === 0 ? "complete" : "needs_review",
    engine: provided?.engine ?? "local-stand-in",
    threshold: CONFIDENCE_THRESHOLD,
    output,
    review,
    units,
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      heading: chunk.heading,
      word_count: chunk.word_count,
    })),
    decisions: tuned.map(({ human: _human, ...decision }) => decision),
    state,
  };
}

export function applyResolutions(
  text: string,
  tables: TableInput[],
  resolutions: Resolution[],
): Job {
  return extractDocument(text, tables, resolutions);
}

function tune(decision: NormalizedDecision, resolution: Resolution | undefined): Tuned {
  if (!resolution) return { ...decision, human: false };
  if (resolution.action === "boilerplate") {
    return { ...decision, human: true, boilerplate: "yes", record_kind: "none", confidence: 1, conflict: false };
  }
  if (resolution.action === "file_as_fact") {
    const polarity = resolution.polarity ?? (decision.polarity === "unclear" ? "affirmed" : decision.polarity);
    return {
      ...decision,
      human: true,
      record_kind: "fact",
      theory_status: "not_applicable",
      deterministic: "no",
      conflict: false,
      confidence: 1,
      polarity,
      causal: "no",
    };
  }
  return {
    ...decision,
    human: true,
    confidence: 1,
    conflict: false,
    polarity: resolution.polarity ?? decision.polarity,
  };
}

function buildWorkflows(
  units: Unit[],
  tuned: Tuned[],
  state: SwarmState,
  registry: MemoryRegistry,
  documentId: string,
): { records: WorkflowRec[]; state: SwarmState } {
  const groups = new Map<string, Unit[]>();
  for (const unit of units) {
    const decision = tuned[unit.ordinal - 1];
    if (decision.boilerplate === "yes" || decision.record_kind !== "workflow_step") continue;
    const list = groups.get(unit.section_path) ?? [];
    list.push(unit);
    groups.set(unit.section_path, list);
  }
  const records: WorkflowRec[] = [];
  let n = 0;
  let next = state;
  for (const [path, group] of groups) {
    const triggerUnit = group.find((unit) => unit.list_order === null && /^(when|if)\b/i.test(unit.text));
    const steps = group.filter((unit) => unit !== triggerUnit);
    if (steps.length === 0 && !triggerUnit) continue;
    n += 1;
    const workflowId = formatId("W", n);
    next = take(next, registry, documentId, [workflowId]);
    const stepRecs: StepRec[] = steps.map((unit, index) => {
      const decision = tuned[unit.ordinal - 1];
      const held = reviewReasons(decision, decision.human).length > 0;
      const lexicalDecision = /\b(if|whether|otherwise|decide|decision)\b/i.test(unit.text);
      let decisionFlag: YesNo = decision.decision_point;
      if (decisionFlag === "yes" && !lexicalDecision) {
        next = echoState(next, {
          ...next,
          rejected_labels: [
            ...next.rejected_labels,
            {
              unit_id: unit.id,
              label: "decision_point:yes",
              reason: "no explicit decision word in the step",
            },
          ],
        });
        decisionFlag = "no";
      }
      return {
        order: unit.list_order ?? index + 1,
        action: unit.text,
        actor: actorOf(unit.text),
        input: slot(unit.text, "input"),
        output: slot(unit.text, "output"),
        decision: decisionFlag,
        unit_id: unit.id,
        held,
      };
    });
    const exportedSteps = stepRecs.filter((step) => !step.held);
    const triggerHeld = triggerUnit ? reviewReasons(tuned[triggerUnit.ordinal - 1], tuned[triggerUnit.ordinal - 1].human).length > 0 : true;
    const trigger = triggerUnit && !triggerHeld ? triggerUnit.text : "unspecified";
    const end = endCondition(group.map((unit) => unit.text));
    const roles = unique(exportedSteps.map((step) => step.actor));
    const blob = [trigger, ...exportedSteps.map((step) => step.action)].join(" ");
    const structural = fullySpecified(trigger, end, exportedSteps);
    const record: WorkflowRec = {
      id: workflowId,
      name: path.split(" > ").at(-1) || "Unspecified procedure",
      trigger,
      steps: exportedSteps.map(({ unit_id: _id, held: _held, ...step }) => step),
      end_condition: end,
      roles: roles.length > 0 ? roles : ["unspecified"],
      tools_mentioned: /\b(software|database|dashboard|platform|EHR|Epic|spreadsheet|system)\b/i.test(blob) ? "yes" : "no",
      fully_specified: structural,
      unit_ids: [
        ...(triggerUnit && !triggerHeld ? [triggerUnit.id] : []),
        ...exportedSteps.map((step) => step.unit_id),
      ],
      held: exportedSteps.length === 0 && trigger === "unspecified",
    };
    if (record.name === "Document") record.name = "Unspecified procedure";
    records.push(record);
  }
  return { records, state: next };
}

function fullySpecified(trigger: string, end: string, steps: WorkflowStep[]): YesNo {
  if (trigger === "unspecified" || end === "unspecified" || steps.length === 0) return "no";
  for (const step of steps) {
    if (step.actor === "unspecified") return "no";
    if (step.input === "unspecified" && step.output === "unspecified") return "no";
  }
  return "yes";
}

function endCondition(texts: string[]): string {
  const hit = texts.find((text) => /\b(end when|done when|complete when|until complete|then stop)\b/i.test(text));
  return hit ? shortQuote(hit) : "unspecified";
}

function buildRelations(
  concepts: ConceptRec[],
  facts: FactRec[],
  theories: TheoryRec[],
  workflows: WorkflowRec[],
  state: SwarmState,
  registry: MemoryRegistry,
  documentId: string,
): { records: RelationRec[]; state: SwarmState; openQuestions: string[] } {
  const records: RelationRec[] = [];
  const openQuestions: string[] = [];
  let n = 0;
  let next = state;
  const add = (source: string, target: string, relation: Relation["relation"], held: boolean) => {
    n += 1;
    const relationId = formatId("R", n);
    next = take(next, registry, documentId, [relationId]);
    records.push({ source_id: source, target_id: target, relation, held });
  };

  for (const concept of concepts) {
    if (concept.held) continue;
    const needle = concept.term.toLowerCase();
    if (needle.length < 3) continue;
    for (const workflow of workflows) {
      if (workflow.held) continue;
      const blob = `${workflow.trigger} ${workflow.steps.map((step) => step.action).join(" ")}`.toLowerCase();
      if (blob.includes(needle)) add(concept.id, workflow.id, "part_of", false);
    }
  }

  for (const theory of theories) {
    if (theory.causal !== "yes") continue;
    const words = contentWords(theory.claim);
    const hits = facts.filter((fact) => overlap(words, contentWords(fact.statement)) >= 3);
    if (hits.length === 1) add(theory.id, hits[0].id, "causes", theory.held || hits[0].held);
  }

  for (const fact of facts) {
    const text = fact.statement;
    if (!isContrast(text)) continue;
    const words = contentWords(text);
    let best: { id: string; score: number } | null = null;
    for (const other of facts) {
      if (other.id === fact.id) continue;
      if (other.polarity === fact.polarity) continue;
      const score = overlap(words, contentWords(other.statement));
      if (score >= 2 && (!best || score > best.score)) best = { id: other.id, score };
    }
    if (!best) {
      openQuestions.push(`No opposing fact for contrast unit on ${fact.id}`);
      continue;
    }
    const other = facts.find((item) => item.id === best?.id);
    add(fact.id, best.id, "contradicts", fact.held || Boolean(other?.held));
  }

  return { records, state: next, openQuestions };
}

function critique(
  source: string,
  tables: TableInput[],
  facts: FactRec[],
  theories: TheoryRec[],
  concepts: ConceptRec[],
  workflows: WorkflowRec[],
): { holdUnits: string[]; open: string[]; rejected: SwarmState["rejected_labels"] } {
  const corpus = [source, ...tables.flatMap((table) => table.rows.map((row) => row.join(" | ")))].join("\n");
  const holdUnits: string[] = [];
  const rejected: SwarmState["rejected_labels"] = [];
  const seen = new Set<string>();
  const check = (id: string, unitId: string, quote: string) => {
    if (seen.has(id)) {
      rejected.push({ unit_id: unitId, label: id, reason: "duplicate id" });
    }
    seen.add(id);
    if (quote && !corpus.includes(quote)) {
      rejected.push({ unit_id: unitId, label: "evidence_quote", reason: "quote is not an exact substring" });
      holdUnits.push(unitId);
    }
  };
  for (const fact of facts) check(fact.id, fact.unit_ids[0], fact.evidence_quote);
  for (const theory of theories) check(theory.id, theory.unit_ids[0], theory.evidence_quote);
  for (const concept of concepts) {
    if (concept.definition_present === "yes") check(concept.id, concept.unit_ids[0], concept.definition_quote);
    else check(concept.id, concept.unit_ids[0], "");
  }
  for (const workflow of workflows) {
    for (const step of workflow.steps) {
      if (!step.order || !step.actor) {
        rejected.push({ unit_id: workflow.id, label: "workflow_step", reason: "step missing order or actor" });
      }
      if (step.action && !corpus.includes(step.action)) {
        rejected.push({ unit_id: workflow.id, label: "action", reason: "step action is not an exact substring" });
      }
    }
  }
  return { holdUnits, open: [], rejected };
}

function project(
  units: Unit[],
  boilerplate: Set<string>,
  concepts: ConceptRec[],
  facts: FactRec[],
  theories: TheoryRec[],
  workflows: WorkflowRec[],
  relations: RelationRec[],
): ExtractionOutput {
  const covered = new Set<string>(boilerplate);
  for (const concept of concepts) {
    if (!concept.held) concept.unit_ids.forEach((unitId) => covered.add(unitId));
  }
  for (const fact of facts) {
    if (!fact.held) fact.unit_ids.forEach((unitId) => covered.add(unitId));
  }
  for (const theory of theories) {
    if (!theory.held) theory.unit_ids.forEach((unitId) => covered.add(unitId));
  }
  for (const workflow of workflows) {
    if (!workflow.held) workflow.unit_ids.forEach((unitId) => covered.add(unitId));
  }
  const unassigned = units.filter((unit) => !covered.has(unit.id)).map((unit) => unit.text);
  const live = new Set<string>([
    ...concepts.filter((item) => !item.held).map((item) => item.id),
    ...facts.filter((item) => !item.held).map((item) => item.id),
    ...theories.filter((item) => !item.held).map((item) => item.id),
    ...workflows.filter((item) => !item.held).map((item) => item.id),
  ]);
  return {
    concepts: concepts.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
    facts: facts.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
    theories: theories.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
    workflows: workflows.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
    relations: relations
      .filter((item) => !item.held && live.has(item.source_id) && live.has(item.target_id))
      .map(({ held: _h, ...item }) => item),
    coverage: {
      segments_total: units.length,
      segments_classified: units.length - unassigned.length,
      unassigned_quotes: unassigned,
    },
  };
}

function take(state: SwarmState, registry: MemoryRegistry, documentId: string, ids: string[]): SwarmState {
  for (const id of ids) registry.issue(documentId, id);
  return echoState(state, { ...state, ids_used: [...state.ids_used, ...ids] });
}

function termOf(text: string): string {
  const match = /^(.{2,80}?)\s+(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(text.trim());
  if (!match) return text.trim().slice(0, 80);
  return match[1].replace(/^(a|an|the)\s+/i, "").trim();
}

function definitionQuote(text: string): string {
  const match = /\b(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(text);
  if (!match || match.index === undefined) return "";
  return shortQuote(text.slice(match.index + match[0].length).trim());
}

function conceptType(term: string, text: string, fallback: ConceptType | "not_applicable"): ConceptType {
  if (fallback !== "not_applicable") return fallback;
  if (/\b(score|rate|ratio|index|threshold|percent|count|sum)\b/i.test(term)) return "metric";
  if (/\b(callback|procedure|process|protocol|workflow)\b/i.test(term)) return "process";
  if (/\b(score|rate|sum)\b/i.test(text)) return "metric";
  return "other";
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const word of a) if (b.has(word)) n += 1;
  return n;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function factPolarity(value: string): FactPolarity | null {
  if (value === "affirmed" || value === "denied" || value === "conditional") return value;
  return null;
}

function theoryStatus(status: TheoryStatus): Theory["status"] {
  if (
    status === "hypothesis" ||
    status === "model" ||
    status === "prediction" ||
    status === "interpretation"
  ) {
    return status;
  }
  return "interpretation";
}

