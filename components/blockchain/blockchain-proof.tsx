import { CheckCircle2, ExternalLink, Link2, ShieldAlert } from "lucide-react";
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

export function BlockchainProof({ record, showLink = false }: { record: BlockchainProofRecord | null; showLink?: boolean }) {
  if (!record) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <ShieldAlert className="size-5 shrink-0" />
          This batch has not been registered on the blockchain yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-nature/30 bg-nature/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4 text-nature" /> Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {record.isDemo && (
          <Badge variant="warning">Demo Blockchain Transaction</Badge>
        )}
        <div className="space-y-1.5 text-sm">
          <p className="flex items-center gap-1.5 text-success"><CheckCircle2 className="size-4" /> Batch registered</p>
          <p className="flex items-center gap-1.5 text-success"><CheckCircle2 className="size-4" /> Lab result recorded</p>
          <p className="flex items-center gap-1.5 text-success"><CheckCircle2 className="size-4" /> Record integrity verified</p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-card p-3 text-xs">
          <Info label="Network" value={record.network} />
          <Info label="Block" value={`#${record.blockNumber.toLocaleString()}`} />
          <Info label="Transaction ID" value={truncateHash(record.transactionHash)} mono />
          <Info label="Timestamp" value={formatDateTime(record.timestamp)} />
        </div>
        {showLink && (
          <a
            href={`#tx-${record.transactionHash}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-nature underline underline-offset-2"
          >
            View Blockchain Record <ExternalLink className="size-3" />
          </a>
        )}
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {record.isDemo
            ? "Demo network — not a real on-chain transaction. Swap in a live provider to go to production."
            : "Live network transaction."}
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
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono" : "font-medium"}>{value}</p>
    </div>
  );
}
