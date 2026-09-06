import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_BEEKEEPER_ID, getHivesByBeekeeper } from "@/lib/db";

export async function GET(request: NextRequest) {
  const beekeeperId = request.nextUrl.searchParams.get("beekeeperId") ?? DEFAULT_BEEKEEPER_ID;
  return NextResponse.json({ hives: getHivesByBeekeeper(beekeeperId) });
}
