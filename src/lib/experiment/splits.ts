import type { ExperimentCase } from "./core.ts";

/** A protected run must only receive explicitly protected cases. */
export function casesForSplit(cases: readonly ExperimentCase[], split: ExperimentCase["split"]): ExperimentCase[] {
  return cases.filter((item) => item.split === split);
}

export function assertSplitIsolation(cases: readonly ExperimentCase[], selected: readonly ExperimentCase[], split: ExperimentCase["split"]): void {
  if (selected.some((item) => item.split !== split)) throw new Error(`${split} run contains a case from another split`);
  const known = new Set(cases.map((item) => item.id));
  if (selected.some((item) => !known.has(item.id))) throw new Error("run contains an unknown case");
}
