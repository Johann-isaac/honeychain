import { NextResponse } from "next/server";
import { getAlertsForBeekeeper, getBeekeeperById, getBeekeeperDashboard, getHivesByBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export async function GET() {
  const beekeeperId = await getCurrentBeekeeperId();
  const beekeeper = await getBeekeeperById(beekeeperId);
  if (!beekeeper) return NextResponse.json({ error: "Beekeeper not found" }, { status: 404 });

  const [kpis, hives, alerts] = await Promise.all([
    getBeekeeperDashboard(beekeeperId),
    getHivesByBeekeeper(beekeeperId),
    getAlertsForBeekeeper(beekeeperId),
  ]);

  return NextResponse.json({ beekeeper, kpis, hives, alerts });
}
