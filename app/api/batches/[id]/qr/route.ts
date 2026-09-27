import { NextRequest, NextResponse } from "next/server";
import { getBatchById } from "@/lib/db";
import { generateBatchQrDataUrl, getVerificationUrl } from "@/lib/qrService";
import { getCurrentBeekeeperId } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beekeeperId = await getCurrentBeekeeperId();
  const batch = await getBatchById(id);
  if (!batch || batch.beekeeperId !== beekeeperId) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  const origin = request.nextUrl.origin;
  const dataUrl = await generateBatchQrDataUrl(batch.batchCode, origin);
  return NextResponse.json({ dataUrl, url: getVerificationUrl(batch.batchCode, origin), batchCode: batch.batchCode });
}
