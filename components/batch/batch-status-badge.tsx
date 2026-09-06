import { Badge } from "@/components/ui/badge";
import type { BatchStatus } from "@/types";

export const batchStatusMeta: Record<BatchStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "muted"; dot: string }> = {
  DRAFT: { label: "Draft", dot: "⚪", variant: "muted" },
  AWAITING_LAB: { label: "Awaiting Laboratory Testing", dot: "🟡", variant: "warning" },
  IN_TESTING: { label: "Testing In Progress", dot: "🟡", variant: "warning" },
  LAB_PASSED: { label: "Lab Passed", dot: "🟢", variant: "success" },
  LAB_FAILED: { label: "Lab Failed", dot: "🔴", variant: "destructive" },
  BLOCKCHAIN_REGISTERED: { label: "Blockchain Verified", dot: "🟢", variant: "success" },
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const meta = batchStatusMeta[status];
  return (
    <Badge variant={meta.variant}>
      {meta.dot} {meta.label}
    </Badge>
  );
}
