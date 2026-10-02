# Evidence Lab architecture and operating notes

## Data flow

`core` normalizes sources, computes SHA-256 identities, applies exact patches, and validates answer schemas. `authoring` makes one review-required exploratory case. `scoring` evaluates paired answers. `artifacts` serializes and defensively rebuilds versioned replay JSON. `library` stores explicit browser-local entries without automatic eviction. `report` produces self-contained escaped HTML. UI code only presents these records.

Artifacts use `evidence-lab/v1`. A replay has an experiment, exact source/version hash, cases, response receipts, and an export timestamp. Imports reject unsupported schema versions or malformed patches; source identities are reconstructed rather than trusted from incoming JSON. JSONL case export and multi-case editor history are not implemented yet.

## Case validation

Each case contains exact patch offsets and expected source text, a category, baseline/variant answers, and a rationale. Validated meaning changes must change the expected answer; validated preservation cases must not. Custom cases are `exploratory` and therefore must not be treated as validated aggregate evidence without review.

## Local library and deletion

The browser library uses local storage key `evidence-lab/library-v1`. It has no retention cap or implicit eviction. Save, archive, and delete are explicit actions. Browser storage can be cleared externally or become full; the UI reports save failures. Export JSON before clearing browser data; externally exported copies cannot be revoked.

## Provider boundary

`live.ts` accepts a caller-supplied transport only after explicit confirmation and a remaining two-call budget, capped at 100 calls. It does not persist credentials or make an implicit network request. A server-side OpenAI-compatible adapter, retries, cancellation, pricing/cost accounting, and live verification are pending provider selection plus user-approved credentials and spend bounds.

## Interpretation and protocol

Pair success requires both baseline and variant answers to match expectations. An unchanged wrong answer is not a preservation success. Inputs and outputs establish behavior under this test only—not internal beliefs, truth, or general capability. The public seed suite is development/demo material, not a protected research evaluation. Research utility and demand remain unvalidated.
