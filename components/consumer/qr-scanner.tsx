"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrScanner() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const frameRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        if (!cancelled) setError("Camera access was denied or is unavailable. You can enter the Batch ID manually instead.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            const match = code.data.match(/\/verify\/([A-Za-z0-9-]+)/);
            const batchCode = match ? match[1] : code.data;
            handleClose();
            router.push(`/verify/${encodeURIComponent(batchCode)}`);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setOpen(false);
    setError(null);
  }

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Camera className="size-4" /> Scan QR Code
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal/90 p-4">
          <button onClick={handleClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-cream" aria-label="Close scanner">
            <X className="size-5" />
          </button>
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-honey">
            <video ref={videoRef} className="w-full" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-honey/70" />
          </div>
          <p className="mt-4 max-w-sm text-center text-sm text-cream/80">
            {error ?? "Point your camera at a HoneyChain batch QR code."}
          </p>
        </div>
      )}
    </>
  );
}
