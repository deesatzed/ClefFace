import type { Job } from "@/lib/clef";

type Bag = typeof globalThis & { __clefJobs?: Map<string, Job> };

const bag = globalThis as Bag;
export const jobStore = bag.__clefJobs ?? new Map<string, Job>();
bag.__clefJobs = jobStore;
