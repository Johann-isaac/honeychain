import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HiveGrid, type HiveGridEntry } from "@/components/hive/hive-grid";
import { getDefaultBeekeeperId, getHiveYieldPrediction, getHivesByBeekeeper, getLatestSensorReading } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function HivesPage() {
  const beekeeperId = await getDefaultBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);
  const entries: HiveGridEntry[] = await Promise.all(
    hives.map(async (hive) => ({
      hive,
      reading: await getLatestSensorReading(hive.id),
      estimatedYieldKg: (await getHiveYieldPrediction(hive.id))?.predictedYieldKg,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Your Bee Hives</h1>
          <p className="text-sm text-muted-foreground">{hives.length} hives under active AI-assisted monitoring.</p>
        </div>
        <Button asChild>
          <Link href="/beekeeper/hives/new">
            <Plus className="size-4" /> Register Hive
          </Link>
        </Button>
      </div>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hives registered yet. Register one to get its Hive ID for the ESP32 firmware.
        </p>
      ) : (
        <HiveGrid entries={entries} />
      )}
    </div>
  );
}
