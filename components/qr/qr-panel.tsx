"use client";

import * as React from "react";
import Link from "next/link";
import { Download, ExternalLink, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QrPanel({ batchId, batchCode }: { batchId: string; batchCode: string }) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [url, setUrl] = React.useState<string>("");

  React.useEffect(() => {
    fetch(`/api/batches/${batchId}/qr`)
      .then((r) => r.json())
      .then((data) => {
        setDataUrl(data.dataUrl);
        setUrl(data.url);
      });
  }, [batchId]);

  function handlePrint() {
    if (!dataUrl) return;
    const win = window.open("", "_blank", "width=420,height=520");
    if (!win) return;
    win.document.write(`<!doctype html><title>${batchCode} QR</title><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;height:100vh;margin:0;">
      <img src="${dataUrl}" style="width:280px;height:280px" />
      <p style="margin-top:12px;font-size:14px;">HoneyChain Batch Verification — ${batchCode}</p>
    </body>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Verification QR</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR code for ${batchCode}`} className="size-48 rounded-xl border border-border" />
        ) : (
          <div className="size-48 animate-pulse rounded-xl bg-muted" />
        )}
        <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!dataUrl}
            onClick={() => {
              if (!dataUrl) return;
              const a = document.createElement("a");
              a.href = dataUrl;
              a.download = `${batchCode}-qr.png`;
              a.click();
            }}
          >
            <Download className="size-3.5" /> Download QR
          </Button>
          <Button variant="outline" size="sm" disabled={!dataUrl} onClick={handlePrint}>
            <Printer className="size-3.5" /> Print QR
          </Button>
          <Button asChild size="sm">
            <Link href={`/verify/${batchCode}`} target="_blank">
              <ExternalLink className="size-3.5" /> View Consumer Page
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
