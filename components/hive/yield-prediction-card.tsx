"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { YieldPrediction } from "@/types";

export function YieldPredictionCard({ prediction }: { prediction: YieldPrediction }) {
  const chartData = prediction.history.map((h) => ({
    label: h.label,
    actual: h.actual,
    predicted: h.predicted,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-nature" /> Next Honey Yield Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-4xl">
              {prediction.predictedYieldKg} <span className="text-lg text-muted-foreground">kg</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Expected harvest: {formatDate(prediction.expectedHarvestDate)}</p>
          </div>
          <div className="rounded-xl bg-muted px-3 py-2 text-center">
            <p className="text-lg font-semibold">{prediction.confidence}%</p>
            <p className="text-[10px] text-muted-foreground">Confidence</p>
          </div>
        </div>

        <div className="mt-5">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8884" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8dcc4", fontSize: 12 }} />
              <Bar dataKey="actual" name="Past yield (kg)" fill="#8a5a2b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="predicted" name="Predicted (kg)" fill="#d99a2b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Yield Factors</p>
          {prediction.factors.map((f) => (
            <div key={f.label} className="flex items-center gap-3 text-xs">
              <span className="w-40 shrink-0 text-muted-foreground">{f.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-nature" style={{ width: `${f.value}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right font-medium">{f.value}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-wide text-muted-foreground">
          AI-assisted prediction · not a guaranteed yield
        </p>
      </CardContent>
    </Card>
  );
}
