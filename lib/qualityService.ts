import type { LabReport, LabTest, QualityGrade } from "@/types";

// Parses expected-range strings like "3.5-4.5", "<=20", ">=70", "Negative"
function parseRange(range: string): { min?: number; max?: number } {
  const cleaned = range.trim();
  if (/^negative$/i.test(cleaned) || /^absent$/i.test(cleaned)) return {};
  const between = cleaned.match(/^(-?\d+(\.\d+)?)\s*-\s*(-?\d+(\.\d+)?)/);
  if (between) return { min: Number(between[1]), max: Number(between[3]) };
  const max = cleaned.match(/^(<=|≤|<)\s*(-?\d+(\.\d+)?)/);
  if (max) return { max: Number(max[2]) };
  const min = cleaned.match(/^(>=|≥|>)\s*(-?\d+(\.\d+)?)/);
  if (min) return { min: Number(min[2]) };
  return {};
}

function isScreeningRange(expectedRange: string) {
  return /^negative$/i.test(expectedRange.trim());
}

// Scores a single test 0-100 based on how the measured value sits inside
// its expected range. Non-numeric (qualitative) tests pass at a fixed
// high score unless explicitly marked FAIL by the technician.
export function scoreTest(test: Pick<LabTest, "measuredValue" | "expectedRange" | "result" | "category">): number {
  if (isScreeningRange(test.expectedRange)) {
    return String(test.measuredValue).toLowerCase() === "negative" ? 100 : 10;
  }
  if (typeof test.measuredValue === "string" && Number.isNaN(Number(test.measuredValue))) {
    return test.result === "PASS" ? 96 : 35;
  }
  const value = Number(test.measuredValue);
  const { min, max } = parseRange(test.expectedRange);
  if (min === undefined && max === undefined) {
    return test.result === "PASS" ? 96 : 30;
  }
  if (min !== undefined && value < min) {
    const deviation = ((min - value) / (min || 1)) * 100;
    return Math.max(20, 100 - deviation * 2);
  }
  if (max !== undefined && value > max) {
    const deviation = ((value - max) / (max || 1)) * 100;
    return Math.max(15, 100 - deviation * 2);
  }
  return 100;
}

export function evaluateTestResult(test: Pick<LabTest, "measuredValue" | "expectedRange">): TestPassFail {
  if (isScreeningRange(test.expectedRange)) {
    return String(test.measuredValue).toLowerCase() === "negative" ? "PASS" : "FAIL";
  }
  const value = typeof test.measuredValue === "string" ? Number(test.measuredValue) : test.measuredValue;
  if (Number.isNaN(value)) return "PASS";
  const { min, max } = parseRange(test.expectedRange);
  if (min !== undefined && value < min) return "FAIL";
  if (max !== undefined && value > max) return "FAIL";
  return "PASS";
}

type TestPassFail = "PASS" | "FAIL";

export interface QualityBreakdown {
  purity: number;
  chemicalQuality: number;
  physicalQuality: number;
  microbiologicalSafety: number;
}

export interface QualityComputation {
  qualityScore: number;
  qualityGrade: QualityGrade;
  overallResult: LabReport["overallResult"];
  breakdown: QualityBreakdown;
}

function avgScore(tests: LabTest[]) {
  if (tests.length === 0) return 100;
  return tests.reduce((sum, t) => sum + scoreTest(t), 0) / tests.length;
}

export function computeQuality(tests: LabTest[]): QualityComputation {
  const physical = tests.filter((t) => t.category === "PHYSICAL");
  const chemical = tests.filter((t) => t.category === "CHEMICAL");
  const adulteration = tests.filter((t) => t.category === "ADULTERATION");
  const microbiological = tests.filter((t) => t.category === "MICROBIOLOGICAL");

  const breakdown: QualityBreakdown = {
    purity: Math.round(avgScore(adulteration)),
    chemicalQuality: Math.round(avgScore(chemical)),
    physicalQuality: Math.round(avgScore(physical)),
    microbiologicalSafety: Math.round(avgScore(microbiological)),
  };

  const qualityScore = Math.round(
    breakdown.purity * 0.3 +
      breakdown.chemicalQuality * 0.25 +
      breakdown.physicalQuality * 0.25 +
      breakdown.microbiologicalSafety * 0.2
  );

  const anyAdulterationFail = adulteration.some((t) => t.result === "FAIL");
  const anyMicroFail = microbiological.some((t) => t.result === "FAIL");
  const overallResult: LabReport["overallResult"] =
    qualityScore >= 75 && !anyAdulterationFail && !anyMicroFail ? "PASSED" : "FAILED";

  let qualityGrade: QualityGrade;
  if (overallResult === "FAILED") qualityGrade = "REJECTED";
  else if (qualityScore >= 95) qualityGrade = "A+";
  else if (qualityScore >= 88) qualityGrade = "A";
  else if (qualityScore >= 75) qualityGrade = "B";
  else qualityGrade = "C";

  return { qualityScore, qualityGrade, overallResult, breakdown };
}
