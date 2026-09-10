import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchList } from "@/components/batch/batch-list";
import { getDefaultBeekeeperId, getBatchesByBeekeeper, getHiveById } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const beekeeperId = await getDefaultBeekeeperId();
  const batches = await getBatchesByBeekeeper(beekeeperId);
  const uniqueHiveIds = [...new Set(batches.map((b) => b.hiveId))];
  const hiveEntries = await Promise.all(uniqueHiveIds.map(async (hiveId) => [hiveId, (await getHiveById(hiveId))?.hiveCode ?? "—"] as const));
  const hiveCodes = Object.fromEntries(hiveEntries);

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
