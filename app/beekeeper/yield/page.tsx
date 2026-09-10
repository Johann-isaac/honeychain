import { YieldPredictionCard } from "@/components/hive/yield-prediction-card";
import { getDefaultBeekeeperId, getHiveYieldPrediction, getHivesByBeekeeper } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function YieldPredictionsPage() {
  const beekeeperId = await getDefaultBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);
  const entries = await Promise.all(hives.map(async (hive) => ({ hive, prediction: await getHiveYieldPrediction(hive.id) })));
  const total = entries.reduce((sum, e) => sum + (e.prediction?.predictedYieldKg ?? 0), 0);

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

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hives registered yet.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {entries.map(({ hive, prediction }) => {
            if (!prediction) return null;
            return (
              <div key={hive.id}>
                <p className="mb-2 text-xs font-medium text-muted-foreground">{hive.hiveCode} · {hive.name}</p>
                <YieldPredictionCard prediction={prediction} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
