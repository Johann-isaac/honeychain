import { NextResponse } from "next/server";
import { sendBatchToLab } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = sendBatchToLab(id);
  if (!result) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  return NextResponse.json(result);
}
