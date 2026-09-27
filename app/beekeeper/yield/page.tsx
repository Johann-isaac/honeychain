import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { YieldPredictionCard } from "@/components/hive/yield-prediction-card";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { getHiveYieldPrediction, getHivesByBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export const metadata: Metadata = { title: "Yield Predictions" };

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function YieldPredictionsPage() {
  const beekeeperId = await getCurrentBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);
  const entries = await Promise.all(hives.map(async (hive) => ({ hive, prediction: await getHiveYieldPrediction(hive.id) })));
  const total = entries.reduce((sum, e) => sum + (e.prediction?.predictedYieldKg ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Yield predictions"
        description={
          <>
            Estimated <span className="font-semibold text-foreground">{Math.round(total * 10) / 10} kg</span> across all
            hives at next harvest. These are decision-support estimates from sensor trends, not guaranteed yields.
          </>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No predictions yet"
          description="Forecasts appear once a registered hive has enough sensor history to model a trend."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {entries.map(({ hive, prediction }) => {
            if (!prediction) return null;
            return (
              <div key={hive.id}>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {hive.hiveCode} · {hive.name}
                </p>
                <YieldPredictionCard prediction={prediction} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
