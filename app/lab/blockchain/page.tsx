import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { getAllBlockchainRecords, getBatchById } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function BlockchainRecordsPage() {
  const records = getAllBlockchainRecords().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Blockchain Records</h1>
        <p className="text-sm text-muted-foreground">All batches registered on the HoneyChain demo ledger.</p>
      </div>

      {records.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No blockchain records yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Transaction</th>
                <th className="px-4 py-3 font-medium">Block</th>
                <th className="px-4 py-3 font-medium">Network</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{getBatchById(r.batchId)?.batchCode ?? r.batchId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.transactionHash.slice(0, 10)}…{r.transactionHash.slice(-6)}</td>
                  <td className="px-4 py-3">#{r.blockNumber.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.network}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(r.timestamp)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">
                      <Link2 className="size-3" /> {r.status}
                    </Badge>
                    {r.isDemo && <Badge variant="warning" className="ml-1.5">Demo</Badge>}
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
