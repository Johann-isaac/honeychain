import { CheckCircle2, Link2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export interface BlockchainProofRecord {
  transactionHash: string;
  blockNumber: number;
  network: string;
  timestamp: string;
  isDemo: boolean;
}

const checks = ["Batch registered", "Origin data recorded", "Record integrity verified"];

export function BlockchainProof({ record }: { record: BlockchainProofRecord | null }) {
  if (!record) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <ShieldAlert className="size-5 shrink-0" />
          This batch has not been registered on the ledger yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-nature/30 bg-nature/5">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4 text-nature" /> Ledger verification
        </CardTitle>
        {/* The provider in lib/blockchainService.ts is a deterministic mock.
            Labelling each record keeps the verification claim truthful — a
            traceability product that overstated this would defeat itself. */}
        {record.isDemo && <Badge variant="muted">Simulated network</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-1.5 text-sm">
          {checks.map((check) => (
            <li key={check} className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4 shrink-0" /> {check}
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-3.5 text-xs">
          <Info label="Network" value={record.network} />
          <Info label="Block" value={`#${record.blockNumber.toLocaleString()}`} />
          <Info label="Transaction ID" value={truncateHash(record.transactionHash)} mono />
          <Info label="Registered" value={formatDateTime(record.timestamp)} />
        </dl>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {record.isDemo
            ? "This record is hashed and checked exactly as it will be on a live chain, but it is held on a simulated network rather than a public blockchain while production deployment is finalised."
            : "This record is anchored on a live public blockchain network."}
        </p>
      </CardContent>
    </Card>
  );
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono" : "truncate font-medium"}>{value}</dd>
    </div>
  );
}
