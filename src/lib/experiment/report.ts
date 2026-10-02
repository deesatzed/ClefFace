import type { ReplayArtifact } from "./artifacts.ts";
import { scorePair, summarizeTrials } from "./scoring.ts";

/** Render a standalone, inspectable HTML receipt without remote assets or scripts. */
export function renderReplayReport(artifact: ReplayArtifact): string {
  const rows = artifact.responses.map((response) => {
    const item = artifact.cases.find((candidate) => candidate.id === response.caseId);
    const result = item ? scorePair(item, response.baselineAnswer, response.variantAnswer).outcome : "missing_case";
    return `<tr><td>${escapeHtml(response.caseId)}</td><td>${escapeHtml(response.providerId)}</td><td>${escapeHtml(response.modelId)}</td><td>${escapeHtml(response.evidenceKind)}</td><td>${escapeHtml(response.baselineAnswer)}</td><td>${escapeHtml(response.variantAnswer)}</td><td>${escapeHtml(result)}</td></tr>`;
  }).join("\n");
  const scores = artifact.responses.flatMap((response) => {
    const item = artifact.cases.find((candidate) => candidate.id === response.caseId);
    return item ? [scorePair(item, response.baselineAnswer, response.variantAnswer)] : [];
  });
  const summary = summarizeTrials(scores);
  const cases = artifact.cases.map((item) => `<article><h3>${escapeHtml(item.id)} <small>${escapeHtml(item.category)}</small></h3><p><strong>Question:</strong> ${escapeHtml(artifact.experiment.question)}</p><p><strong>Expected:</strong> ${escapeHtml(item.expectedBaseline)} → ${escapeHtml(item.expectedVariant)}</p><p><strong>Rationale:</strong> ${escapeHtml(item.rationale)}</p><pre>${escapeHtml(item.variant.normalized)}</pre></article>`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(artifact.experiment.title)} — replay report</title><style>body{max-width:960px;margin:2rem auto;padding:0 1rem;font:16px/1.5 system-ui,sans-serif;color:#17221c}h1,h2{line-height:1.15}small{color:#526159}pre{white-space:pre-wrap;background:#f4f1e8;padding:1rem;border-radius:.5rem}table{width:100%;border-collapse:collapse;font-size:.9rem}td,th{padding:.55rem;text-align:left;border-bottom:1px solid #d7d5cb}.badge{background:#e2efe5;border-radius:99px;padding:.2rem .55rem;font-size:.8rem}article{border:1px solid #d7d5cb;border-radius:.6rem;padding:1rem;margin:1rem 0}</style></head><body><header><p class="badge">AI Evidence Laboratory replay artifact</p><h1>${escapeHtml(artifact.experiment.title)}</h1><p>Exported ${escapeHtml(artifact.exportedAt)}. This report records input-output behavior; it is not evidence of internal beliefs or general capability.</p></header><section><h2>Run summary</h2><p>Scheduled ${summary.scheduled}; matched ${summary.matched}; did not match ${summary.didNotMatch}; invalid ${summary.invalid}; execution errors ${summary.executionErrors}.</p></section><section><h2>Source</h2><p>SHA-256: <code>${escapeHtml(artifact.experiment.source.sha256)}</code></p><pre>${escapeHtml(artifact.experiment.source.normalized)}</pre></section><section><h2>Cases</h2>${cases}</section><section><h2>Responses</h2><table><thead><tr><th>Case</th><th>Provider</th><th>Model</th><th>Evidence</th><th>Original</th><th>Edited</th><th>Pair result</th></tr></thead><tbody>${rows}</tbody></table></section></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
