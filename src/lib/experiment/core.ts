export const EXPERIMENT_SCHEMA_VERSION = "evidence-lab/v1";

export type InterventionCategory = "meaning_change" | "meaning_preserving" | "evidence_removal";
export type ValidationStatus = "validated" | "exploratory" | "rejected";
export type CaseSplit = "development" | "protected";

export interface SourceVersion {
  id: string;
  original: string;
  normalized: string;
  sha256: string;
}

export interface TextPatch {
  start: number;
  end: number;
  replacement: string;
  expected?: string;
}

export interface Experiment {
  id: string;
  schemaVersion: typeof EXPERIMENT_SCHEMA_VERSION;
  title: string;
  source: SourceVersion;
  question: string;
  answers: readonly string[];
  createdAt: string;
}

export interface CreateExperimentInput {
  title: string;
  source: string;
  question: string;
  answers: readonly string[];
  /** ISO-8601 UTC timestamp; fixtures may supply a fixed value for replay. */
  createdAt?: string;
}

export interface ExperimentCase {
  id: string;
  parentExperimentId: string;
  category: InterventionCategory;
  patch: TextPatch;
  expectedBaseline: string;
  expectedVariant: string;
  rationale: string;
  validation: ValidationStatus;
  split: CaseSplit;
  variant: SourceVersion;
}

export interface CreateCaseInput {
  id: string;
  category: InterventionCategory;
  patch: TextPatch;
  expectedBaseline: string;
  expectedVariant: string;
  rationale: string;
  validation?: ValidationStatus;
  split?: CaseSplit;
}

export interface CaseValidation {
  valid: boolean;
  errors: string[];
}

export function normalizeSource(source: string): string {
  return source.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

export function createSourceVersion(source: string): SourceVersion {
  const normalized = normalizeSource(source);
  if (!normalized) throw new Error("source is required");
  const digest = sha256(normalized);
  return { id: `source_${digest.slice(0, 16)}`, original: source, normalized, sha256: digest };
}

export function createExperiment(input: CreateExperimentInput): Experiment {
  const title = input.title.trim();
  const question = input.question.trim();
  if (!title) throw new Error("title is required");
  if (!question) throw new Error("question is required");
  const answers = [...new Set(input.answers.map((answer) => answer.trim()).filter(Boolean))];
  if (answers.length < 2) throw new Error("at least two answers are required");
  if (!answers.includes("insufficient_evidence")) throw new Error("insufficient_evidence must be an allowed answer");
  const source = createSourceVersion(input.source);
  const id = `experiment_${sha256(`${source.sha256}\n${question}\n${answers.join("\n")}`).slice(0, 16)}`;
  return {
    id,
    schemaVersion: EXPERIMENT_SCHEMA_VERSION,
    title,
    source,
    question,
    answers,
    createdAt: validIso(input.createdAt) ?? new Date().toISOString(),
  };
}

function validIso(value: string | undefined): string | null {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

export function applyPatch(source: string, patch: TextPatch): string {
  if (!Number.isInteger(patch.start) || !Number.isInteger(patch.end) || patch.start < 0 || patch.end < patch.start || patch.end > source.length) {
    throw new Error("invalid patch range");
  }
  const actual = source.slice(patch.start, patch.end);
  if (patch.expected !== undefined && actual !== patch.expected) throw new Error("patch mismatch");
  return `${source.slice(0, patch.start)}${patch.replacement}${source.slice(patch.end)}`;
}

export function createCase(experiment: Experiment, input: CreateCaseInput): ExperimentCase {
  const variant = createSourceVersion(applyPatch(experiment.source.normalized, input.patch));
  const item: ExperimentCase = {
    id: input.id.trim(),
    parentExperimentId: experiment.id,
    category: input.category,
    patch: { ...input.patch },
    expectedBaseline: input.expectedBaseline.trim(),
    expectedVariant: input.expectedVariant.trim(),
    rationale: input.rationale.trim(),
    validation: input.validation ?? "validated",
    split: input.split ?? "development",
    variant,
  };
  const validation = validateCase(experiment, item);
  if (!validation.valid) throw new Error(validation.errors.join("; "));
  return item;
}

export function validateCase(experiment: Experiment, item: ExperimentCase): CaseValidation {
  const errors: string[] = [];
  if (!item.id) errors.push("case id is required");
  if (item.parentExperimentId !== experiment.id) errors.push("case belongs to another experiment");
  if (!experiment.answers.includes(item.expectedBaseline)) errors.push("baseline answer is outside answer schema");
  if (!experiment.answers.includes(item.expectedVariant)) errors.push("variant answer is outside answer schema");
  if (!item.rationale) errors.push("case rationale is required");
  if (item.split !== "development" && item.split !== "protected") errors.push("case split is invalid");
  if (item.validation === "validated" && item.category === "meaning_change" && item.expectedBaseline === item.expectedVariant) {
    errors.push("meaning change requires a changed expected answer");
  }
  if (item.validation === "validated" && item.category === "meaning_preserving" && item.expectedBaseline !== item.expectedVariant) {
    errors.push("meaning preservation requires an unchanged expected answer");
  }
  return { valid: errors.length === 0, errors };
}

/** A synchronous, browser-safe SHA-256 used to content-address source snapshots. */
export function sha256(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 9 + 63) >> 6) << 6);
  const data = new Uint8Array(paddedLength);
  data.set(bytes);
  data[bytes.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 2 ** 32), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  for (let offset = 0; offset < data.length; offset += 64) {
    const words = new Uint32Array(64);
    for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const a = words[i - 15];
      const b = words[i - 2];
      const s0 = rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3);
      const s1 = rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10);
      words[i] = (((words[i - 16] + s0) | 0) + ((words[i - 7] + s1) | 0)) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i++) {
      const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
      const choose = (e & f) ^ (~e & g);
      const t1 = (((((h + s1) | 0) + choose) | 0) + constants[i] + words[i]) >>> 0;
      const s0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + majority) >>> 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) >>> 0, c, b, a, (t1 + t2) >>> 0];
    }
    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }
  return hash.map((part) => part.toString(16).padStart(8, "0")).join("");
}

function rotate(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}
