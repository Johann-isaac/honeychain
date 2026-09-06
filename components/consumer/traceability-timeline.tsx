import { Bug, FlaskConical, Link2, Package, ScanLine, Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

const ICONS: Record<string, typeof Sprout> = {
  hive: Bug,
  harvest: Sprout,
  batch: Package,
  "lab-received": FlaskConical,
  "lab-done": FlaskConical,
  blockchain: Link2,
  consumer: ScanLine,
};

export function TraceabilityTimeline({ events }: { events: { icon: string; label: string; date: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traceability Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-6 border-l border-border pl-6">
          {events.map((e, i) => {
            const Icon = ICONS[e.icon] ?? Package;
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] flex size-6 items-center justify-center rounded-full border border-honey/40 bg-card">
                  <Icon className="size-3.5 text-honey-dark" />
                </span>
                <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                <p className="text-sm font-medium">{e.label}</p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
