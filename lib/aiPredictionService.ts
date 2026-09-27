// Real LLM-backed hive health prediction via OpenRouter — one API key
// that can reach many providers/models (Grok, Llama, Gemini, DeepSeek,
// etc.) through a single OpenAI-compatible endpoint. This is a genuine
// model call (costs a request, takes a few seconds), unlike
// lib/aiHealthService.ts's deterministic scoring — it's triggered on
// demand (see POST /api/hives/[id]/ai-insight), never on every page load.
//
// Model choice is just an env var (OPENROUTER_MODEL): defaults to
// "openrouter/free", an auto-router that always resolves to whatever free
// model is currently available at $0 cost — individual free model slugs
// on OpenRouter rotate/get retired often, so hardcoding one here would
// eventually break. Point it at "x-ai/grok-4-fast" (or another Grok slug)
// once you have OpenRouter credits, with no code change needed.

import "server-only";
import type { Hive, HiveAiInsight, HiveVisualScreening, SensorReading, VisualDiseaseRisk } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const VALID_STATUSES = new Set(["HEALTHY", "AT_RISK", "CRITICAL"]);
const VALID_VISUAL_RISKS = new Set(["NO_CONCERNS_VISIBLE", "POSSIBLE_CONCERN", "NEEDS_INSPECTION"]);

const SYSTEM_PROMPT = `You are an apiculture (beekeeping) expert assistant analyzing IoT hive sensor data.
You will be given a time series of readings from a real beehive: temperature (°C), humidity (%),
weight (kg, from a load cell under the hive), soundLevel (raw analog microphone reading, higher =
louder), and vibration (boolean, a disturbance/swarming trigger). Based on trends and thresholds
consistent with beekeeping science, assess overall colony health.

Respond with ONLY a JSON object — no markdown code fences, no prose before or after it — matching
exactly this shape:
{
  "healthStatus": "HEALTHY" | "AT_RISK" | "CRITICAL",
  "confidence": <integer 0-100>,
  "summary": "<2-3 sentence plain-language summary of the colony's likely condition>",
  "riskFactors": ["<short phrase>", ...up to 4],
  "recommendations": ["<short actionable phrase>", ...up to 4]
}

This is decision support for a beekeeper, not a veterinary or disease diagnosis. If data is sparse
or inconclusive, say so in the summary and lower your confidence rather than guessing.`;

function buildUserPrompt(hive: Hive, readings: SensorReading[]): string {
  const sample = readings.slice(-100); // cap payload size regardless of caller's range
  const series = sample
    .map(
      (r) =>
        `${r.timestamp} | temp=${r.temperature}°C humidity=${r.humidity}% weight=${r.weight}kg sound=${r.soundLevel} vibration=${r.vibration}`
    )
    .join("\n");

  return `Hive: ${hive.name} (${hive.hiveCode})
Queen: ${hive.queenAge} months old, status ${hive.queenStatus}
Colony strength (manual estimate): ${hive.colonyStrength}%
Current status flag: ${hive.status}

Sensor readings (oldest to newest, ${sample.length} of them):
${series || "(no readings recorded yet)"}

Analyze these readings and return the JSON assessment described in your instructions.`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function coerceStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, max);
}

// Free/rotating models behind OpenRouter's auto-router don't reliably
// honor strict JSON mode, so this doesn't rely on response_format at all
// — the system prompt asks for JSON-only, and this extracts the first
// {...} block as a defensive fallback for whatever prose a given model
// wraps around it. Every field is then validated/clamped so a malformed
// or hallucinated response can't crash the caller or store garbage.
function parseInsight(content: string): HiveAiInsight {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : content;
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  const healthStatus = typeof parsed.healthStatus === "string" && VALID_STATUSES.has(parsed.healthStatus)
    ? (parsed.healthStatus as HiveAiInsight["healthStatus"])
    : "AT_RISK";

  const confidence = clamp(Math.round(Number(parsed.confidence) || 0), 0, 100);
  const summary = typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "No summary returned.";

  return {
    healthStatus,
    confidence,
    summary,
    riskFactors: coerceStringArray(parsed.riskFactors, 4),
    recommendations: coerceStringArray(parsed.recommendations, 4),
  };
}

export async function analyzeHiveHealth(hive: Hive, readings: SensorReading[]): Promise<HiveAiInsight> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured on the server — add it to .env.local (see .env.local.example).");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // Optional but recommended by OpenRouter for attribution/rankings —
      // harmless to omit, never required for the request to work.
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "HoneyChain",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(hive, readings) },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenRouter API error (${response.status}): ${errorText.slice(0, 300) || response.statusText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter API returned an empty response.");
  }

  try {
    return parseInsight(content);
  } catch {
    throw new Error("The AI model's response could not be parsed as the expected JSON shape — try a different OPENROUTER_MODEL.");
  }
}

// ---------------------------------------------------------------------------
// Visual screening from the hive camera — a SEPARATE, clearly-labeled
// feature from analyzeHiveHealth() above. This is NOT a trained
// disease-detection model: there is no labeled bee-disease dataset behind
// it, no training step, no accuracy figure to quote. It's a live call to
// a general-purpose vision-capable model, asked to describe what it sees
// in one photo. Treat its output as a rough first-pass screening prompt
// for a manual inspection, never as a diagnosis — a real diagnosis needs
// a qualified apiarist or lab test, not an LLM looking at one photo.
// ---------------------------------------------------------------------------

const VISION_SYSTEM_PROMPT = `You are assisting a beekeeper by looking at one photo of their hive (entrance,
frame, or landing board — whatever the camera captured). You are a general-purpose vision model, not a
trained bee-disease classifier, and you have no ground-truth dataset backing your assessment — so be
conservative and say when the photo doesn't show enough to judge.

Look for anything a beekeeper would want flagged: visible mites on bees, discolored or sunken brood cells,
unusual bee posture or clustering, mold, unusual debris, or anything else visually abnormal for a healthy
hive entrance/frame. Most photos will show nothing concerning — that's a normal, valid result, not a
failure to find something.

Respond with ONLY a JSON object — no markdown fences, no prose outside it — matching exactly:
{
  "diseaseRisk": "NO_CONCERNS_VISIBLE" | "POSSIBLE_CONCERN" | "NEEDS_INSPECTION",
  "confidence": <integer 0-100>,
  "observations": "<1-3 sentences on what the photo actually shows>",
  "visibleSigns": ["<short phrase>", ...up to 4, empty array if none]
}

This is a rough visual screening aid, not a diagnosis. If the image is blurry, too dark, or doesn't show
bees clearly, say so in "observations" and use a low confidence rather than guessing.`;

function parseVisualScreening(content: string): HiveVisualScreening {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : content;
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  const diseaseRisk = typeof parsed.diseaseRisk === "string" && VALID_VISUAL_RISKS.has(parsed.diseaseRisk)
    ? (parsed.diseaseRisk as VisualDiseaseRisk)
    : "NEEDS_INSPECTION";

  const confidence = clamp(Math.round(Number(parsed.confidence) || 0), 0, 100);
  const observations = typeof parsed.observations === "string" && parsed.observations.trim()
    ? parsed.observations.trim()
    : "No observations returned.";

  return {
    diseaseRisk,
    confidence,
    observations,
    visibleSigns: coerceStringArray(parsed.visibleSigns, 4),
  };
}

// snapshotUrl must be a publicly reachable URL (the "hive-snapshots" bucket
// is public-read) — OpenRouter's servers fetch it directly, we never
// upload image bytes to the API ourselves.
export async function analyzeHiveImage(snapshotUrl: string): Promise<HiveVisualScreening> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured on the server.");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "HoneyChain",
    },
    body: JSON.stringify({
      // "openrouter/free" (same default as analyzeHiveHealth) is smart
      // enough to detect that this request includes an image and route to
      // a vision-capable free model automatically — far more resilient
      // than hardcoding a specific free vision slug, which rotate and get
      // retired often (confirmed the hard way: qwen2.5-vl-3b-instruct:free
      // was already gone days after being a documented option).
      // OPENROUTER_VISION_MODEL can still override this with a specific
      // paid vision model once there are OpenRouter credits.
      model: process.env.OPENROUTER_VISION_MODEL ?? "openrouter/free",
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Assess this hive photo and return the JSON described in your instructions." },
            { type: "image_url", image_url: { url: snapshotUrl } },
          ],
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenRouter vision API error (${response.status}): ${errorText.slice(0, 300) || response.statusText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter vision API returned an empty response.");
  }

  try {
    return parseVisualScreening(content);
  } catch {
    throw new Error("The vision model's response could not be parsed — try a different OPENROUTER_VISION_MODEL.");
  }
}
