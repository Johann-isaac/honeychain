import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { BatchList } from "@/components/batch/batch-list";
import { getBatchesByBeekeeper, getHiveById } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export const metadata: Metadata = { title: "Honey Batches" };

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const beekeeperId = await getCurrentBeekeeperId();
  const batches = await getBatchesByBeekeeper(beekeeperId);
  const uniqueHiveIds = [...new Set(batches.map((b) => b.hiveId))];
  const hiveEntries = await Promise.all(
    uniqueHiveIds.map(async (hiveId) => [hiveId, (await getHiveById(hiveId))?.hiveCode ?? "—"] as const)
  );
  const hiveCodes = Object.fromEntries(hiveEntries);

  return (
    <div>
      <PageHeader
        title="Honey batches"
        description={
          batches.length === 1 ? "1 batch harvested from your hives." : `${batches.length} batches harvested from your hives.`
        }
        actions={
          <Button asChild>
            <Link href="/beekeeper/batches/new">
              <Plus className="size-4" /> Create batch
            </Link>
          </Button>
        }
      />

      {batches.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No batches yet"
          description="Creating a batch generates its identifier, its ledger record and a printable QR code for the label."
          action={
            <Button asChild>
              <Link href="/beekeeper/batches/new">
                <Plus className="size-4" /> Create your first batch
              </Link>
            </Button>
          }
        />
      ) : (
        <BatchList batches={batches} hiveCodes={hiveCodes} basePath="/beekeeper/batches" />
      )}
    </div>
  );
}
