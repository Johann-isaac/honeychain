"use client";

import * as React from "react";
import { BrainCircuit, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HiveAiInsight, VisualDiseaseRisk } from "@/types";

const statusMeta: Record<HiveAiInsight["healthStatus"], { label: string; variant: "success" | "warning" | "destructive"; icon: typeof ShieldCheck }> = {
  HEALTHY: { label: "Healthy", variant: "success", icon: ShieldCheck },
  AT_RISK: { label: "At Risk", variant: "warning", icon: ShieldAlert },
  CRITICAL: { label: "Critical", variant: "destructive", icon: ShieldX },
};

const visualRiskMeta: Record<VisualDiseaseRisk, { label: string; variant: "success" | "warning" | "destructive" }> = {
  NO_CONCERNS_VISIBLE: { label: "No concerns visible", variant: "success" },
  POSSIBLE_CONCERN: { label: "Possible concern", variant: "warning" },
  NEEDS_INSPECTION: { label: "Needs inspection", variant: "destructive" },
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function AiInsightCard({
  hiveId,
  initialInsight,
  initialGeneratedAt,
}: {
  hiveId: string;
  initialInsight?: HiveAiInsight;
  initialGeneratedAt?: string;
}) {
  const [insight, setInsight] = React.useState<HiveAiInsight | undefined>(initialInsight);
  const [generatedAt, setGeneratedAt] = React.useState<string | undefined>(initialGeneratedAt);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hives/${hiveId}/ai-insight`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to generate AI insight.");
      setInsight(data.insight);
      setGeneratedAt(data.generatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate AI insight.");
    } finally {
      setLoading(false);
    }
  }

  const status = insight ? statusMeta[insight.healthStatus] : null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-primary" /> AI Hive Prediction
        </CardTitle>
        <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={loading}>
          <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
          {loading ? "Analyzing…" : insight ? "Re-analyze" : "Analyze with AI"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-3 flex items-start gap-1.5 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {error}
          </p>
        )}

        {!insight && !error && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No AI prediction yet. Click &quot;Analyze with AI&quot; to have an AI model assess this hive&apos;s
            recent sensor history.
          </p>
        )}

        {insight && status && (
          <>
            <div className="flex items-center justify-between">
              <Badge variant={status.variant}>
                <status.icon className="size-3.5" /> {status.label}
              </Badge>
              <div className="rounded-xl bg-muted px-3 py-1.5 text-center">
                <p className="text-sm font-semibold">{insight.confidence}%</p>
                <p className="text-[10px] text-muted-foreground">Confidence</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed">{insight.summary}</p>

            {insight.riskFactors.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground">Risk Factors</p>
                <ul className="mt-1.5 space-y-1">
                  {insight.riskFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-warning">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.recommendations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground">Recommendations</p>
                <ul className="mt-1.5 space-y-1">
                  {insight.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.visualScreening && (
              <div className="mt-5 rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Eye className="size-3.5" /> Camera Visual Screening
                  </p>
                  <Badge variant={visualRiskMeta[insight.visualScreening.diseaseRisk].variant}>
                    {visualRiskMeta[insight.visualScreening.diseaseRisk].label}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{insight.visualScreening.observations}</p>
                {insight.visualScreening.visibleSigns.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {insight.visualScreening.visibleSigns.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-warning">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Confidence {insight.visualScreening.confidence}% · a general-purpose vision AI&apos;s read of one
                  photo, not a trained disease classifier — never a substitute for manual inspection
                </p>
              </div>
            )}

            {generatedAt && (
              <p className="mt-4 text-[10px] uppercase tracking-wide text-muted-foreground">
                AI-generated · {formatTimestamp(generatedAt)} · decision support only, not a disease diagnosis
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
