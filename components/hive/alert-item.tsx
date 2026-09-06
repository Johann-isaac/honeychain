"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";
import type { Alert, Hive } from "@/types";

const severityMeta: Record<Alert["severity"], { icon: typeof Info; variant: "destructive" | "warning" | "success"; ring: string }> = {
  CRITICAL: { icon: AlertTriangle, variant: "destructive", ring: "border-l-destructive" },
  WARNING: { icon: AlertTriangle, variant: "warning", ring: "border-l-warning" },
  INFO: { icon: CheckCircle2, variant: "success", ring: "border-l-success" },
};

export function AlertItem({
  alert,
  hive,
  readOnly = false,
}: {
  alert: Alert;
  hive?: Hive;
  readOnly?: boolean;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const meta = severityMeta[alert.severity];
  const Icon = meta.icon;

  if (dismissed) return null;

  async function handleDismiss() {
    setLoading(true);
    try {
      await fetch(`/api/alerts/${alert.id}/dismiss`, { method: "POST" });
      setDismissed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border border-border border-l-4 bg-card p-4 card-shadow", meta.ring)}>
      <Icon className={cn("mt-0.5 size-4.5 shrink-0", alert.severity === "CRITICAL" ? "text-destructive" : alert.severity === "WARNING" ? "text-warning" : "text-success")} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{alert.title}</p>
          {hive && <Badge variant="muted">{hive.hiveCode}</Badge>}
          <Badge variant={meta.variant}>{alert.severity}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
        <p className="mt-1.5 text-xs font-medium text-foreground/80">Recommended: {alert.recommendation}</p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">{formatDateTime(alert.timestamp)}</p>
      </div>
      {!readOnly && (
        <button
          onClick={handleDismiss}
          disabled={loading}
          aria-label="Dismiss alert"
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
