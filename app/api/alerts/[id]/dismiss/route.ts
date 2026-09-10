import { NextResponse } from "next/server";
import { dismissAlert } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await dismissAlert(id);
  if (!ok) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
