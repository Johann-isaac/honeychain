import { Badge } from "@/components/ui/badge";
import type { BatchStatus } from "@/types";

export const batchStatusMeta: Record<BatchStatus, { label: string; variant: "success" | "warning" | "destructive" | "muted"; dot: string }> = {
  DRAFT: { label: "Registering…", dot: "⚪", variant: "muted" },
  BLOCKCHAIN_REGISTERED: { label: "Blockchain Verified", dot: "🟢", variant: "success" },
  REGISTRATION_FAILED: { label: "Registration Failed", dot: "🔴", variant: "destructive" },
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const meta = batchStatusMeta[status];
  return (
    <Badge variant={meta.variant}>
      {meta.dot} {meta.label}
    </Badge>
  );
}
