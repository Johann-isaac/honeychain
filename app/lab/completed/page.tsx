import { SamplesTable } from "@/components/lab/samples-table";
import { getEnrichedLabSamples } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function CompletedTestsPage() {
  const samples = getEnrichedLabSamples().filter((s) => s.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Completed Tests</h1>
        <p className="text-sm text-muted-foreground">Samples with finalized test results.</p>
      </div>
      <SamplesTable samples={samples} emptyLabel="No completed tests yet." />
    </div>
  );
}
