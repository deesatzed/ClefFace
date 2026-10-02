import type { Experiment, ExperimentCase } from "./core.ts";
import type { ModelResponse } from "./providers.ts";

export const DEFAULT_LIVE_CALL_CAP = 100;

export interface LiveRunRequest {
  providerId: string;
  modelId: string;
  confirmed: boolean;
  remainingCalls: number;
}

export interface LivePrompt {
  source: string;
  question: string;
  answers: readonly string[];
}

export type LiveTransport = (prompt: LivePrompt) => Promise<string>;

/**
 * Runs exactly one baseline/variant pair via an injected transport. It never
 * reads credentials, stores secrets, or makes an implicit network request.
 */
export async function runBoundedLivePair(
  experiment: Experiment,
  item: ExperimentCase,
  request: LiveRunRequest,
  transport: LiveTransport,
): Promise<ModelResponse> {
  if (!request.confirmed) throw new Error("live run requires explicit confirmation");
  if (!request.providerId.trim() || !request.modelId.trim()) throw new Error("live provider and model are required");
  if (!Number.isInteger(request.remainingCalls) || request.remainingCalls < 2 || request.remainingCalls > DEFAULT_LIVE_CALL_CAP) {
    throw new Error(`live run needs two calls within the ${DEFAULT_LIVE_CALL_CAP}-call cap`);
  }
  const prompt = (source: string): LivePrompt => ({ source, question: experiment.question, answers: experiment.answers });
  const [baselineAnswer, variantAnswer] = await Promise.all([transport(prompt(experiment.source.normalized)), transport(prompt(item.variant.normalized))]);
  return {
    id: `${item.id}:${request.providerId}:${request.modelId}:live`, caseId: item.id,
    providerId: request.providerId.trim(), modelId: request.modelId.trim(), evidenceKind: "live",
    baselineAnswer, variantAnswer,
    rationale: "Live response pair obtained through an explicitly confirmed, caller-supplied transport.",
  };
}
