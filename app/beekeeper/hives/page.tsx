import { HiveGrid, type HiveGridEntry } from "@/components/hive/hive-grid";
import { DEFAULT_BEEKEEPER_ID, getHiveYieldPrediction, getHivesByBeekeeper, getLatestSensorReading } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function HivesPage() {
  const hives = getHivesByBeekeeper(DEFAULT_BEEKEEPER_ID);
  const entries: HiveGridEntry[] = hives.map((hive) => ({
    hive,
    reading: getLatestSensorReading(hive.id),
    estimatedYieldKg: getHiveYieldPrediction(hive.id)?.predictedYieldKg,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Your Bee Hives</h1>
        <p className="text-sm text-muted-foreground">{hives.length} hives under active AI-assisted monitoring.</p>
      </div>
      <HiveGrid entries={entries} />
    </div>
  );
}
