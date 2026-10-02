/** Models the Send page can call. Cloud rows send the document off this computer. */
export interface DecisionEngine {
  id: string;
  label: string;
  detail: string;
  leavesMachine: boolean;
  model?: string;
}

export const DECISION_ENGINES: DecisionEngine[] = [
  {
    id: "local",
    label: "Clef on this computer",
    detail: "Slow. The text stays here.",
    leavesMachine: false,
  },
  {
    id: "jev",
    label: "Jev",
    detail: "OpenRouter. One test sentence here took 295 ms. The text is sent to OpenRouter.",
    leavesMachine: true,
    model: "typesafe/jev-1.13",
  },
  {
    id: "mercury",
    label: "Mercury Decide",
    detail: "OpenRouter, no charge on their free route. One test sentence here took 335 ms. The text is sent to OpenRouter.",
    leavesMachine: true,
    model: "inception/mercury-decide:free",
  },
  {
    id: "liquid",
    label: "Liquid D1",
    detail: "OpenRouter. One test sentence here took 294 ms. The text is sent to OpenRouter.",
    leavesMachine: true,
    model: "liquid/d1",
  },
];

export function findEngine(id: string | undefined): DecisionEngine | undefined {
  return DECISION_ENGINES.find((engine) => engine.id === (id || "local"));
}
