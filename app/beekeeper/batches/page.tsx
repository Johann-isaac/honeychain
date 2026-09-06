import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchList } from "@/components/batch/batch-list";
import { DEFAULT_BEEKEEPER_ID, getBatchesByBeekeeper, getHiveById } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const batches = getBatchesByBeekeeper(DEFAULT_BEEKEEPER_ID);
  const hiveCodes: Record<string, string> = {};
  for (const batch of batches) {
    hiveCodes[batch.hiveId] = getHiveById(batch.hiveId)?.hiveCode ?? "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Honey Batches</h1>
          <p className="text-sm text-muted-foreground">{batches.length} batches from your hives.</p>
        </div>
        <Button asChild>
          <Link href="/beekeeper/batches/new">
            <Plus className="size-4" /> Create Honey Batch
          </Link>
        </Button>
      </div>

      <BatchList batches={batches} hiveCodes={hiveCodes} basePath="/beekeeper/batches" />
    </div>
  );
}
