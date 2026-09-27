import { NextResponse } from "next/server";
import { getHiveById } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

// Polled by the beekeeper's "live" camera preview (components/hive/camera-preview-card.tsx)
// every ~15s. Deliberately tiny — just the latest snapshot's URL and
// timestamp — rather than reusing the full hive GET, so frequent polling
// stays cheap.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beekeeperId = await getCurrentBeekeeperId();

  const hive = await getHiveById(id);
  if (!hive || hive.beekeeperId !== beekeeperId) {
    return NextResponse.json({ error: "Hive not found" }, { status: 404 });
  }

  return NextResponse.json({
    snapshotUrl: hive.latestSnapshotUrl ?? null,
    capturedAt: hive.latestSnapshotAt ?? null,
  });
}
