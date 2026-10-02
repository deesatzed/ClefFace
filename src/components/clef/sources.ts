import clefQuestions from "../../../cloudflare/src/engine/clef-questions.ts?raw";
import compiler from "../../../cloudflare/src/compiler.ts?raw";
import decision from "../../../cloudflare/src/decision.ts?raw";
import index from "../../../cloudflare/src/index.ts?raw";
import ingest from "../../../cloudflare/src/ingest.ts?raw";
import mcp from "../../../cloudflare/src/mcp.ts?raw";
import registry from "../../../cloudflare/src/registry.ts?raw";
import review from "../../../cloudflare/src/review.ts?raw";
import runbook from "../../../cloudflare/RUNBOOK.md?raw";
import schema from "../../../cloudflare/schema.sql?raw";
import segmenter from "../../../cloudflare/src/segmenter.ts?raw";
import wrangler from "../../../cloudflare/wrangler.jsonc?raw";

export const STARTER_FILES: { path: string; body: string }[] = [
  { path: "cloudflare/wrangler.jsonc", body: wrangler },
  { path: "cloudflare/schema.sql", body: schema },
  { path: "cloudflare/RUNBOOK.md", body: runbook },
  { path: "cloudflare/src/index.ts", body: index },
  { path: "cloudflare/src/mcp.ts", body: mcp },
  { path: "cloudflare/src/ingest.ts", body: ingest },
  { path: "cloudflare/src/segmenter.ts", body: segmenter },
  { path: "cloudflare/src/decision.ts", body: decision },
  { path: "cloudflare/src/registry.ts", body: registry },
  { path: "cloudflare/src/compiler.ts", body: compiler },
  { path: "cloudflare/src/review.ts", body: review },
  { path: "cloudflare/src/engine/clef-questions.ts", body: clefQuestions },
];
