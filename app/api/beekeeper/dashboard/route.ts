import { NextRequest, NextResponse } from "next/server";
import { getDefaultBeekeeperId, getAlertsForBeekeeper, getBeekeeperById, getBeekeeperDashboard, getHivesByBeekeeper } from "@/lib/db";

export async function GET(request: NextRequest) {
  const beekeeperId = request.nextUrl.searchParams.get("beekeeperId") ?? (await getDefaultBeekeeperId());
  const beekeeper = await getBeekeeperById(beekeeperId);
  if (!beekeeper) return NextResponse.json({ error: "Beekeeper not found" }, { status: 404 });

  const [kpis, hives, alerts] = await Promise.all([
    getBeekeeperDashboard(beekeeperId),
    getHivesByBeekeeper(beekeeperId),
    getAlertsForBeekeeper(beekeeperId),
  ]);

  return NextResponse.json({ beekeeper, kpis, hives, alerts });
}
