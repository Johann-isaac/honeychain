import { SamplesTable } from "@/components/lab/samples-table";
import { getEnrichedLabSamples } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function PendingSamplesPage() {
  const samples = getEnrichedLabSamples().filter((s) => s.status === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Pending Samples</h1>
        <p className="text-sm text-muted-foreground">Honey samples received and awaiting testing.</p>
      </div>
      <SamplesTable samples={samples} emptyLabel="No samples awaiting testing." />
    </div>
  );
}
