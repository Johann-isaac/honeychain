import { NextRequest, NextResponse } from "next/server";
import { verifyHiveDeviceSecret, insertSensorReading } from "@/lib/db";
import { ValidationError, requireNumberInRange, requireString } from "@/lib/validation";

// POST /api/hive-data — the one endpoint an ESP32 ever calls.
//
// SECURITY: this route holds the Supabase service_role key indirectly
// (via lib/db.ts → lib/supabase/server.ts) and is the only thing allowed
// to. The ESP32 itself never sees that key — it only ever sends this
// route a Bearer token, which is that specific hive's device secret
// (shown once when the hive was registered from the dashboard). Each
// hive has its own secret, so one device's credential can never be used
// to post data under a different hive's id.
//
// Expected payload (see firmware/esp32_hive_monitor/esp32_hive_monitor.ino):
//   {
//     "hiveId": "HIVE-001",       // hive_code from /beekeeper/hives/new
//     "temperature": 34.2,
//     "humidity": 62.5,
//     "prototypeWeight": 42.35,
//     "soundLevel": 1847,
//     "vibration": false
//   }
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const payload = body as Record<string, unknown>;
    const hiveCode = requireString(payload.hiveId, "hiveId");

    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized device." }, { status: 401 });
    }

    const hive = await verifyHiveDeviceSecret(hiveCode, token);
    if (!hive) {
      return NextResponse.json(
        { success: false, message: `Unknown hiveId or wrong device secret for "${hiveCode}".` },
        { status: 401 }
      );
    }

    const temperature = requireNumberInRange(payload.temperature, "temperature", -10, 60);
    const humidity = requireNumberInRange(payload.humidity, "humidity", 0, 100);
    const weight = requireNumberInRange(payload.prototypeWeight, "prototypeWeight", 0, 200);
    const soundLevel = requireNumberInRange(payload.soundLevel, "soundLevel", 0, 4095);
    if (typeof payload.vibration !== "boolean") {
      throw new ValidationError("vibration must be a boolean.");
    }

    await insertSensorReading({
      hiveId: hive.id,
      temperature,
      humidity,
      weight,
      soundLevel,
      vibration: payload.vibration,
      recordedAt: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
    });

    return NextResponse.json({ success: true, message: "Hive data recorded" }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, message: `Invalid sensor data: ${err.message}` }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Invalid sensor data" }, { status: 400 });
  }
}
