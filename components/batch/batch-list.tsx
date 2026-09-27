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
        <label htmlFor="batch-search" className="sr-only">
          Search batches
        </label>
        <input
          id="batch-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID, type or hive…"
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No batches match “{query}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((batch) => (
            <Link key={batch.id} href={`${basePath}/${batch.id}`} className="block">
              <Card className="hover-lift flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-sm font-semibold">{batch.batchCode}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{hiveCodeOf(batch.hiveId)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {batch.honeyType} · {batch.quantity} kg
                    </p>
                    <p className="text-xs text-muted-foreground">Harvested {formatDate(batch.harvestDate)}</p>
                  </div>
                  <div className="mt-auto pt-1">
                    <BatchStatusBadge status={batch.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
