"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { HiveCard } from "@/components/hive/hive-card";
import { cn } from "@/lib/utils";
import type { Hive, SensorReading } from "@/types";

export interface HiveGridEntry {
  hive: Hive;
  reading?: SensorReading;
  estimatedYieldKg?: number;
}

const filters: { key: "ALL" | Hive["status"]; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "HEALTHY", label: "Healthy" },
  { key: "ATTENTION", label: "Attention" },
  { key: "CRITICAL", label: "Critical" },
];

export function HiveGrid({ entries }: { entries: HiveGridEntry[] }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<(typeof filters)[number]["key"]>("ALL");
  const [sort, setSort] = React.useState<"name" | "yield">("name");

  const filtered = entries
    .filter((e) => status === "ALL" || e.hive.status === status)
    .filter((e) => {
      const q = query.toLowerCase();
      return !q || e.hive.name.toLowerCase().includes(q) || e.hive.hiveCode.toLowerCase().includes(q) || e.hive.location.toLowerCase().includes(q);
    })
    .sort((a, b) => (sort === "name" ? a.hive.hiveCode.localeCompare(b.hive.hiveCode) : (b.estimatedYieldKg ?? 0) - (a.estimatedYieldKg ?? 0)));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hives..."
            className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-muted p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  status === f.key ? "bg-card shadow-sm" : "text-muted-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "name" | "yield")}
            className="h-9 rounded-full border border-border bg-card px-3 text-xs outline-none"
          >
            <option value="name">Sort: Hive ID</option>
            <option value="yield">Sort: Est. Yield</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hives match your filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <HiveCard key={e.hive.id} hive={e.hive} reading={e.reading} estimatedYieldKg={e.estimatedYieldKg} />
          ))}
        </div>
      )}
    </div>
  );
}
