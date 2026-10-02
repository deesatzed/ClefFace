import { createReplayArtifact, type ReplayArtifact } from "./artifacts.ts";
import { createCase, createExperiment, sha256, type InterventionCategory } from "./core.ts";

export interface ExploratoryCaseDraft {
  title: string;
  source: string;
  question: string;
  answers: string;
  target: string;
  replacement: string;
  category: InterventionCategory;
  expectedBaseline: string;
  expectedVariant: string;
  rationale: string;
}

/** Builds one review-required case from exact source text; no model call occurs. */
export function createExploratoryArtifact(draft: ExploratoryCaseDraft): ReplayArtifact {
  const experiment = createExperiment({ title: draft.title, source: draft.source, question: draft.question, answers: draft.answers.split(",") });
  const target = draft.target.trim();
  const start = experiment.source.normalized.indexOf(target);
  if (!target || start < 0) throw new Error("The exact source text to replace was not found.");
  if (experiment.source.normalized.indexOf(target, start + target.length) >= 0) throw new Error("The exact source text appears more than once. Use a more specific span.");
  const item = createCase(experiment, {
    id: `case_${sha256(`${experiment.id}:${start}:${target}:${draft.replacement}`).slice(0, 16)}`,
    category: draft.category,
    patch: { start, end: start + target.length, replacement: draft.replacement, expected: target },
    expectedBaseline: draft.expectedBaseline,
    expectedVariant: draft.expectedVariant,
    rationale: draft.rationale,
    validation: "exploratory",
  });
  return createReplayArtifact(experiment, [item], []);
}
