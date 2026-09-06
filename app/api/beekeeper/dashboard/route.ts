import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_BEEKEEPER_ID, getAlertsForBeekeeper, getBeekeeperById, getBeekeeperDashboard, getHivesByBeekeeper } from "@/lib/db";

export async function GET(request: NextRequest) {
  const beekeeperId = request.nextUrl.searchParams.get("beekeeperId") ?? DEFAULT_BEEKEEPER_ID;
  const beekeeper = getBeekeeperById(beekeeperId);
  if (!beekeeper) return NextResponse.json({ error: "Beekeeper not found" }, { status: 404 });

  const kpis = getBeekeeperDashboard(beekeeperId);
  const hives = getHivesByBeekeeper(beekeeperId);
  const alerts = getAlertsForBeekeeper(beekeeperId);

  return NextResponse.json({ beekeeper, kpis, hives, alerts });
}
