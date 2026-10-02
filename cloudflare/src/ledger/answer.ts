import { contentTokens, dot, embedText } from "./embed.ts";
import type { LedgerRecord, LedgerView } from "./project.ts";

export interface Hit {
  version_id: string;
  version_title: string;
  record_id: string;
  kind: LedgerRecord["kind"];
  label: string;
  quote: string;
  score: number;
}

export interface LedgerAnswer {
  stance: "grounded" | "conflict" | "unspecified" | "empty";
  gate: "closed" | "held";
  held_records: number;
  scorer: "words" | "webgpu";
  text: string;
  hits: Hit[];
  contradictions: { version_id: string; source_id: string; target_id: string }[];
}

const MIN_OVERLAP = 0.34;

/** Word overlap first. Optional WebGPU scores may only reorder records that already overlap. */
export function answerQuestion(
  query: string,
  views: LedgerView[],
  gpuScores?: Map<string, number> | null,
): LedgerAnswer {
  const asked = query.trim();
  const held = views.reduce((sum, view) => sum + view.review_count, 0);
  const gate = views.some((view) => view.status !== "complete") ? "held" : "closed";
  if (!asked) {
    return {
      stance: "empty",
      gate,
      held_records: held,
      scorer: "words",
      text: "Ask a question. The reply can only quote accepted records.",
      hits: [],
      contradictions: [],
    };
  }
  if (views.length === 0 || views.every((view) => view.records.length === 0)) {
    return {
      stance: "unspecified",
      gate,
      held_records: held,
      scorer: "words",
      text: held
        ? "Nothing accepted matches, and the gate is still held. Those rows are not in force."
        : "The ledger has no accepted records for this question.",
      hits: [],
      contradictions: [],
    };
  }

  const queryTokens = contentTokens(asked);
  const hits: Hit[] = [];
  for (const view of views) {
    for (const record of view.records) {
      const overlap = overlapScore(queryTokens, `${record.text} ${record.quote} ${record.label}`);
      if (overlap < MIN_OVERLAP) continue;
      const key = hitKey(view.version_id, record.record_id);
      const gpu = gpuScores?.get(key);
      const score = gpu === undefined ? overlap : overlap * 0.55 + Math.max(0, gpu) * 0.45;
      hits.push({
        version_id: view.version_id,
        version_title: view.title,
        record_id: record.record_id,
        kind: record.kind,
        label: record.label,
        quote: record.quote,
        score,
      });
    }
  }
  hits.sort((a, b) => b.score - a.score || a.record_id.localeCompare(b.record_id));
  const top = hits.slice(0, 5);
  const contradictions = contradictionsAmong(views, top);
  for (const link of contradictions) {
    const missing = [link.source_id, link.target_id].filter(
      (id) => !top.some((hit) => hit.version_id === link.version_id && hit.record_id === id),
    );
    for (const id of missing) {
      const view = views.find((item) => item.version_id === link.version_id);
      const record = view?.records.find((item) => item.record_id === id);
      if (!view || !record) continue;
      top.push({
        version_id: view.version_id,
        version_title: view.title,
        record_id: record.record_id,
        kind: record.kind,
        label: record.label,
        quote: record.quote,
        score: 0,
      });
    }
  }

  const scorer = gpuScores && gpuScores.size > 0 ? "webgpu" : "words";
  if (top.length === 0) {
    return {
      stance: "unspecified",
      gate,
      held_records: held,
      scorer,
      text: unspecified(gate, held),
      hits: [],
      contradictions: [],
    };
  }

  const lines = top.map(
    (hit) => `${hit.version_title} ${hit.record_id} (${hit.kind}, ${hit.label}): ${hit.quote}`,
  );
  const lead =
    contradictions.length > 0
      ? "These accepted records disagree. Neither was dropped."
      : "Accepted records only.";
  const gateLine =
    gate === "held"
      ? `Gate held. ${held} row${held === 1 ? "" : "s"} excluded from this answer.`
      : "";
  return {
    stance: contradictions.length > 0 ? "conflict" : "grounded",
    gate,
    held_records: held,
    scorer,
    text: [gateLine, lead, ...lines].filter(Boolean).join("\n"),
    hits: top,
    contradictions,
  };
}

export function hitKey(versionId: string, recordId: string): string {
  return `${versionId}:${recordId}`;
}

function overlapScore(queryTokens: string[], text: string): number {
  if (queryTokens.length === 0) return 0;
  const seen = new Set(contentTokens(text));
  let matched = 0;
  for (const token of queryTokens) {
    if (seen.has(token)) matched += 1;
  }
  return matched / queryTokens.length;
}

function contradictionsAmong(
  views: LedgerView[],
  hits: Hit[],
): LedgerAnswer["contradictions"] {
  const found: LedgerAnswer["contradictions"] = [];
  for (const view of views) {
    const ids = new Set(hits.filter((hit) => hit.version_id === view.version_id).map((hit) => hit.record_id));
    for (const relation of view.relations) {
      if (relation.relation !== "contradicts") continue;
      if (ids.has(relation.source_id) || ids.has(relation.target_id)) {
        found.push({
          version_id: view.version_id,
          source_id: relation.source_id,
          target_id: relation.target_id,
        });
      }
    }
  }
  return found;
}

function unspecified(gate: LedgerAnswer["gate"], held: number): string {
  if (gate === "held") {
    return `The accepted ledger does not say. ${held} held row${held === 1 ? " is" : "s are"} not used to fill the gap.`;
  }
  return "The accepted ledger does not say.";
}

export function gpuScoreMap(records: { key: string; text: string }[], query: string, dots: Float32Array): Map<string, number> {
  const map = new Map<string, number>();
  records.forEach((record, index) => {
    const value = dots[index];
    if (typeof value === "number" && !Number.isNaN(value)) map.set(record.key, value);
  });
  if (map.size === 0) {
    const queryVector = embedText(query);
    for (const record of records) map.set(record.key, dot(queryVector, embedText(record.text)));
  }
  return map;
}
