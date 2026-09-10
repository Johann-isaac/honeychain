import { NextResponse } from "next/server";
import { getHiveById, getHiveHealth, getHiveYieldPrediction, getLatestSensorReading } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hive = await getHiveById(id);
  if (!hive) return NextResponse.json({ error: "Hive not found" }, { status: 404 });

  const [latestReading, health, yieldPrediction] = await Promise.all([
    getLatestSensorReading(id),
    getHiveHealth(id),
    getHiveYieldPrediction(id),
  ]);

  return NextResponse.json({
    hive,
    latestReading: latestReading ?? null,
    health,
    yieldPrediction,
  });
}
