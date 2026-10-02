import { GATEWAY_ID, type Env } from "./env.ts";

/** Every model call goes through AI Gateway. Assumption: the third argument's gateway.id is honored on compatibility_date 2026-10-01. */
export async function runModel(env: Env, model: string, input: unknown): Promise<unknown> {
  return env.AI.run(model, input, {
    gateway: { id: env.AI_GATEWAY_ID || GATEWAY_ID },
  });
}
