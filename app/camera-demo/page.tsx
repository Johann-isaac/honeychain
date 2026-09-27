"use client";

// Presentation fallback ONLY — not part of the real product architecture.
// Simulates an ESP32-CAM by capturing frames from the laptop's webcam and
// posting them to the exact same POST /api/hive-snapshot endpoint the real
// hardware uses, with the same device-secret auth. This means everything
// downstream (the beekeeper's "Hive Camera" card, the consumer /verify
// page) works completely normally — they can't tell the difference from
// a real camera board. Safe to delete once real hardware is working.

import * as React from "react";
import { Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";

const CAPTURE_INTERVAL_MS = 15000;

export default function CameraDemoPage() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hiveId, setHiveId] = React.useState("");
  const [deviceSecret, setDeviceSecret] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  function addLog(line: string) {
    setLog((prev) => [`${new Date().toLocaleTimeString()} — ${line}`, ...prev].slice(0, 20));
  }

  async function start() {
    setError(null);
    if (!hiveId.trim() || !deviceSecret.trim()) {
      setError("Enter both Hive ID and device secret first.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 800, height: 600 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      addLog("Webcam started.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not access the webcam.");
    }
  }

  function stop() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    addLog("Stopped.");
  }

  const captureAndSend = React.useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        try {
          const res = await fetch(`/api/hive-snapshot?hiveId=${encodeURIComponent(hiveId)}`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg", Authorization: `Bearer ${deviceSecret}` },
            body: blob,
          });
          const data = await res.json();
          addLog(res.ok ? "Snapshot sent successfully." : `Rejected: ${data.message ?? res.status}`);
        } catch {
          addLog("Network error sending snapshot.");
        }
      },
      "image/jpeg",
      0.85
    );
  }, [hiveId, deviceSecret]);

  React.useEffect(() => {
    if (!running) return;
    captureAndSend(); // send one immediately, then on the interval
    const interval = setInterval(captureAndSend, CAPTURE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running, captureAndSend]);

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-honey-dark dark:text-honey">
        Hive tooling
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Camera bridge</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Streams snapshots from this device&apos;s camera to a hive, using the same endpoint and device
        credential as an ESP32-CAM board. Useful for testing the camera pipeline before hardware is fitted.
      </p>

      <Card className="mt-8">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <label htmlFor="bridge-hive-id" className="field-label">
              Hive ID
            </label>
            <input
              id="bridge-hive-id"
              value={hiveId}
              onChange={(e) => setHiveId(e.target.value)}
              placeholder="HIVE-001"
              disabled={running}
              className="input mt-1.5"
            />
          </div>

          <div>
            <label htmlFor="bridge-secret" className="field-label">
              Device secret
            </label>
            <input
              id="bridge-secret"
              type="password"
              value={deviceSecret}
              onChange={(e) => setDeviceSecret(e.target.value)}
              placeholder="Shown once when the hive was registered"
              disabled={running}
              className="input mt-1.5"
            />
            <span className="field-hint">Sent as a bearer token, exactly as the firmware sends it.</span>
          </div>

          {error && <FormMessage>{error}</FormMessage>}

          <div className="flex items-center gap-3">
            {!running ? (
              <Button onClick={start}>
                <Video className="size-4" /> Start streaming
              </Button>
            ) : (
              <Button onClick={stop} variant="outline">
                <Square className="size-4" /> Stop
              </Button>
            )}
            {running && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <span className="size-1.5 rounded-full bg-success animate-pulse-ring" />
                Sending every {CAPTURE_INTERVAL_MS / 1000}s
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-charcoal">
        <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {log.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity log</p>
          <ul className="scrollbar-thin mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
