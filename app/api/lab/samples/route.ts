import { NextResponse } from "next/server";
import { getEnrichedLabSamples } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ samples: getEnrichedLabSamples() });
}
