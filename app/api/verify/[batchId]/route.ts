import { NextResponse } from "next/server";
import { getPublicVerification } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const result = await getPublicVerification(batchId);
  if (!result.found) {
    return NextResponse.json(
      { found: false, error: "We couldn't verify this batch. Please check the Batch ID or scan the QR code again." },
      { status: 404 }
    );
  }
  return NextResponse.json(result);
}
