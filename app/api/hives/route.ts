import { NextRequest, NextResponse } from "next/server";
import { getDefaultBeekeeperId, createHive, getHivesByBeekeeper } from "@/lib/db";
import { ValidationError, requireString, sanitizeText } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const beekeeperId = request.nextUrl.searchParams.get("beekeeperId") ?? (await getDefaultBeekeeperId());
  return NextResponse.json({ hives: await getHivesByBeekeeper(beekeeperId) });
}

// Registers a new physical hive. The returned hive.hiveCode is what gets
// flashed into that hive's ESP32 firmware as HIVE_ID, and what the ESP32
// must send as "hiveId" in every /api/hive-data payload.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = sanitizeText(requireString(body.name, "Hive name", { maxLength: 60 }));
    const location = sanitizeText(requireString(body.location, "Location", { maxLength: 120 }));
    const beekeeperId = await getDefaultBeekeeperId();

    const hive = await createHive({ beekeeperId, name, location });
    return NextResponse.json({ hive }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create hive." }, { status: 400 });
  }
}
