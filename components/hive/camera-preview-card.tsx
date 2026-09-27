"use client";

import * as React from "react";
import { Camera, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

// Polls for a new snapshot every 15s — the camera board uploads on its
// own schedule (see firmware/esp32_hive_camera), this just picks up
// whatever's newest. Not real video: a frequently-refreshed still image,
// which is the realistic version of "live" for a board with no public IP.
const POLL_INTERVAL_MS = 15000;

export function CameraPreviewCard({
  hiveId,
  initialSnapshotUrl,
  initialCapturedAt,
}: {
  hiveId: string;
  initialSnapshotUrl?: string;
  initialCapturedAt?: string;
}) {
  const [snapshotUrl, setSnapshotUrl] = React.useState<string | undefined>(initialSnapshotUrl);
  const [capturedAt, setCapturedAt] = React.useState<string | undefined>(initialCapturedAt);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/hives/${hiveId}/snapshot`);
        const data = await res.json();
        if (cancelled) return;
        if (data.snapshotUrl) {
          setSnapshotUrl(data.snapshotUrl);
          setCapturedAt(data.capturedAt);
          setImageError(false);
        }
      } catch {
        // Silent — next poll retries. A transient failure here shouldn't
        // flash an error state over what might still be a perfectly good
        // last-known image.
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hiveId]);

  // Cache-bust so the browser doesn't reuse a stale cached image for a
  // URL that (by design) stays the same path every time it's overwritten.
  const displayUrl = snapshotUrl && capturedAt ? `${snapshotUrl}?t=${encodeURIComponent(capturedAt)}` : snapshotUrl;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Camera className="size-4 text-primary" /> Hive Camera
        </CardTitle>
        {snapshotUrl && (
          <Badge variant="success">
            <RefreshCw className="size-3" /> Live
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {!snapshotUrl || imageError ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No snapshot yet — waiting for the hive camera to send its first image.
          </p>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, refreshed on a timer */}
            <img
              src={displayUrl}
              alt="Latest snapshot from the hive camera"
              className="w-full rounded-xl border border-border object-cover"
              onError={() => setImageError(true)}
            />
            <p className="mt-3 text-right text-[11px] text-muted-foreground">
              {capturedAt ? `Captured ${formatDateTime(capturedAt)}` : ""}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
