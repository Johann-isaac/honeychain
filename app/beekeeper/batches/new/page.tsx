import type { Metadata } from "next";
import Link from "next/link";
import { Hexagon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateBatchForm } from "@/components/batch/create-batch-form";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { getHivesByBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export const metadata: Metadata = { title: "Create Honey Batch" };

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  const beekeeperId = await getCurrentBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);

  return (
    <div>
      <PageHeader
        title="Create honey batch"
        description="The batch identifier, ledger record and QR code are all generated once you submit this form."
        backHref="/beekeeper/batches"
        backLabel="Back to batches"
      />
      {hives.length === 0 ? (
        <EmptyState
          icon={Hexagon}
          title="Register a hive first"
          description="A batch has to be traceable to the hive it was harvested from, so you need at least one registered hive."
          action={
            <Button asChild>
              <Link href="/beekeeper/hives/new">
                <Plus className="size-4" /> Register a hive
              </Link>
            </Button>
          }
        />
      ) : (
        <CreateBatchForm hives={hives} />
      )}
    </div>
  );
}
