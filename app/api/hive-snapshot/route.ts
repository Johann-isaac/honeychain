import { NextRequest, NextResponse } from "next/server";
import { verifyHiveDeviceSecret, updateHiveSnapshot } from "@/lib/db";
import { saveHiveSnapshot, SnapshotError } from "@/lib/snapshotService";

// POST /api/hive-snapshot?hiveId=HIVE-001 — the one endpoint an ESP32-CAM
// ever calls. Same device-secret auth model as /api/hive-data (see that
// route's comment), but the body is a raw JPEG instead of JSON, since
// there's no sensor payload to wrap it in — just:
//   Authorization: Bearer <this hive's device secret>
//   Content-Type: image/jpeg
//   <raw JPEG bytes as the body>
export async function POST(request: NextRequest) {
  const hiveCode = request.nextUrl.searchParams.get("hiveId");
  if (!hiveCode) {
    return NextResponse.json({ success: false, message: "hiveId query parameter is required." }, { status: 400 });
  }

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

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/jpeg")) {
    return NextResponse.json({ success: false, message: "Content-Type must be image/jpeg." }, { status: 400 });
  }

  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    const storagePath = await saveHiveSnapshot(hive.id, bytes);
    await updateHiveSnapshot(hive.id, storagePath);
    return NextResponse.json({ success: true, message: "Snapshot recorded" }, { status: 201 });
  } catch (err) {
    console.error("hive-snapshot upload failed:", err);
    if (err instanceof SnapshotError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Unable to store snapshot." }, { status: 500 });
  }
}
