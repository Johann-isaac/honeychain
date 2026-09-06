import { YieldPredictionCard } from "@/components/hive/yield-prediction-card";
import { DEFAULT_BEEKEEPER_ID, getHiveYieldPrediction, getHivesByBeekeeper } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function YieldPredictionsPage() {
  const hives = getHivesByBeekeeper(DEFAULT_BEEKEEPER_ID);
  const total = hives.reduce((sum, h) => sum + (getHiveYieldPrediction(h.id)?.predictedYieldKg ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Yield Predictions</h1>
        <p className="text-sm text-muted-foreground">
          AI-assisted estimate across all hives:{" "}
          <span className="font-semibold text-foreground">{Math.round(total * 10) / 10} kg</span> at next harvest.
          This is a decision-support estimate, not a guaranteed yield.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {hives.map((hive) => {
          const prediction = getHiveYieldPrediction(hive.id);
          if (!prediction) return null;
          return (
            <div key={hive.id}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{hive.hiveCode} · {hive.name}</p>
              <YieldPredictionCard prediction={prediction} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
