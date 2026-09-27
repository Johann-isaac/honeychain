import { NextResponse } from "next/server";
import { dismissAlertForBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beekeeperId = await getCurrentBeekeeperId();
  const ok = await dismissAlertForBeekeeper(id, beekeeperId);
  if (!ok) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
