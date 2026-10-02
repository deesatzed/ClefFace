#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createReplayArtifact, parseArtifactText } from "../src/lib/experiment/artifacts.ts";
import { featuredSeed } from "../src/lib/experiment/fixtures.ts";
import { simulatedResponses } from "../src/lib/experiment/providers.ts";
import { summarizeTrials, scorePair } from "../src/lib/experiment/scoring.ts";
import { assertSplitIsolation, casesForSplit } from "../src/lib/experiment/splits.ts";

const options = parseArgs(process.argv.slice(2));
if (options.error) {
  console.error(options.error);
  process.exitCode = 2;
} else {
  const artifact = options.artifactPath ? await readArtifact(options.artifactPath) : demoArtifact();
  if (artifact) {
    const cases = casesForSplit(artifact.cases, options.split);
    assertSplitIsolation(artifact.cases, cases, options.split);
    const caseIds = new Set(cases.map((item) => item.id));
    const scores = artifact.responses.filter((response) => caseIds.has(response.caseId)).map((response) => {
      const item = artifact.cases.find((candidate) => candidate.id === response.caseId);
      if (!item) throw new Error(`response ${response.id} references missing case ${response.caseId}`);
      return {
        modelId: response.modelId,
        caseId: item.id,
        score: scorePair(item, response.baselineAnswer, response.variantAnswer),
      };
    });
    const byModel = Object.groupBy(scores, ({ modelId }) => modelId);
    const models = Object.fromEntries(Object.entries(byModel).map(([modelId, modelScores]) => [modelId, summarizeTrials(modelScores.map(({ score }) => score))]));
    process.stdout.write(`${JSON.stringify({ artifact: artifact.experiment.id, split: options.split, cases: cases.length, responseEvidence: [...new Set(artifact.responses.filter((item) => caseIds.has(item.caseId)).map((item) => item.evidenceKind))], models }, null, 2)}\n`);
  }
}

function parseArgs(args) {
  const result = { artifactPath: null, split: "development", error: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--artifact") result.artifactPath = args[++index] ?? null;
    else if (arg === "--split") result.split = args[++index] ?? "";
    else return { ...result, error: "Usage: npm run experiment [-- --artifact replay.json|cases.jsonl] [--split development|protected]" };
  }
  if (!result.artifactPath && args.includes("--artifact")) return { ...result, error: "--artifact requires a file path" };
  if (result.split !== "development" && result.split !== "protected") return { ...result, error: "--split must be development or protected" };
  return result;
}

function demoArtifact() {
  const seed = featuredSeed();
  return createReplayArtifact(seed.experiment, seed.cases, seed.cases.flatMap((item) => simulatedResponses(item)), "2026-10-02T00:00:00.000Z");
}

async function readArtifact(path) {
  if (!path) {
    console.error("--artifact requires a file path");
    process.exitCode = 2;
    return null;
  }
  try {
    const result = parseArtifactText(await readFile(path, "utf8"));
    if (!result.artifact) {
      console.error(`Invalid replay artifact: ${result.errors.join("; ")}`);
      process.exitCode = 1;
      return null;
    }
    return result.artifact;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unable to read replay artifact");
    process.exitCode = 1;
    return null;
  }
}
