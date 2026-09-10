import { NextRequest, NextResponse } from "next/server";
import { getSensorReadings } from "@/lib/db";

const RANGE_HOURS: Record<string, number | undefined> = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const range = (request.nextUrl.searchParams.get("range") ?? "24h").toLowerCase();
  const hours = RANGE_HOURS[range] ?? 24;
  return NextResponse.json({ readings: await getSensorReadings(id, hours) });
}
