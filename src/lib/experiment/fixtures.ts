import { createCase, createExperiment, type Experiment, type ExperimentCase, type InterventionCategory } from "./core.ts";

export interface SeedExperiment {
  experiment: Experiment;
  cases: ExperimentCase[];
}

const answers = ["yes", "no", "insufficient_evidence"] as const;

export function buildSeedExperiments(): SeedExperiment[] {
  return [
    thresholdSeed(),
    exceptionSeed(),
    actorSeed(),
    insufficiencySeed(),
  ];
}

export function featuredSeed(): SeedExperiment {
  return thresholdSeed();
}

function thresholdSeed(): SeedExperiment {
  const source = "Files larger than 10 MB require review. Exactly 10 MB does not require review.";
  const experiment = createExperiment({ title: "Threshold boundary", source, question: "Does an 8 MB file require review?", answers, createdAt: "2026-10-02T00:00:00.000Z" });
  return { experiment, cases: [
    make(experiment, "threshold-meaning", "meaning_change", "10 MB", "5 MB", "no", "yes", "Lowering the threshold to 5 MB makes an 8 MB file require review."),
    make(experiment, "threshold-preserving", "meaning_preserving", "larger than", "strictly greater than", "no", "no", "The two phrases have the same boundary meaning in this source."),
    make(experiment, "threshold-removal", "evidence_removal", "Files larger than 10 MB require review. ", "", "no", "insufficient_evidence", "Removing the only general threshold leaves no basis for deciding the 8 MB case."),
  ] };
}

function exceptionSeed(): SeedExperiment {
  const source = "All external reports require review unless they are marked training-only. Training-only reports do not require review.";
  const experiment = createExperiment({ title: "Exception scope", source, question: "Does a training-only external report require review?", answers, createdAt: "2026-10-02T00:00:00.000Z" });
  return { experiment, cases: [
    make(experiment, "exception-meaning", "meaning_change", "unless they are marked training-only", "including those marked training-only", "no", "yes", "Replacing the exception with inclusion reverses the treatment of training-only reports."),
    make(experiment, "exception-preserving", "meaning_preserving", "do not require review", "are exempt from review", "no", "no", "The replacement preserves the explicit exception."),
    make(experiment, "exception-removal", "evidence_removal", "unless they are marked training-only", "", "no", "insufficient_evidence", "Without the exception clause, the source gives conflicting treatment for training-only reports."),
  ] };
}

function actorSeed(): SeedExperiment {
  const source = "Only the release manager may approve production changes. Engineers may prepare changes but may not approve them.";
  const experiment = createExperiment({ title: "Actor scope", source, question: "May an engineer approve a production change?", answers, createdAt: "2026-10-02T00:00:00.000Z" });
  return { experiment, cases: [
    make(experiment, "actor-meaning", "meaning_change", "release manager", "engineer", "no", "yes", "Changing the authorized actor grants approval to an engineer."),
    make(experiment, "actor-preserving", "meaning_preserving", "may not approve them", "cannot approve them", "no", "no", "The prohibition remains explicit."),
    make(experiment, "actor-removal", "evidence_removal", "Engineers may prepare changes but may not approve them.", "", "no", "insufficient_evidence", "Removing the engineer-specific sentence leaves no statement about an engineer's permission."),
  ] };
}

function insufficiencySeed(): SeedExperiment {
  const source = "The archive contains reports from 2024. The source does not state whether the archive is encrypted.";
  const experiment = createExperiment({ title: "Insufficient evidence", source, question: "Is the archive encrypted?", answers, createdAt: "2026-10-02T00:00:00.000Z" });
  return { experiment, cases: [
    make(experiment, "insufficient-meaning", "meaning_change", "does not state whether the archive is encrypted", "states that the archive is encrypted", "insufficient_evidence", "yes", "The edit changes missing evidence into direct support."),
    make(experiment, "insufficient-preserving", "meaning_preserving", "contains reports from 2024", "holds reports created in 2024", "insufficient_evidence", "insufficient_evidence", "The date wording is unrelated to encryption."),
    make(experiment, "insufficient-removal", "evidence_removal", "The source does not state whether the archive is encrypted.", "", "insufficient_evidence", "insufficient_evidence", "Removing an explicit uncertainty statement does not create encryption evidence."),
  ] };
}

function make(
  experiment: Experiment,
  id: string,
  category: InterventionCategory,
  target: string,
  replacement: string,
  expectedBaseline: string,
  expectedVariant: string,
  rationale: string,
): ExperimentCase {
  const start = experiment.source.normalized.indexOf(target);
  if (start < 0) throw new Error(`fixture target missing: ${target}`);
  return createCase(experiment, {
    id,
    category,
    patch: { start, end: start + target.length, replacement: replacement, expected: target },
    expectedBaseline,
    expectedVariant,
    rationale,
  });
}
