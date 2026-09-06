"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { EnrichedLabSample } from "@/lib/db";

const statusMeta: Record<EnrichedLabSample["status"], { label: string; variant: "warning" | "success" | "muted" }> = {
  PENDING: { label: "Testing Pending", variant: "warning" },
  TESTING_IN_PROGRESS: { label: "In Progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export function SamplesTable({ samples, emptyLabel }: { samples: EnrichedLabSample[]; emptyLabel: string }) {
  const [query, setQuery] = React.useState("");

  const filtered = samples.filter((s) => {
    const q = query.toLowerCase();
    return (
      !q ||
      s.batchCode.toLowerCase().includes(q) ||
      s.beekeeperCode.toLowerCase().includes(q) ||
      s.hiveCode.toLowerCase().includes(q) ||
      s.honeyType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search samples..."
          className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Batch ID</th>
                <th className="px-4 py-3 font-medium">Beekeeper</th>
                <th className="px-4 py-3 font-medium">Hive</th>
                <th className="px-4 py-3 font-medium">Honey Type</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{s.batchCode}</td>
                  <td className="px-4 py-3">{s.beekeeperCode}</td>
                  <td className="px-4 py-3">{s.hiveCode}</td>
                  <td className="px-4 py-3">{s.honeyType}</td>
                  <td className="px-4 py-3">{s.quantity} kg</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.receivedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusMeta[s.status].variant}>{statusMeta[s.status].label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.priority === "HIGH" ? <Badge variant="destructive">High</Badge> : <Badge variant="muted">Normal</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/lab/samples/${s.id}`}>Open Sample</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
