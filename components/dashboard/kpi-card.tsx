import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animated-counter";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  suffix = "",
  decimals = 0,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-primary/15 text-primary-dark dark:text-honey",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-display text-2xl">
            <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
          </p>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}
