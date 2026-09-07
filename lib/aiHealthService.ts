import type { AiHealthResult, Hive, HoneyBatch, SensorReading, YieldPrediction } from "@/types";

// aiHealthService — deterministic, decision-support calculations only.
//
// IMPORTANT: this service is explicitly "AI-assisted monitoring", not a
// diagnostic tool. It never claims to diagnose bee diseases; it surfaces
// "potential anomalies" and general recommendations from sensor thresholds.
// Scores are derived directly from the input readings so the same inputs
// always produce the same output (no Math.random at call time).
//
// Every input here maps to one of the four physical sensors on the
// prototype: DHT22 (temperature, humidity), load cell + HX711 (weight),
// analog microphone (soundLevel), digital vibration sensor (vibration).

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function scoreAroundIdeal(value: number, idealMin: number, idealMax: number, tolerance: number) {
  if (value >= idealMin && value <= idealMax) return 100;
  const distance = value < idealMin ? idealMin - value : value - idealMax;
  return clamp(100 - (distance / tolerance) * 100);
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeHiveHealth(hive: Hive, readings: SensorReading[]): AiHealthResult {
  const recent = readings.slice(-24); // most recent readings window
  const latest = recent[recent.length - 1] ?? readings[readings.length - 1];

  if (!latest) {
    return {
      healthScore: 0,
      riskLevel: "MODERATE",
      breakdown: { temperature: 0, humidity: 0, weightTrend: 0, soundActivity: 0 },
      anomalies: ["No sensor data available yet."],
      recommendations: ["Install or reconnect hive sensors to begin AI-assisted monitoring."],
      summary: "Insufficient sensor data to generate a health assessment.",
    };
  }

  const temperatureScore = Math.round(scoreAroundIdeal(latest.temperature, 33, 36, 8));
  const humidityScore = Math.round(scoreAroundIdeal(latest.humidity, 50, 65, 20));

  const weights = recent.map((r) => r.weight);
  const weightTrendRaw = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : 0;
  const weightTrendScore = Math.round(clamp(70 + weightTrendRaw * 12));

  const soundActivityScore = Math.round(scoreAroundIdeal(latest.soundLevel, 1200, 2600, 900));
  const recentVibrationCount = recent.filter((r) => r.vibration).length;

  const breakdown = {
    temperature: temperatureScore,
    humidity: humidityScore,
    weightTrend: weightTrendScore,
    soundActivity: soundActivityScore,
  };

  let healthScore = Math.round(
    breakdown.temperature * 0.3 + breakdown.humidity * 0.25 + breakdown.weightTrend * 0.25 + breakdown.soundActivity * 0.2
  );
  if (recentVibrationCount > 0) healthScore = Math.round(clamp(healthScore - recentVibrationCount * 5));

  const anomalies: string[] = [];
  if (latest.humidity > 75) anomalies.push("Potential anomaly detected: humidity sustained above the preferred range.");
  if (latest.temperature > 38 || latest.temperature < 30) anomalies.push("Potential anomaly detected: brood-chamber temperature outside the typical band.");
  if (soundActivityScore < 40) anomalies.push("Potential anomaly detected: microphone sound level lower than expected for this time window.");
  if (weightTrendRaw < -0.5) anomalies.push("Potential anomaly detected: hive weight declining, which can indicate robbing or excessive foraging loss.");
  if (latest.vibration) anomalies.push("Potential anomaly detected: vibration sensor triggered — could indicate disturbance or swarming activity.");

  const riskLevel: AiHealthResult["riskLevel"] = healthScore >= 80 ? "LOW" : healthScore >= 60 ? "MODERATE" : "ELEVATED";

  const recommendations: string[] = [];
  if (anomalies.length === 0) {
    recommendations.push("Continue routine inspections on the current schedule.");
  } else {
    if (latest.humidity > 75) recommendations.push("Improve hive ventilation or relocate to a drier microsite if humidity remains elevated.");
    if (weightTrendRaw < -0.5) recommendations.push("Inspect for signs of robbing, pests, or a failing nectar flow.");
    if (soundActivityScore < 40) recommendations.push("Schedule a manual inspection to confirm queen presence and colony strength.");
    if (latest.vibration) recommendations.push("Check the hive in person — the vibration sensor detected unusual disturbance.");
  }

  const summary =
    anomalies.length === 0
      ? "Hive conditions are currently stable. Weight gain indicates increasing nectar storage. No significant anomalies detected."
      : `AI-assisted monitoring flagged ${anomalies.length} item${anomalies.length > 1 ? "s" : ""} worth a closer look. This is decision support only — please confirm with a manual inspection.`;

  return { healthScore, riskLevel, breakdown, anomalies, recommendations, summary };
}

export function predictYield(hive: Hive, readings: SensorReading[], pastBatches: HoneyBatch[]): YieldPrediction {
  const recent = readings.slice(-48);
  const latest = recent[recent.length - 1] ?? readings[readings.length - 1];
  const earliest = recent[0] ?? readings[0];

  if (!latest || !earliest) {
    return {
      predictedYieldKg: 0,
      expectedHarvestDate: new Date().toISOString(),
      confidence: 0,
      factors: [],
      history: [],
    };
  }

  const weightGainKg = Math.max(0, latest.weight - earliest.weight);
  const hoursElapsed = Math.max(1, (new Date(latest.timestamp).getTime() - new Date(earliest.timestamp).getTime()) / 3.6e6);
  const gainRatePerDay = (weightGainKg / hoursElapsed) * 24;

  const historicalAvgYield =
    pastBatches.length > 0
      ? pastBatches.reduce((sum, b) => sum + b.quantity, 0) / pastBatches.length
      : 16;

  const daysToHarvest = 12;
  const extractableFraction = 0.55; // portion of stored weight that becomes extractable honey
  const projectedWeightGain = gainRatePerDay * daysToHarvest;
  const modelYield = (latest.weight * extractableFraction * 0.3) + projectedWeightGain * 2.1;
  const predictedYieldKg = Math.round(((modelYield * 0.5 + historicalAvgYield * 0.5)) * 10) / 10;

  const expectedHarvestDate = new Date(Date.now() + daysToHarvest * 24 * 3600 * 1000).toISOString();

  const tempStability = stdDev(recent.map((r) => r.temperature));
  const dataCompleteness = clamp((readings.length / 60) * 100);
  const confidence = Math.round(clamp(60 + dataCompleteness * 0.2 - tempStability * 2 + (gainRatePerDay > 0 ? 10 : -5)));

  const factors = [
    { label: "Colony strength", value: clamp(hive.colonyStrength) },
    { label: "Hive weight increase", value: Math.round(clamp(50 + gainRatePerDay * 25)) },
    { label: "Temperature conditions", value: Math.round(scoreAroundIdeal(latest.temperature, 33, 36, 8)) },
    { label: "Humidity conditions", value: Math.round(scoreAroundIdeal(latest.humidity, 50, 65, 20)) },
    { label: "Flowering season", value: 78 },
    { label: "Historical yield", value: Math.round(clamp((historicalAvgYield / 25) * 100)) },
  ];

  const history: YieldPrediction["history"] = [
    ...pastBatches.slice(-4).map((b) => ({ label: new Date(b.harvestDate).toLocaleDateString("en-IN", { month: "short" }), actual: b.quantity })),
    { label: "Now", actual: undefined, predicted: undefined },
    { label: "Next harvest", predicted: predictedYieldKg },
  ];

  return { predictedYieldKg, expectedHarvestDate, confidence, factors, history };
}
