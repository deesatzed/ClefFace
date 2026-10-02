import type { ExperimentCase } from "./core.ts";

export type EvidenceKind = "simulated" | "recorded" | "live";

export interface ModelResponse {
  id: string;
  caseId: string;
  providerId: string;
  modelId: string;
  evidenceKind: EvidenceKind;
  baselineAnswer: string;
  variantAnswer: string;
  rationale: string;
}

export function simulatedResponses(item: ExperimentCase): ModelResponse[] {
  return [
    {
      id: `${item.id}:careful-simulator`,
      caseId: item.id,
      providerId: "offline",
      modelId: "careful-simulator",
      evidenceKind: "simulated",
      baselineAnswer: item.expectedBaseline,
      variantAnswer: item.expectedVariant,
      rationale: "A deterministic offline control that follows the case oracle. It is not observed model behavior.",
    },
    {
      id: `${item.id}:wording-simulator`,
      caseId: item.id,
      providerId: "offline",
      modelId: "wording-simulator",
      evidenceKind: "simulated",
      baselineAnswer: item.expectedBaseline,
      variantAnswer: item.category === "meaning_change" ? item.expectedBaseline : item.expectedVariant,
      rationale: "A deterministic contrast control. It intentionally misses meaning-changing edits to make the comparison surface concrete.",
    },
  ];
}
