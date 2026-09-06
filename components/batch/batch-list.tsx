"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BatchStatusBadge } from "@/components/batch/batch-status-badge";
import { formatDate } from "@/lib/utils";
import type { HoneyBatch } from "@/types";

export function BatchList({
  batches,
  hiveCodes,
  basePath,
}: {
  batches: HoneyBatch[];
  hiveCodes: Record<string, string>;
  basePath: string;
}) {
  const [query, setQuery] = React.useState("");
  const hiveCodeOf = (hiveId: string) => hiveCodes[hiveId] ?? "—";

  const filtered = batches.filter((b) => {
    const q = query.toLowerCase();
    return !q || b.batchCode.toLowerCase().includes(q) || b.honeyType.toLowerCase().includes(q) || hiveCodeOf(b.hiveId).toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search batches..."
          className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No batches match your search.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((batch) => (
            <Link key={batch.id} href={`${basePath}/${batch.id}`}>
              <Card className="h-full transition-transform hover:-translate-y-0.5 hover:border-honey/50">
                <CardContent className="space-y-2.5 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-semibold">{batch.batchCode}</p>
                    <span className="text-xs text-muted-foreground">{hiveCodeOf(batch.hiveId)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Harvest: {formatDate(batch.harvestDate)}</p>
                  <p className="text-sm">{batch.honeyType} · {batch.quantity} kg</p>
                  <BatchStatusBadge status={batch.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
