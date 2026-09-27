import { NextRequest, NextResponse } from "next/server";
import { createHive, getHivesByBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";
import { ValidationError, requireString, sanitizeText } from "@/lib/validation";

export async function GET() {
  const beekeeperId = await getCurrentBeekeeperId();
  return NextResponse.json({ hives: await getHivesByBeekeeper(beekeeperId) });
}

// Registers a new physical hive. The returned hive.hiveCode is what gets
// flashed into that hive's ESP32 firmware as HIVE_ID, and deviceSecret is
// what gets flashed in as DEVICE_SECRET — both must match what the ESP32
// sends to /api/hive-data. The secret is only ever shown here, once.
export async function POST(request: NextRequest) {
  try {
    const beekeeperId = await getCurrentBeekeeperId();
    const body = await request.json();

    const name = sanitizeText(requireString(body.name, "Hive name", { maxLength: 60 }));
    const location = sanitizeText(requireString(body.location, "Location", { maxLength: 120 }));

    const { hive, deviceSecret } = await createHive({ beekeeperId, name, location });
    return NextResponse.json({ hive, deviceSecret }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create hive." }, { status: 400 });
  }
}
