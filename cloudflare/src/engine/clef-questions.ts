import type { Unit } from "./types.ts";

/**
 * Schema authoring note.
 * Written once. Grok is the planner and does not re-classify each sentence.
 * The Decision Worker sends this object to Clef on every unit.
 * Clef has no free-text answers. Evidence quotes come from the segmenter.
 *
 * Assumption (2026-10-02): Clef question types are noul, choice, and score.
 * This schema uses only noul (yes-probability; there is no separate boolean
 * type) and choice. Score is intentionally unused.
 */
export const CLEF_QUESTIONS = {
  boilerplate: {
    type: "noul",
    instructions:
      "Is `text` only a heading, running header, page number, or other non-claim that asserts nothing?",
  },
  deterministic: {
    type: "noul",
    instructions:
      "Does `text` state the claim as a fact, with no hedge such as may, might, could, likely, or suggests?",
  },
  quantity_present: {
    type: "noul",
    instructions: "Does `text` contain a number, count, percent, or clock time?",
  },
  definition_present: {
    type: "noul",
    instructions:
      "Does `text` define a term with 'defined as', 'means', or 'refers to'?",
  },
  decision_point: {
    type: "noul",
    instructions:
      "Does `text` mark an explicit decision, such as if, whether, otherwise, or decide?",
  },
  fully_specified: {
    type: "noul",
    instructions:
      "Does `text` name the actor and either an input or an output of this step? Answer no if either is missing.",
  },
  external_check: {
    type: "noul",
    instructions:
      "Does `text` rely on a citation, guideline, or outside source that is not contained in `text`?",
  },
  polarity: {
    type: "choice",
    instructions:
      "What polarity does `text` assert? If it both negates and states a condition, choose conditional. If you cannot tell, choose unclear.",
    criteria: {
      affirmed: "The sentence asserts the claim.",
      denied: "The sentence asserts that the claim is not the case.",
      conditional: "The claim depends on an explicit if, unless, or when.",
      unclear: "The sentence does not show which of the above applies.",
    },
  },
  record_kind: {
    type: "choice",
    instructions:
      "What kind of record is `text`? Choose one. Do not summarize. Judge only `text`.",
    criteria: {
      fact: "A checkable claim stated as fact, not a definition, step, or hedged reading.",
      theory: "A hypothesis, model, interpretation, prediction, or hedged causal reading.",
      concept: "A named term being defined.",
      workflow_step: "An ordered action, trigger, or decision in a described procedure.",
      none: "No claim, definition, or step.",
    },
  },
  theory_status: {
    type: "choice",
    instructions:
      "If `text` is a theory, which status fits? Otherwise choose not_applicable.",
    criteria: {
      hypothesis: "Hedged with may, might, could, or named as a hypothesis.",
      model: "Named as a model or framework.",
      interpretation: "A reading of evidence, including 'according to' or 'interpretation'.",
      prediction: "A forecast about a future outcome.",
      not_applicable: "Text is not a theory.",
    },
  },
  causal: {
    type: "choice",
    instructions:
      "Does `text` state a cause, using because, causes, leads to, results in, or due to? Choose unclear only if the causal direction is stated and cannot be read.",
    criteria: {
      yes: "An explicit causal connective is present.",
      no: "No causal connective is present.",
      unclear: "Causal language is present but the direction cannot be read.",
    },
  },
  falsifiable: {
    type: "choice",
    instructions:
      "If `text` is a theory, can it be falsified from what `text` itself says? Choose unclear unless the sentence states a measurement or says it cannot be tested. Do not use outside knowledge.",
    criteria: {
      yes: "The sentence states a measurement, threshold, or other explicit test.",
      no: "The sentence says the claim cannot be tested.",
      unclear: "The sentence does not say how the claim would be tested.",
    },
  },
  time_scope: {
    type: "choice",
    instructions:
      "What time does the main claim in `text` sit in? Choose unspecified if cues conflict or are absent. 'Shall' as a standing rule is present, not future.",
    criteria: {
      past: "The main verb is past or the sentence reports a completed event.",
      present: "The sentence states a current fact or a standing rule.",
      future: "The sentence uses will or an explicit future forecast.",
      unspecified: "No single time scope is shown.",
    },
  },
  concept_type: {
    type: "choice",
    instructions:
      "If `text` defines a term, what type is that term? Otherwise choose not_applicable.",
    criteria: {
      entity: "A named organization, place, person, or product.",
      process: "A procedure, protocol, callback, or pipeline.",
      metric: "A score, rate, count, threshold, or index.",
      role: "A person-role such as nurse, physician, or operator.",
      tool: "A system, database, or software tool.",
      other: "A defined term that is none of the above.",
      not_applicable: "Text does not define a term.",
    },
  },
} as const;

export interface ClefRequest {
  model: "clef" | "clef-flash";
  state: {
    section: string;
    unit_id: string;
    text: string;
    before: string;
    after: string;
  };
  questions: typeof CLEF_QUESTIONS;
}

export function buildClefRequest(
  unit: Unit,
  neighbors: { before?: string; after?: string },
  model: "clef" | "clef-flash" = "clef-flash",
): ClefRequest {
  return {
    model,
    state: {
      section: unit.section_path,
      unit_id: unit.id,
      text: unit.text,
      before: clip(neighbors.before ?? ""),
      after: clip(neighbors.after ?? ""),
    },
    questions: CLEF_QUESTIONS,
  };
}

function clip(text: string): string {
  const clean = text.trim();
  if (clean.length <= 180) return clean;
  const slice = clean.slice(0, 180);
  const sp = slice.lastIndexOf(" ");
  return sp > 80 ? slice.slice(0, sp) : slice;
}
