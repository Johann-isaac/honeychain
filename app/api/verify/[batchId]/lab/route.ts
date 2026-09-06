import { NextResponse } from "next/server";
import { getPublicVerification } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const result = getPublicVerification(batchId);
  if (!result.found) return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  return NextResponse.json({ lab: result.lab });
}
