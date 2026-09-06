"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SendToLabButton({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/batches/${batchId}/send-to-lab`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      <Send className="size-4" /> {loading ? "Sending…" : "Send to Laboratory"}
    </Button>
  );
}
