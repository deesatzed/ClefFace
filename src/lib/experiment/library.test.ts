import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { archiveLibraryEntry, createLibraryEntry, deleteLibraryEntry, parseLibrary, serializeLibrary, upsertLibraryEntry } from "./library.ts";
import { createReplayArtifact } from "./artifacts.ts";
import { featuredSeed } from "./fixtures.ts";
import { simulatedResponses } from "./providers.ts";

describe("local experiment library", () => {
  const seed = featuredSeed();
  const artifact = createReplayArtifact(seed.experiment, seed.cases, seed.cases.flatMap(simulatedResponses), "2026-10-02T00:00:00.000Z");

  it("round trips explicit saved entries without implicit eviction", () => {
    const entry = createLibraryEntry(artifact, "2026-10-02T12:34:56.000Z");
    const entries = upsertLibraryEntry([], entry);
    assert.equal(parseLibrary(serializeLibrary(entries)).length, 1);
    assert.equal(upsertLibraryEntry(entries, entry).length, 1);
  });

  it("archives and deletes only through explicit operations", () => {
    const entry = createLibraryEntry(artifact, "2026-10-02T12:34:56.000Z");
    const archived = archiveLibraryEntry([entry], entry.id, "2026-10-03T00:00:00.000Z");
    assert.equal(archived[0]?.archivedAt, "2026-10-03T00:00:00.000Z");
    assert.equal(deleteLibraryEntry(archived, entry.id).length, 0);
  });
});
