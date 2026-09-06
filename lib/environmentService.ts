import { seededRandom, randRange } from "@/lib/prng";

// Deterministic demo environmental context per hive location. In a
// production build this would call a weather/agronomy API keyed by the
// hive's GPS coordinates.
export function getEnvironmentSnapshot(hiveCode: string, location: string) {
  const rand = seededRandom(`env:${hiveCode}:${location}`);
  const floweringCrops = [
    ["Coffee blossom", "Wildflower meadow", "Coconut palm"],
    ["Eucalyptus", "Tea shrub", "Wild rhododendron"],
    ["Mixed forest flora", "Jackfruit blossom", "Wild berries"],
  ][Math.floor(rand() * 3)];

  return {
    temperature: Math.round(randRange(rand, 24, 31) * 10) / 10,
    humidity: Math.round(randRange(rand, 45, 70)),
    rainfall: Math.round(randRange(rand, 0, 12) * 10) / 10,
    windSpeed: Math.round(randRange(rand, 3, 14) * 10) / 10,
    airQualityIndex: Math.round(randRange(rand, 25, 70)),
    floweringCondition: rand() > 0.3 ? "Active bloom" : "Moderate bloom",
    nearbyFloweringCrops: floweringCrops,
  };
}
