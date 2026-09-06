import { NextResponse } from "next/server";
import { getHiveById, getHiveHealth, getHiveYieldPrediction, getLatestSensorReading } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hive = getHiveById(id);
  if (!hive) return NextResponse.json({ error: "Hive not found" }, { status: 404 });

  return NextResponse.json({
    hive,
    latestReading: getLatestSensorReading(id) ?? null,
    health: getHiveHealth(id),
    yieldPrediction: getHiveYieldPrediction(id),
  });
}
