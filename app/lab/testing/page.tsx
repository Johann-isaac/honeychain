import { SamplesTable } from "@/components/lab/samples-table";
import { getEnrichedLabSamples } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function TestingPage() {
  const samples = getEnrichedLabSamples().filter((s) => s.status === "TESTING_IN_PROGRESS");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Testing In Progress</h1>
        <p className="text-sm text-muted-foreground">Samples with test results partially recorded — continue where you left off.</p>
      </div>
      <SamplesTable samples={samples} emptyLabel="No samples currently in testing." />
    </div>
  );
}
