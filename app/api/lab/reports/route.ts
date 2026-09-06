import { NextRequest, NextResponse } from "next/server";
import { approveLabReport, labProfile } from "@/lib/db";
import { ValidationError, requireString } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sampleId = requireString(body.sampleId, "Sample ID");
    const report = approveLabReport(sampleId, labProfile.technicianId);
    if (!report) {
      throw new ValidationError("Sample has no recorded tests yet, or was not found.");
    }
    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to approve report." }, { status: 400 });
  }
}
