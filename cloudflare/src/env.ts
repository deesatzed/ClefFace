export interface SqlCursor {
  toArray(): Record<string, unknown>[];
}

export interface SqlStorage {
  exec(query: string, ...bindings: unknown[]): SqlCursor;
}

export interface D1Prepared {
  bind(...values: unknown[]): D1Prepared;
  run(): Promise<{ success: boolean }>;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
}

export interface D1Database {
  prepare(query: string): D1Prepared;
  exec(query: string): Promise<unknown>;
}

export interface DurableObjectId {
  toString(): string;
}

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(input: RequestInfo, init?: RequestInit): Promise<Response> };
}

export interface Ai {
  run(model: string, input: unknown, options?: { gateway?: { id: string } }): Promise<unknown>;
}

export interface Env {
  AI: Ai;
  DB: D1Database;
  REGISTRY: DurableObjectNamespace;
  /** Optional override. Default gateway id is "clef-extract". */
  AI_GATEWAY_ID?: string;
  /** Optional Workers AI text model for segmentation. */
  SEGMENT_MODEL?: string;
}

declare global {
  abstract class DurableObject<E = unknown> {
    constructor(ctx: DurableObjectState, env: E);
    ctx: DurableObjectState;
    env: E;
  }
  interface DurableObjectState {
    storage: { sql: SqlStorage };
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  }
}

export const GATEWAY_ID = "clef-extract";
export const SEGMENT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
export const CHAR_LIMIT = 100_000;
