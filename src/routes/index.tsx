import { createFileRoute } from "@tanstack/react-router";
import { EvidenceLabWorkspace } from "@/components/evidence-lab/workspace";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <EvidenceLabWorkspace />;
}
