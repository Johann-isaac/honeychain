import { Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AiHealthResult } from "@/types";

const riskMeta = {
  LOW: { label: "Healthy", variant: "success" as const, dot: "🟢" },
  MODERATE: { label: "Monitor", variant: "warning" as const, dot: "🟡" },
  ELEVATED: { label: "Needs Attention", variant: "destructive" as const, dot: "🔴" },
};

const breakdownLabels: Record<keyof AiHealthResult["breakdown"], string> = {
  temperature: "Temperature",
  humidity: "Humidity",
  weightTrend: "Weight trend",
  beeActivity: "Bee activity",
  environmentalStability: "Environmental stability",
};

export function HealthScoreCard({ health }: { health: AiHealthResult }) {
  const risk = riskMeta[health.riskLevel];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-honey-dark" /> AI Hive Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-4xl">
              {health.healthScore}
              <span className="text-lg text-muted-foreground"> / 100</span>
            </p>
            <Badge variant={risk.variant} className="mt-2">
              {risk.dot} {risk.label}
            </Badge>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {(Object.keys(health.breakdown) as (keyof AiHealthResult["breakdown"])[]).map((key) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{breakdownLabels[key]}</span>
                <span className="font-medium">{health.breakdown[key]}%</span>
              </div>
              <Progress value={health.breakdown[key]} />
            </div>
          ))}
        </div>

        <p className="mt-5 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">{health.summary}</p>

        {health.anomalies.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {health.anomalies.map((a, i) => (
              <p key={i} className="flex items-start gap-1.5 text-xs text-warning">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {a}
              </p>
            ))}
          </div>
        )}

        <p className="mt-4 text-[10px] uppercase tracking-wide text-muted-foreground">
          AI-assisted monitoring · decision support only, not a disease diagnosis
        </p>
      </CardContent>
    </Card>
  );
}
