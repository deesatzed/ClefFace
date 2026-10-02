/** Closed labels for the extraction contract. Unclear is never guessed into a stricter label. */

export type YesNo = "yes" | "no";
export type Polarity = "affirmed" | "denied" | "conditional" | "unclear";
export type FactPolarity = "affirmed" | "denied" | "conditional";
export type RecordKind = "fact" | "theory" | "concept" | "workflow_step" | "none";
export type TheoryStatus =
  | "hypothesis"
  | "model"
  | "interpretation"
  | "prediction"
  | "not_applicable";
export type Ternary = "yes" | "no" | "unclear";
export type TimeScope = "past" | "present" | "future" | "unspecified";
export type ConceptType =
  | "entity"
  | "process"
  | "metric"
  | "role"
  | "tool"
  | "other";
export type RelationName =
  | "defines"
  | "causes"
  | "part_of"
  | "precedes"
  | "contradicts"
  | "supports"
  | "uses";
export type ReviewReason =
  | "low_confidence"
  | "unclear"
  | "conflict"
  | "rejected_label"
  | "external_check_required";
export type ResolutionAction = "accept" | "boilerplate" | "file_as_fact";

export interface SwarmState {
  ids_used: string[];
  open_questions: string[];
  rejected_labels: { unit_id: string; label: string; reason: string }[];
}

export interface TableInput {
  name?: string;
  rows: string[][];
}

export interface Chunk {
  id: string;
  heading: string;
  word_count: number;
  text: string;
}

export interface Unit {
  id: string;
  chunk_id: string;
  ordinal: number;
  section_path: string;
  text: string;
  from_table: boolean;
  list_order: number | null;
}

export interface Concept {
  id: string;
  term: string;
  definition_present: YesNo;
  definition_quote: string;
  type: ConceptType;
}

export interface Fact {
  id: string;
  statement: string;
  evidence_quote: string;
  deterministic: YesNo;
  polarity: FactPolarity;
  time_scope: TimeScope;
  quantity_present: YesNo;
}

export interface Theory {
  id: string;
  claim: string;
  evidence_quote: string;
  status: Exclude<TheoryStatus, "not_applicable">;
  causal: Ternary;
  falsifiable: Ternary;
  conflicts_with_fact_id: string;
}

export interface WorkflowStep {
  order: number;
  action: string;
  actor: string;
  input: string;
  output: string;
  decision: YesNo;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  steps: WorkflowStep[];
  end_condition: string;
  roles: string[];
  tools_mentioned: YesNo;
  fully_specified: YesNo;
}

export interface Relation {
  source_id: string;
  target_id: string;
  relation: RelationName;
}

export interface Coverage {
  segments_total: number;
  segments_classified: number;
  unassigned_quotes: string[];
}

export interface ExtractionOutput {
  concepts: Concept[];
  facts: Fact[];
  theories: Theory[];
  workflows: Workflow[];
  relations: Relation[];
  coverage: Coverage;
}

export interface ReviewItem {
  id: string;
  unit_id: string;
  section_path: string;
  quote: string;
  reasons: ReviewReason[];
  confidence: number;
  proposed_kind: RecordKind;
  proposed_polarity: Polarity;
  proposed_status: TheoryStatus;
  causal: Ternary;
  falsifiable: Ternary;
  deterministic: YesNo;
  conflict: boolean;
}

export interface NormalizedDecision {
  unit_id: string;
  boilerplate: YesNo;
  deterministic: YesNo;
  quantity_present: YesNo;
  definition_present: YesNo;
  decision_point: YesNo;
  fully_specified: YesNo;
  polarity: Polarity;
  record_kind: RecordKind;
  theory_status: TheoryStatus;
  causal: Ternary;
  falsifiable: Ternary;
  time_scope: TimeScope;
  concept_type: ConceptType | "not_applicable";
  external_check: YesNo;
  confidence: number;
  conflict: boolean;
  model: string;
}

export interface Resolution {
  unit_id: string;
  action: ResolutionAction;
  polarity?: FactPolarity;
}

export interface Job {
  id: string;
  status: "complete" | "needs_review";
  engine: string;
  threshold: number;
  output: ExtractionOutput;
  review: ReviewItem[];
  units: Unit[];
  chunks: { id: string; heading: string; word_count: number }[];
  decisions: NormalizedDecision[];
  state: SwarmState;
}
