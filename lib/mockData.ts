import { seededRandom, randRange } from "@/lib/prng";
import { computeQuality, evaluateTestResult } from "@/lib/qualityService";
import { createDeterministicRecord } from "@/lib/blockchainService";
import type {
  Alert,
  Beekeeper,
  BlockchainRecord,
  HoneyBatch,
  Hive,
  LabReport,
  LabSample,
  LabTest,
  SensorReading,
  User,
} from "@/types";

const DAY = 24 * 3600 * 1000;
const now = Date.now();
const isoDaysAgo = (days: number) => new Date(now - days * DAY).toISOString();
const round1 = (n: number) => Math.round(n * 10) / 10;
const round0 = (n: number) => Math.round(n);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// ---------------------------------------------------------------------------
// Users & Beekeepers
// ---------------------------------------------------------------------------

export const users: User[] = [
  { id: "usr_arjun", name: "Arjun Kumar", email: "beekeeper@honeychain.demo", role: "BEEKEEPER", createdAt: isoDaysAgo(620) },
  { id: "usr_lakshmi", name: "Lakshmi Devi", email: "lakshmi@honeychain.demo", role: "BEEKEEPER", createdAt: isoDaysAgo(410) },
  { id: "usr_ramesh", name: "Ramesh Iyer", email: "ramesh@honeychain.demo", role: "BEEKEEPER", createdAt: isoDaysAgo(95) },
  { id: "usr_priya", name: "Dr. Priya Sundaram", email: "lab@honeychain.demo", role: "LAB_TECHNICIAN", createdAt: isoDaysAgo(700) },
];

export const beekeepers: Beekeeper[] = [
  {
    id: "bk_arjun",
    userId: "usr_arjun",
    beekeeperCode: "BK-2026-0142",
    name: "Arjun Kumar",
    region: "Coimbatore, Tamil Nadu",
    registrationStatus: "VERIFIED",
    phone: "+91 98••••••42",
    joinedDate: isoDaysAgo(620),
  },
  {
    id: "bk_lakshmi",
    userId: "usr_lakshmi",
    beekeeperCode: "BK-2026-0198",
    name: "Lakshmi Devi",
    region: "Ooty, Tamil Nadu",
    registrationStatus: "VERIFIED",
    phone: "+91 90••••••17",
    joinedDate: isoDaysAgo(410),
  },
  {
    id: "bk_ramesh",
    userId: "usr_ramesh",
    beekeeperCode: "BK-2026-0231",
    name: "Ramesh Iyer",
    region: "Kodaikanal, Tamil Nadu",
    registrationStatus: "PENDING",
    phone: "+91 88••••••65",
    joinedDate: isoDaysAgo(95),
  },
];

export const labIdentity = { laboratoryId: "LAB-TN-042", name: "Tamil Nadu State Apiculture Testing Lab", technicianId: "TCH-001", technicianName: "Dr. Priya Sundaram" };

// ---------------------------------------------------------------------------
// Hives
// ---------------------------------------------------------------------------

type HiveProfile = "healthy" | "hero" | "humidity" | "critical";

interface HiveSeed {
  hiveCode: string;
  beekeeperId: string;
  name: string;
  location: string;
  installedDaysAgo: number;
  queenAge: number;
  colonyStrength: number;
  profile: HiveProfile;
  startWeight: number;
}

const hiveSeeds: HiveSeed[] = [
  { hiveCode: "H-001", beekeeperId: "bk_arjun", name: "Meadow Hive", location: "Coimbatore North Apiary", installedDaysAgo: 540, queenAge: 11, colonyStrength: 82, profile: "healthy", startWeight: 38 },
  { hiveCode: "H-002", beekeeperId: "bk_arjun", name: "Riverside Hive", location: "Coimbatore North Apiary", installedDaysAgo: 480, queenAge: 8, colonyStrength: 78, profile: "healthy", startWeight: 41 },
  { hiveCode: "H-003", beekeeperId: "bk_arjun", name: "Sunrise Hive", location: "Coimbatore North Apiary", installedDaysAgo: 610, queenAge: 6, colonyStrength: 88, profile: "hero", startWeight: 42 },
  { hiveCode: "H-004", beekeeperId: "bk_arjun", name: "Coconut Grove Hive", location: "Coimbatore South Apiary", installedDaysAgo: 300, queenAge: 18, colonyStrength: 65, profile: "humidity", startWeight: 36 },
  { hiveCode: "H-005", beekeeperId: "bk_arjun", name: "Hilltop Hive", location: "Coimbatore South Apiary", installedDaysAgo: 390, queenAge: 9, colonyStrength: 80, profile: "healthy", startWeight: 40 },
  { hiveCode: "H-006", beekeeperId: "bk_lakshmi", name: "Nilgiri Bloom Hive", location: "Ooty Hillside Apiary", installedDaysAgo: 350, queenAge: 7, colonyStrength: 75, profile: "healthy", startWeight: 37 },
  { hiveCode: "H-007", beekeeperId: "bk_lakshmi", name: "Tea Estate Hive", location: "Ooty Hillside Apiary", installedDaysAgo: 260, queenAge: 20, colonyStrength: 60, profile: "humidity", startWeight: 35 },
  { hiveCode: "H-008", beekeeperId: "bk_lakshmi", name: "Cloud Forest Hive", location: "Ooty Hillside Apiary", installedDaysAgo: 420, queenAge: 10, colonyStrength: 83, profile: "healthy", startWeight: 39 },
  { hiveCode: "H-009", beekeeperId: "bk_ramesh", name: "Valley Hive", location: "Kodaikanal Slopes Apiary", installedDaysAgo: 80, queenAge: 4, colonyStrength: 45, profile: "critical", startWeight: 33 },
  { hiveCode: "H-010", beekeeperId: "bk_ramesh", name: "Pine Ridge Hive", location: "Kodaikanal Slopes Apiary", installedDaysAgo: 90, queenAge: 5, colonyStrength: 79, profile: "healthy", startWeight: 38 },
];

function statusForProfile(profile: HiveProfile): Hive["status"] {
  if (profile === "critical") return "CRITICAL";
  if (profile === "humidity") return "ATTENTION";
  return "HEALTHY";
}

export const hives: Hive[] = hiveSeeds.map((seed, idx) => ({
  id: `hv_${seed.hiveCode.toLowerCase()}`,
  hiveCode: seed.hiveCode,
  beekeeperId: seed.beekeeperId,
  name: seed.name,
  location: seed.location,
  installationDate: isoDaysAgo(seed.installedDaysAgo),
  queenAge: seed.queenAge,
  queenStatus: seed.queenAge > 16 ? "AGING" : "ACTIVE",
  colonyStrength: seed.colonyStrength,
  status: statusForProfile(seed.profile),
  lastInspection: isoDaysAgo(2 + (idx % 4)),
  nextInspection: new Date(now + (3 + (idx % 5)) * DAY).toISOString(),
}));

// ---------------------------------------------------------------------------
// Sensor readings — deterministic 30-day time series per hive
// ---------------------------------------------------------------------------

const INTERVAL_HOURS = 2;
const TOTAL_POINTS = 360; // 30 days at 2h resolution

function generateReadings(hive: Hive, seed: HiveSeed): SensorReading[] {
  const rand = seededRandom(seed.hiveCode);
  const readings: SensorReading[] = [];
  let weight = seed.startWeight;

  const dailyGain = seed.profile === "critical" ? -0.015 : seed.profile === "humidity" ? 0.012 : seed.profile === "hero" ? 0.05 : 0.03;

  for (let i = TOTAL_POINTS - 1; i >= 0; i--) {
    const t = now - i * INTERVAL_HOURS * 3600 * 1000;
    const hourOfDay = new Date(t).getHours();
    const dayCycle = Math.sin((hourOfDay / 24) * Math.PI * 2 - Math.PI / 2);

    const temperature = 34.3 + dayCycle * 1.1 + randRange(rand, -0.35, 0.35);
    let humidity = 58 + -dayCycle * 4 + randRange(rand, -2, 2);
    const externalTemperature = 26 + dayCycle * 6.5 + randRange(rand, -1, 1);
    let activityScore = 58 + dayCycle * 26 + randRange(rand, -5, 5);
    const sound = clamp(38 + dayCycle * 16 + randRange(rand, -3, 3), 0, 100);
    const battery = clamp(100 - ((TOTAL_POINTS - i) / TOTAL_POINTS) * 22 + randRange(rand, -1, 1), 0, 100);

    weight += (dailyGain * INTERVAL_HOURS) / 24 + randRange(rand, -0.04, 0.04);

    if (seed.profile === "humidity") humidity += 20;
    if (seed.profile === "critical" && i < 12) {
      activityScore = activityScore * 0.35 + randRange(rand, -8, 8);
    }

    readings.push({
      id: `sr_${seed.hiveCode}_${i}`,
      hiveId: hive.id,
      temperature: round1(temperature),
      externalTemperature: round1(externalTemperature),
      humidity: round1(clamp(humidity, 28, 96)),
      weight: round1(weight),
      activityScore: round0(clamp(activityScore, 0, 100)),
      activity: activityScore > 70 ? "HIGH" : activityScore > 40 ? "MODERATE" : "LOW",
      sound: round1(sound),
      battery: round0(battery),
      timestamp: new Date(t).toISOString(),
    });
  }

  // Hero hive: pin the latest reading to the flagship demo figures used
  // throughout the walkthrough (temperature 34.2C, humidity 62%, weight
  // 48.6kg, high activity).
  if (seed.profile === "hero") {
    const last = readings[readings.length - 1];
    last.temperature = 34.2;
    last.humidity = 62;
    last.weight = 48.6;
    last.activityScore = 84;
    last.activity = "HIGH";
    last.battery = 91;
  }

  return readings;
}

export const sensorReadingsByHive: Record<string, SensorReading[]> = {};
hives.forEach((hive, idx) => {
  sensorReadingsByHive[hive.id] = generateReadings(hive, hiveSeeds[idx]);
});

export const allSensorReadings: SensorReading[] = Object.values(sensorReadingsByHive).flat();

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export const alerts: Alert[] = [
  {
    id: "al_001",
    hiveId: "hv_h-007",
    severity: "WARNING",
    title: "Elevated humidity",
    message: "Humidity has remained above the preferred range for the past 4 hours.",
    recommendation: "Check hive ventilation and consider relocating to a drier microsite.",
    timestamp: isoDaysAgo(0.1),
    dismissed: false,
  },
  {
    id: "al_002",
    hiveId: "hv_h-009",
    severity: "CRITICAL",
    title: "Unusual activity pattern detected",
    message: "Bee activity dropped sharply and irregularly over the last 24 hours. This is decision support only — please confirm with a manual inspection.",
    recommendation: "Schedule an in-person inspection within 24 hours to confirm queen presence and colony strength.",
    timestamp: isoDaysAgo(0.3),
    dismissed: false,
  },
  {
    id: "al_003",
    hiveId: "hv_h-003",
    severity: "INFO",
    title: "Honey storage weight increasing normally",
    message: "Hive weight has increased steadily over the past week, consistent with an active nectar flow.",
    recommendation: "No action needed. Continue routine monitoring.",
    timestamp: isoDaysAgo(0.5),
    dismissed: false,
  },
  {
    id: "al_004",
    hiveId: "hv_h-004",
    severity: "WARNING",
    title: "Elevated humidity",
    message: "Humidity has been trending above the ideal band for this hive over the last 6 hours.",
    recommendation: "Verify hive ventilation and drainage after recent rainfall.",
    timestamp: isoDaysAgo(1.2),
    dismissed: false,
  },
  {
    id: "al_005",
    hiveId: "hv_h-009",
    severity: "WARNING",
    title: "Sensor battery low",
    message: "Hive sensor battery has dropped below 20% and may stop reporting soon.",
    recommendation: "Replace or recharge the hive sensor at the next visit.",
    timestamp: isoDaysAgo(1.8),
    dismissed: false,
  },
];

// ---------------------------------------------------------------------------
// Honey batches
// ---------------------------------------------------------------------------

export const batches: HoneyBatch[] = [
  {
    id: "hb_00975", batchCode: "HC-2026-00975", hiveId: "hv_h-001", beekeeperId: "bk_arjun",
    harvestDate: isoDaysAgo(20), quantity: 22.0, honeyType: "Multifloral Honey", floralSource: "Mixed wildflower",
    extractionMethod: "Cold Extraction", storageTemperature: 24, storageLocation: "Coimbatore Central Store",
    moisture: 18.2, ph: 3.9, status: "BLOCKCHAIN_REGISTERED",
    envSnapshot: { temperature: 33.8, humidity: 59, hiveWeight: 41.2, aiHealthScore: 85 },
    createdAt: isoDaysAgo(19.9),
  },
  {
    id: "hb_00978", batchCode: "HC-2026-00978", hiveId: "hv_h-002", beekeeperId: "bk_arjun",
    harvestDate: isoDaysAgo(15), quantity: 19.5, honeyType: "Eucalyptus Honey", floralSource: "Eucalyptus blossom",
    extractionMethod: "Cold Extraction", storageTemperature: 23, storageLocation: "Coimbatore Central Store",
    moisture: 16.9, ph: 4.0, status: "BLOCKCHAIN_REGISTERED",
    envSnapshot: { temperature: 34.1, humidity: 57, hiveWeight: 44.8, aiHealthScore: 90 },
    createdAt: isoDaysAgo(14.9),
  },
  {
    id: "hb_00982", batchCode: "HC-2026-00982", hiveId: "hv_h-003", beekeeperId: "bk_arjun",
    harvestDate: isoDaysAgo(3), quantity: 24.5, honeyType: "Wildflower Honey", floralSource: "Coffee blossom & wildflower",
    extractionMethod: "Cold Extraction (Unheated)", storageTemperature: 22, storageLocation: "Coimbatore Central Store",
    moisture: 17.8, ph: 4.1, status: "BLOCKCHAIN_REGISTERED",
    envSnapshot: { temperature: 34.2, humidity: 62, hiveWeight: 48.6, aiHealthScore: 87 },
    createdAt: isoDaysAgo(2.9),
  },
  {
    id: "hb_00985", batchCode: "HC-2026-00985", hiveId: "hv_h-004", beekeeperId: "bk_arjun",
    harvestDate: isoDaysAgo(5), quantity: 15.2, honeyType: "Forest Honey", floralSource: "Mixed forest flora",
    extractionMethod: "Cold Extraction", storageTemperature: 25, storageLocation: "Coimbatore Central Store",
    status: "IN_TESTING",
    envSnapshot: { temperature: 33.0, humidity: 74, hiveWeight: 37.9, aiHealthScore: 63 },
    createdAt: isoDaysAgo(4.9),
  },
  {
    id: "hb_00990", batchCode: "HC-2026-00990", hiveId: "hv_h-005", beekeeperId: "bk_arjun",
    harvestDate: isoDaysAgo(2), quantity: 20.0, honeyType: "Multifloral Honey", floralSource: "Mixed wildflower",
    extractionMethod: "Cold Extraction", storageTemperature: 23, storageLocation: "Coimbatore Central Store",
    status: "AWAITING_LAB",
    envSnapshot: { temperature: 34.0, humidity: 60, hiveWeight: 42.5, aiHealthScore: 84 },
    createdAt: isoDaysAgo(1.9),
  },
  {
    id: "hb_00993", batchCode: "HC-2026-00993", hiveId: "hv_h-006", beekeeperId: "bk_lakshmi",
    harvestDate: isoDaysAgo(1), quantity: 17.8, honeyType: "Nilgiri Honey", floralSource: "Nilgiri hill flora",
    extractionMethod: "Cold Extraction", storageTemperature: 22, storageLocation: "Ooty Collection Center",
    status: "DRAFT",
    envSnapshot: { temperature: 32.6, humidity: 55, hiveWeight: 40.1, aiHealthScore: 88 },
    createdAt: isoDaysAgo(0.9),
  },
  {
    id: "hb_00996", batchCode: "HC-2026-00996", hiveId: "hv_h-007", beekeeperId: "bk_lakshmi",
    harvestDate: isoDaysAgo(8), quantity: 14.0, honeyType: "Nilgiri Honey", floralSource: "Nilgiri hill flora",
    extractionMethod: "Hot Extraction", storageTemperature: 27, storageLocation: "Ooty Collection Center",
    moisture: 22.4, ph: 4.6, status: "LAB_FAILED",
    envSnapshot: { temperature: 33.5, humidity: 78, hiveWeight: 36.4, aiHealthScore: 58 },
    createdAt: isoDaysAgo(7.9),
  },
  {
    id: "hb_00999", batchCode: "HC-2026-00999", hiveId: "hv_h-008", beekeeperId: "bk_lakshmi",
    harvestDate: isoDaysAgo(12), quantity: 21.3, honeyType: "Eucalyptus Honey", floralSource: "Eucalyptus blossom",
    extractionMethod: "Cold Extraction", storageTemperature: 23, storageLocation: "Ooty Collection Center",
    moisture: 19.5, ph: 3.8, status: "BLOCKCHAIN_REGISTERED",
    envSnapshot: { temperature: 34.4, humidity: 58, hiveWeight: 45.0, aiHealthScore: 81 },
    createdAt: isoDaysAgo(11.9),
  },
];

// ---------------------------------------------------------------------------
// Lab tests helper templates
// ---------------------------------------------------------------------------

interface TestTemplate {
  category: LabTest["category"];
  testName: string;
  unit: string;
  expectedRange: string;
}

export const testTemplates: TestTemplate[] = [
  { category: "PHYSICAL", testName: "Moisture", unit: "%", expectedRange: "15-20" },
  { category: "PHYSICAL", testName: "Color", unit: "", expectedRange: "Extra Light Amber - Dark Amber" },
  { category: "PHYSICAL", testName: "Aroma", unit: "", expectedRange: "Characteristic floral aroma" },
  { category: "PHYSICAL", testName: "Texture", unit: "", expectedRange: "Smooth & viscous" },
  { category: "PHYSICAL", testName: "Specific Gravity", unit: "", expectedRange: "1.38-1.45" },
  { category: "CHEMICAL", testName: "pH", unit: "", expectedRange: "3.5-4.5" },
  { category: "CHEMICAL", testName: "Electrical Conductivity", unit: "mS/cm", expectedRange: "0.2-0.8" },
  { category: "CHEMICAL", testName: "HMF (Hydroxymethylfurfural)", unit: "mg/kg", expectedRange: "<=40" },
  { category: "CHEMICAL", testName: "Reducing Sugars", unit: "%", expectedRange: ">=65" },
  { category: "CHEMICAL", testName: "Sucrose", unit: "%", expectedRange: "<=5" },
  { category: "CHEMICAL", testName: "Free Acidity", unit: "meq/kg", expectedRange: "<=50" },
  { category: "ADULTERATION", testName: "Sugar Syrup Screening", unit: "", expectedRange: "Negative" },
  { category: "ADULTERATION", testName: "Water Addition Screening", unit: "", expectedRange: "Negative" },
  { category: "ADULTERATION", testName: "Artificial Sweetener Screening", unit: "", expectedRange: "Negative" },
  { category: "ADULTERATION", testName: "Other Adulteration Indicators", unit: "", expectedRange: "Negative" },
  { category: "MICROBIOLOGICAL", testName: "Yeast Count", unit: "CFU/g", expectedRange: "<=10" },
  { category: "MICROBIOLOGICAL", testName: "Mold Count", unit: "CFU/g", expectedRange: "<=10" },
  { category: "MICROBIOLOGICAL", testName: "Total Microbial Count", unit: "CFU/g", expectedRange: "<=100" },
];

function buildTest(sampleId: string, idx: number, template: TestTemplate, measuredValue: number | string, remarks = ""): LabTest {
  const partial = { measuredValue, expectedRange: template.expectedRange, category: template.category };
  const result = evaluateTestResult(partial);
  return {
    id: `${sampleId}_t${idx}`,
    sampleId,
    category: template.category,
    testName: template.testName,
    measuredValue,
    unit: template.unit,
    expectedRange: template.expectedRange,
    result,
    remarks,
  };
}

function buildCleanPassTestSet(sampleId: string, moisture: number, ph: number): LabTest[] {
  const values: (number | string)[] = [
    moisture, "Amber", "Characteristic floral aroma", "Smooth & viscous", 1.41,
    ph, 0.45, 18, 68, 3.2, 28,
    "Negative", "Negative", "Negative", "Negative",
    4, 2, 45,
  ];
  return testTemplates.map((t, i) => buildTest(sampleId, i, t, values[i]));
}

export const labSamples: LabSample[] = [
  { id: "ls_00975", batchId: "hb_00975", laboratoryId: labIdentity.laboratoryId, receivedAt: isoDaysAgo(19), status: "COMPLETED", priority: "NORMAL" },
  { id: "ls_00978", batchId: "hb_00978", laboratoryId: labIdentity.laboratoryId, receivedAt: isoDaysAgo(14), status: "COMPLETED", priority: "NORMAL" },
  { id: "ls_00982", batchId: "hb_00982", laboratoryId: labIdentity.laboratoryId, receivedAt: isoDaysAgo(2.5), status: "COMPLETED", priority: "HIGH" },
  { id: "ls_00985", batchId: "hb_00985", laboratoryId: labIdentity.laboratoryId, receivedAt: isoDaysAgo(4), status: "TESTING_IN_PROGRESS", priority: "NORMAL" },
  { id: "ls_00990", batchId: "hb_00990", laboratoryId: labIdentity.laboratoryId, receivedAt: isoDaysAgo(1.5), status: "PENDING", priority: "HIGH" },
  { id: "ls_00996", batchId: "hb_00996", laboratoryId: labIdentity.laboratoryId, receivedAt: isoDaysAgo(7), status: "COMPLETED", priority: "NORMAL" },
  { id: "ls_00999", batchId: "hb_00999", laboratoryId: labIdentity.laboratoryId, receivedAt: isoDaysAgo(11), status: "COMPLETED", priority: "NORMAL" },
];

export const labTests: LabTest[] = [];

// Sample 00975 — clean pass, one minor physical remark (still A-range)
labTests.push(...buildCleanPassTestSet("ls_00975", 18.2, 3.9));
const t975Texture = labTests.find((t) => t.sampleId === "ls_00975" && t.testName === "Texture")!;
t975Texture.measuredValue = "Slightly grainy — early crystallization";
t975Texture.result = "FAIL";
t975Texture.remarks = "Natural crystallization noted; does not indicate adulteration.";

// Sample 00978 — clean pass
labTests.push(...buildCleanPassTestSet("ls_00978", 16.9, 4.0));

// Sample 00982 — hero batch, clean pass
labTests.push(...buildCleanPassTestSet("ls_00982", 17.8, 4.1));

// Sample 00985 — testing in progress: only physical tests recorded so far
const physicalOnly = testTemplates
  .map((t, i) => ({ t, i }))
  .filter(({ t }) => t.category === "PHYSICAL");
const partialValues: (number | string)[] = [19.6, "Amber", "Characteristic floral aroma", "Smooth & viscous", 1.4];
physicalOnly.forEach(({ t, i }, idx) => {
  labTests.push(buildTest("ls_00985", i, t, partialValues[idx]));
});

// Sample 00990 — pending, no tests entered yet (technician fills this live)

// Sample 00996 — adulteration detected -> fails
const failValues: (number | string)[] = [
  22.4, "Dark Amber", "Faint, atypical aroma", "Thin & runny", 1.33,
  4.6, 1.1, 12, 58, 9.4, 22,
  "Positive", "Positive", "Negative", "Negative",
  6, 3, 40,
];
testTemplates.forEach((t, i) => {
  labTests.push(buildTest("ls_00996", i, t, failValues[i], t.testName.includes("Screening") && failValues[i] === "Positive" ? "Adulteration indicators detected in sample." : ""));
});

// Sample 00999 — mostly clean with a couple of moderate deviations
const mixedValues: (number | string)[] = [
  19.5, "Amber", "Characteristic floral aroma", "Smooth & viscous", 1.43,
  3.8, 0.52, 30, 66, 4.1, 33,
  "Negative", "Negative", "Negative", "Negative",
  5, 4, 60,
];
testTemplates.forEach((t, i) => {
  labTests.push(buildTest("ls_00999", i, t, mixedValues[i]));
});

// ---------------------------------------------------------------------------
// Lab reports
// ---------------------------------------------------------------------------

function buildReport(sampleId: string, batchId: string, createdAtIso: string): LabReport {
  const tests = labTests.filter((t) => t.sampleId === sampleId);
  const computed = computeQuality(tests);
  return {
    id: `lr_${sampleId}`,
    sampleId,
    batchId,
    technicianId: labIdentity.technicianId,
    qualityScore: computed.qualityScore,
    qualityGrade: computed.qualityGrade,
    overallResult: computed.overallResult,
    breakdown: computed.breakdown,
    remarks:
      computed.overallResult === "PASSED"
        ? "Sample meets HoneyChain demo quality thresholds across physical, chemical, and microbiological parameters."
        : "Sample failed adulteration screening. Batch withheld from blockchain registration pending investigation.",
    createdAt: createdAtIso,
    digitallySigned: true,
  };
}

export const labReports: LabReport[] = [
  buildReport("ls_00975", "hb_00975", isoDaysAgo(18.8)),
  buildReport("ls_00978", "hb_00978", isoDaysAgo(13.8)),
  buildReport("ls_00982", "hb_00982", isoDaysAgo(2.2)),
  buildReport("ls_00996", "hb_00996", isoDaysAgo(6.7)),
  buildReport("ls_00999", "hb_00999", isoDaysAgo(10.7)),
];

// ---------------------------------------------------------------------------
// Blockchain records
// ---------------------------------------------------------------------------

export const blockchainRecords: BlockchainRecord[] = [
  createDeterministicRecord("hb_00975", { batchId: "hb_00975", report: "lr_ls_00975" }, "LAB_REPORT", isoDaysAgo(18.7), "seed-975"),
  createDeterministicRecord("hb_00978", { batchId: "hb_00978", report: "lr_ls_00978" }, "LAB_REPORT", isoDaysAgo(13.7), "seed-978"),
  createDeterministicRecord("hb_00982", { batchId: "hb_00982", report: "lr_ls_00982" }, "LAB_REPORT", isoDaysAgo(2.1), "seed-982"),
  createDeterministicRecord("hb_00999", { batchId: "hb_00999", report: "lr_ls_00999" }, "LAB_REPORT", isoDaysAgo(10.6), "seed-999"),
];
