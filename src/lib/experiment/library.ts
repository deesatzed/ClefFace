import type { ReplayArtifact } from "./artifacts.ts";

export const EXPERIMENT_LIBRARY_SCHEMA = "evidence-lab/library-v1";
export const experimentLibraryKey = "evidence-lab/library-v1";

export interface LibraryEntry {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  artifact: ReplayArtifact;
}

interface LibraryDocument {
  schemaVersion: typeof EXPERIMENT_LIBRARY_SCHEMA;
  entries: LibraryEntry[];
}

export function parseLibrary(raw: string | null): LibraryEntry[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.schemaVersion !== EXPERIMENT_LIBRARY_SCHEMA || !Array.isArray(value.entries)) return [];
    return value.entries.filter(isLibraryEntry);
  } catch {
    return [];
  }
}

export function serializeLibrary(entries: readonly LibraryEntry[]): string {
  const document: LibraryDocument = { schemaVersion: EXPERIMENT_LIBRARY_SCHEMA, entries: [...entries] };
  return JSON.stringify(document);
}

export function createLibraryEntry(artifact: ReplayArtifact, now = new Date().toISOString()): LibraryEntry {
  const id = `saved_${artifact.experiment.id}_${now.replace(/[^0-9]/g, "").slice(0, 14)}`;
  return { id, title: artifact.experiment.title, createdAt: now, updatedAt: now, archivedAt: null, artifact };
}

export function upsertLibraryEntry(entries: readonly LibraryEntry[], entry: LibraryEntry): LibraryEntry[] {
  const existingIndex = entries.findIndex((candidate) => candidate.id === entry.id);
  if (existingIndex === -1) return [...entries, entry];
  return entries.map((candidate) => candidate.id === entry.id ? entry : candidate);
}

export function archiveLibraryEntry(entries: readonly LibraryEntry[], id: string, now = new Date().toISOString()): LibraryEntry[] {
  return entries.map((entry) => entry.id === id ? { ...entry, archivedAt: now, updatedAt: now } : entry);
}

export function deleteLibraryEntry(entries: readonly LibraryEntry[], id: string): LibraryEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

function isLibraryEntry(value: unknown): value is LibraryEntry {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.createdAt === "string"
    && typeof value.updatedAt === "string"
    && (typeof value.archivedAt === "string" || value.archivedAt === null)
    && isRecord(value.artifact);
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
