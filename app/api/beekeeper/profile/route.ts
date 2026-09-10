import { NextRequest, NextResponse } from "next/server";
import { getDefaultBeekeeperId, updateBeekeeper } from "@/lib/db";
import { ValidationError, requireString, sanitizeText } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const name = sanitizeText(requireString(body.name, "Name", { maxLength: 80 }));
    const region = sanitizeText(requireString(body.region, "Region", { maxLength: 120 }));
    const phone = typeof body.phone === "string" ? sanitizeText(body.phone).slice(0, 40) : undefined;

    const beekeeperId = await getDefaultBeekeeperId();
    const beekeeper = await updateBeekeeper(beekeeperId, { name, region, phone });
    return NextResponse.json({ beekeeper });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update profile." }, { status: 400 });
  }
}
