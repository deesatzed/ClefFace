export {
  CLEF_QUESTIONS,
  CONFIDENCE_THRESHOLD,
  SAMPLE_DOCUMENT,
  applyResolutions,
  buildClefRequest,
  extractDocument,
} from "../../cloudflare/src/engine/index.ts";
export { decideUnits } from "../../cloudflare/src/engine/decide-http.ts";
export { reviewReasons } from "../../cloudflare/src/engine/normalize.ts";
export { segmentDocument } from "../../cloudflare/src/engine/segment.ts";

export type {
  ExtractionOutput,
  Job,
  NormalizedDecision,
  Resolution,
  ReviewItem,
  TableInput,
} from "../../cloudflare/src/engine/index.ts";
