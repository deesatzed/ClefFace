import {
  EXPERIMENT_SCHEMA_VERSION,
  type Experiment,
  type ExperimentCase,
  type TextPatch,
  createCase,
  createExperiment,
  validateCase,
} from "./core.ts";
import type { ModelResponse } from "./providers.ts";

export const ARTIFACT_KIND = "evidence-lab/replay";
export const CASE_JSONL_KIND = "evidence-lab/case";

export interface ReplayArtifact {
  kind: typeof ARTIFACT_KIND;
  schemaVersion: typeof EXPERIMENT_SCHEMA_VERSION;
  exportedAt: string;
  experiment: Experiment;
  cases: ExperimentCase[];
  responses: ModelResponse[];
}

export interface ImportResult {
  artifact?: ReplayArtifact;
  errors: string[];
}

/** Produces a portable, JSON-only receipt with explicit response provenance. */
export function createReplayArtifact(
  experiment: Experiment,
  cases: ExperimentCase[],
  responses: ModelResponse[],
  exportedAt = new Date().toISOString(),
): ReplayArtifact {
  const errors = cases.flatMap((item) => validateCase(experiment, item).errors.map((error) => `${item.id}: ${error}`));
  if (errors.length) throw new Error(`cannot export invalid cases: ${errors.join("; ")}`);
  if (responses.some((response) => !cases.some((item) => item.id === response.caseId))) {
    throw new Error("cannot export response without a known case");
  }
  return { kind: ARTIFACT_KIND, schemaVersion: EXPERIMENT_SCHEMA_VERSION, exportedAt, experiment, cases, responses };
}

/** Parse untrusted JSON defensively and rebuild canonical source identities. */
export function parseReplayArtifact(json: string): ImportResult {
  try {
    const raw: unknown = JSON.parse(json);
    if (!isRecord(raw)) return { errors: ["artifact must be an object"] };
    if (raw.kind !== ARTIFACT_KIND) return { errors: ["unsupported artifact kind"] };
    if (raw.schemaVersion !== EXPERIMENT_SCHEMA_VERSION) return { errors: ["unsupported schema version"] };
    if (!isRecord(raw.experiment) || !Array.isArray(raw.cases) || !Array.isArray(raw.responses)) {
      return { errors: ["artifact requires experiment, cases, and responses"] };
    }
    const experiment = createExperiment({
      title: stringValue(raw.experiment.title),
      source: isRecord(raw.experiment.source) ? stringValue(raw.experiment.source.original) : "",
      question: stringValue(raw.experiment.question),
      answers: stringArray(raw.experiment.answers),
      createdAt: stringValue(raw.experiment.createdAt),
    });
    const cases = raw.cases.map((value, index) => rebuildCase(experiment, value, index));
    const responses = raw.responses.map((value, index) => rebuildResponse(value, index));
    const artifact = createReplayArtifact(experiment, cases, responses, stringValue(raw.exportedAt) || new Date(0).toISOString());
    return { artifact, errors: [] };
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : "invalid artifact"] };
  }
}

/** One self-sufficient record per case for line-oriented tools and review. */
export function serializeCasesJsonl(artifact: ReplayArtifact): string {
  return artifact.cases.map((item) => JSON.stringify({
    kind: CASE_JSONL_KIND,
    schemaVersion: EXPERIMENT_SCHEMA_VERSION,
    exportedAt: artifact.exportedAt,
    experiment: artifact.experiment,
    case: item,
    responses: artifact.responses.filter((response) => response.caseId === item.id),
  })).join("\n");
}

export function parseCasesJsonl(text: string): ImportResult {
  try {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return { errors: ["JSONL contains no records"] };
    const records = lines.map((line, index) => {
      const record: unknown = JSON.parse(line);
      if (!isRecord(record) || record.kind !== CASE_JSONL_KIND || record.schemaVersion !== EXPERIMENT_SCHEMA_VERSION || !isRecord(record.experiment) || !isRecord(record.case) || !Array.isArray(record.responses)) {
        throw new Error(`line ${index + 1} is not an evidence-lab case record`);
      }
      return record;
    });
    const first = records[0]!;
    const experiment = JSON.stringify(first.experiment);
    if (records.some((record) => JSON.stringify(record.experiment) !== experiment)) return { errors: ["JSONL records contain more than one experiment"] };
    const cases = records.map((record) => record.case);
    const responses = records.flatMap((record) => record.responses);
    return parseReplayArtifact(JSON.stringify({ kind: ARTIFACT_KIND, schemaVersion: EXPERIMENT_SCHEMA_VERSION, exportedAt: first.exportedAt, experiment: first.experiment, cases, responses }));
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : "invalid JSONL"] };
  }
}

export function parseArtifactText(text: string): ImportResult {
  const trimmed = text.trim();
  if (!trimmed) return { errors: ["artifact is empty"] };
  if (trimmed.includes("\n")) {
    try {
      const first: unknown = JSON.parse(trimmed.split(/\r?\n/).find((line) => line.trim()) ?? "");
      if (isRecord(first) && first.kind === CASE_JSONL_KIND) return parseCasesJsonl(trimmed);
    } catch { /* parseReplayArtifact supplies the actionable JSON error */ }
  }
  return parseReplayArtifact(trimmed);
}

function rebuildCase(experiment: Experiment, value: unknown, index: number): ExperimentCase {
  if (!isRecord(value) || !isRecord(value.patch)) throw new Error(`case ${index} is malformed`);
  const patch: TextPatch = {
    start: numberValue(value.patch.start), end: numberValue(value.patch.end), replacement: stringValue(value.patch.replacement),
    ...(typeof value.patch.expected === "string" ? { expected: value.patch.expected } : {}),
  };
  const category = value.category;
  if (category !== "meaning_change" && category !== "meaning_preserving" && category !== "evidence_removal") throw new Error(`case ${index} has an invalid category`);
  const validation = value.validation;
  if (validation !== "validated" && validation !== "exploratory" && validation !== "rejected") throw new Error(`case ${index} has an invalid validation status`);
  const split = value.split;
  if (split !== undefined && split !== "development" && split !== "protected") throw new Error(`case ${index} has an invalid split`);
  return createCase(experiment, {
    id: stringValue(value.id), category, patch, expectedBaseline: stringValue(value.expectedBaseline),
    expectedVariant: stringValue(value.expectedVariant), rationale: stringValue(value.rationale), validation, ...(split ? { split } : {}),
  });
}

function rebuildResponse(value: unknown, index: number): ModelResponse {
  if (!isRecord(value)) throw new Error(`response ${index} is malformed`);
  const evidenceKind = value.evidenceKind;
  if (evidenceKind !== "simulated" && evidenceKind !== "recorded" && evidenceKind !== "live") throw new Error(`response ${index} has an invalid evidence kind`);
  return {
    id: stringValue(value.id), caseId: stringValue(value.caseId), providerId: stringValue(value.providerId), modelId: stringValue(value.modelId),
    evidenceKind, baselineAnswer: stringValue(value.baselineAnswer), variantAnswer: stringValue(value.variantAnswer), rationale: stringValue(value.rationale),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function stringValue(value: unknown): string { return typeof value === "string" ? value : ""; }
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function numberValue(value: unknown): number { if (typeof value !== "number" || !Number.isInteger(value)) throw new Error("patch offsets must be integers"); return value; }
