import type { Metadata } from "next";
import Link from "next/link";
import { Hexagon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { HiveGrid, type HiveGridEntry } from "@/components/hive/hive-grid";
import { getHiveYieldPrediction, getHivesByBeekeeper, getLatestSensorReading } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export const metadata: Metadata = { title: "My Hives" };

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function HivesPage() {
  const beekeeperId = await getCurrentBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);
  const entries: HiveGridEntry[] = await Promise.all(
    hives.map(async (hive) => ({
      hive,
      reading: await getLatestSensorReading(hive.id),
      estimatedYieldKg: (await getHiveYieldPrediction(hive.id))?.predictedYieldKg,
    }))
  );

  return (
    <div>
      <PageHeader
        title="My hives"
        description={
          hives.length === 1
            ? "1 hive under active monitoring."
            : `${hives.length} hives under active monitoring.`
        }
        actions={
          <Button asChild>
            <Link href="/beekeeper/hives/new">
              <Plus className="size-4" /> Register hive
            </Link>
          </Button>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={Hexagon}
          title="No hives registered yet"
          description="Each physical hive needs its own record here — registering one gives you the Hive ID to flash into its ESP32 node."
          action={
            <Button asChild>
              <Link href="/beekeeper/hives/new">
                <Plus className="size-4" /> Register your first hive
              </Link>
            </Button>
          }
        />
      ) : (
        <HiveGrid entries={entries} />
      )}
    </div>
  );
}
