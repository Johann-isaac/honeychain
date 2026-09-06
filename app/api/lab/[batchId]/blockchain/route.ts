import { NextResponse } from "next/server";
import { getLabReportByBatch, registerBatchOnBlockchain } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const report = getLabReportByBatch(batchId);
  if (!report) return NextResponse.json({ error: "No approved lab report for this batch yet." }, { status: 400 });
  if (report.overallResult !== "PASSED") {
    return NextResponse.json({ error: "Only passed batches can be registered on the blockchain." }, { status: 400 });
  }

  const record = await registerBatchOnBlockchain(batchId);
  if (!record) return NextResponse.json({ error: "Blockchain registration failed." }, { status: 500 });
  return NextResponse.json({ record }, { status: 201 });
}
