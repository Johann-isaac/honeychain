import { NextResponse } from "next/server";
import { getHiveById, getSensorReadings, saveHiveAiInsight } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";
import { analyzeHiveHealth, analyzeHiveImage } from "@/lib/aiPredictionService";

// POST /api/hives/[id]/ai-insight — beekeeper-triggered only (not called
// automatically on page load): this is a real OpenRouter API request, and
// we don't want it firing every time the hive detail page renders.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beekeeperId = await getCurrentBeekeeperId();

  const hive = await getHiveById(id);
  if (!hive || hive.beekeeperId !== beekeeperId) {
    return NextResponse.json({ error: "Hive not found" }, { status: 404 });
  }

  const readings = await getSensorReadings(id, 24 * 14); // up to 2 weeks of history

  try {
    const insight = await analyzeHiveHealth(hive, readings);

    // Visual screening only runs if a camera snapshot exists, and its
    // failure never fails the whole request — the sensor-based insight is
    // still useful on its own, so a vision-model hiccup just means no
    // visualScreening field this time rather than a 502 for everything.
    if (hive.latestSnapshotUrl) {
      try {
        insight.visualScreening = await analyzeHiveImage(hive.latestSnapshotUrl);
      } catch (visionErr) {
        console.error("Visual screening failed (non-fatal):", visionErr);
      }
    }

    const updatedHive = await saveHiveAiInsight(id, insight);
    return NextResponse.json({ insight, generatedAt: updatedHive.aiInsightGeneratedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to generate AI insight.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
