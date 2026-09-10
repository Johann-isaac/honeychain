import { NextRequest, NextResponse } from "next/server";
import { getDefaultBeekeeperId, createBatch, getBatchesByBeekeeper, getHiveById } from "@/lib/db";
import { ValidationError, requirePositiveNumber, requireString, sanitizeText } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const beekeeperId = request.nextUrl.searchParams.get("beekeeperId") ?? (await getDefaultBeekeeperId());
  return NextResponse.json({ batches: await getBatchesByBeekeeper(beekeeperId) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const hiveId = requireString(body.hiveId, "Hive");
    const hive = await getHiveById(hiveId);
    if (!hive) throw new ValidationError("Selected hive does not exist.");

    const harvestDate = requireString(body.harvestDate, "Harvest date");
    const quantity = requirePositiveNumber(body.quantity, "Harvest quantity");
    const honeyType = sanitizeText(requireString(body.honeyType, "Honey type", { maxLength: 60 }));
    const floralSource = sanitizeText(requireString(body.floralSource, "Floral source", { maxLength: 80 }));
    const extractionMethod = sanitizeText(requireString(body.extractionMethod, "Extraction method", { maxLength: 60 }));
    const storageTemperature = requirePositiveNumber(body.storageTemperature, "Storage temperature");
    const storageLocation = sanitizeText(requireString(body.storageLocation, "Storage location", { maxLength: 120 }));

    const batch = await createBatch({
      hiveId,
      beekeeperId: hive.beekeeperId,
      harvestDate,
      quantity,
      honeyType,
      floralSource,
      extractionMethod,
      storageTemperature,
      storageLocation,
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create batch." }, { status: 400 });
  }
}
