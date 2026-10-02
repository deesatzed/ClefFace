/** Signed hashed bag-of-tokens. Used to rerank records that already share words. Not a generator. */

export const EMBED_DIM = 64;

const STOP = new Set([
  "the", "and", "for", "are", "was", "were", "but", "not", "you", "your", "this", "that", "with",
  "from", "have", "has", "had", "what", "when", "where", "which", "who", "why", "how", "does",
  "did", "can", "could", "would", "should", "about", "into", "than", "then", "them", "they",
  "their", "there", "been", "being", "will", "just", "also", "only", "over", "under", "after",
  "before", "between", "each", "other",
]);

export function contentTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

export function embedText(text: string): Float32Array {
  const vector = new Float32Array(EMBED_DIM);
  for (const token of contentTokens(text)) {
    const hash = fnv(token);
    const index = hash % EMBED_DIM;
    vector[index] += hash & 1 ? 1 : -1;
  }
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let index = 0; index < EMBED_DIM; index++) vector[index] /= norm;
  }
  return vector;
}

export function dot(left: Float32Array, right: Float32Array): number {
  let score = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index++) score += left[index] * right[index];
  return score;
}

function fnv(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index++) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
