// In-memory "database" service layer.
//
// This mirrors the Prisma schema (prisma/schema.prisma) and types
// (types/index.ts) closely enough that the exported functions below could
// be reimplemented against a real Postgres + Prisma client without
// changing any caller (API routes, server components). State lives for
// the lifetime of the server process, which is sufficient for demo mode.

import "server-only";
import {
  alerts as seedAlerts,
  batches as seedBatches,
  beekeepers,
  blockchainRecords as seedBlockchainRecords,
  hives,
  labIdentity,
  labReports as seedLabReports,
  labSamples as seedLabSamples,
  labTests as seedLabTests,
  sensorReadingsByHive,
  testTemplates,
  users,
} from "@/lib/mockData";
import { computeHiveHealth, predictYield } from "@/lib/aiHealthService";
import { computeQuality, evaluateTestResult } from "@/lib/qualityService";
import { blockchainService } from "@/lib/blockchainService";
import type {
  Alert,
  Beekeeper,
  BlockchainRecord,
  Hive,
  HoneyBatch,
  LabReport,
  LabSample,
  LabTest,
  SensorReading,
  User,
} from "@/types";

// ---------------------------------------------------------------------------
// Mutable in-memory state
//
// Pinned to `globalThis` (the same pattern used for Prisma client
// singletons in Next.js dev) so the store survives Turbopack's per-route
// lazy compilation, which can otherwise give route handlers and page
// renders separate module instances of this file within the same dev
// server process.
// ---------------------------------------------------------------------------

interface MockState {
  users: User[];
  beekeepers: Beekeeper[];
  hives: Hive[];
  alerts: Alert[];
  batches: HoneyBatch[];
  labSamples: LabSample[];
  labTests: LabTest[];
  labReports: LabReport[];
  blockchainRecords: BlockchainRecord[];
  batchCounter: number;
  sampleCounter: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __honeychainState: MockState | undefined;
}

function createInitialState(): MockState {
  return {
    users: [...users],
    beekeepers: [...beekeepers],
    hives: [...hives],
    alerts: [...seedAlerts],
    batches: [...seedBatches],
    labSamples: [...seedLabSamples],
    labTests: [...seedLabTests],
    labReports: [...seedLabReports],
    blockchainRecords: [...seedBlockchainRecords],
    batchCounter: 1000,
    sampleCounter: 1000,
  };
}

const state: MockState = globalThis.__honeychainState ?? createInitialState();
globalThis.__honeychainState = state;

export const DEFAULT_BEEKEEPER_ID = "bk_arjun";

// ---------------------------------------------------------------------------
// Users / beekeepers
// ---------------------------------------------------------------------------

export function getUsers(): User[] {
  return state.users;
}

export function getAllBeekeepers(): Beekeeper[] {
  return state.beekeepers;
}

export function getBeekeeperById(id: string): Beekeeper | undefined {
  return state.beekeepers.find((b) => b.id === id);
}

export const labProfile = labIdentity;

// ---------------------------------------------------------------------------
// Hives
// ---------------------------------------------------------------------------

export function getHivesByBeekeeper(beekeeperId: string): Hive[] {
  return state.hives.filter((h) => h.beekeeperId === beekeeperId);
}

export function getAllHives(): Hive[] {
  return state.hives;
}

export function getHiveById(id: string): Hive | undefined {
  return state.hives.find((h) => h.id === id);
}

export function getSensorReadings(hiveId: string, hoursBack?: number): SensorReading[] {
  const all = sensorReadingsByHive[hiveId] ?? [];
  if (!hoursBack) return all;
  const cutoff = Date.now() - hoursBack * 3600 * 1000;
  return all.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
}

export function getLatestSensorReading(hiveId: string): SensorReading | undefined {
  const all = sensorReadingsByHive[hiveId] ?? [];
  return all[all.length - 1];
}

export function getHiveHealth(hiveId: string) {
  const hive = getHiveById(hiveId);
  if (!hive) return undefined;
  return computeHiveHealth(hive, getSensorReadings(hiveId));
}

export function getHiveYieldPrediction(hiveId: string) {
  const hive = getHiveById(hiveId);
  if (!hive) return undefined;
  const pastBatches = state.batches.filter((b) => b.hiveId === hiveId);
  return predictYield(hive, getSensorReadings(hiveId), pastBatches);
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export function getAlertsForBeekeeper(beekeeperId: string): Alert[] {
  const hiveIds = new Set(getHivesByBeekeeper(beekeeperId).map((h) => h.id));
  return state.alerts
    .filter((a) => hiveIds.has(a.hiveId) && !a.dismissed)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function dismissAlert(alertId: string): boolean {
  const alert = state.alerts.find((a) => a.id === alertId);
  if (!alert) return false;
  alert.dismissed = true;
  return true;
}

// ---------------------------------------------------------------------------
// Honey batches
// ---------------------------------------------------------------------------

export function getBatchesByBeekeeper(beekeeperId: string): HoneyBatch[] {
  return state.batches
    .filter((b) => b.beekeeperId === beekeeperId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllBatches(): HoneyBatch[] {
  return state.batches;
}

export function getBatchById(id: string): HoneyBatch | undefined {
  return state.batches.find((b) => b.id === id);
}

export function getBatchByCode(code: string): HoneyBatch | undefined {
  return state.batches.find((b) => b.batchCode.toLowerCase() === code.toLowerCase());
}

export interface CreateBatchInput {
  hiveId: string;
  beekeeperId: string;
  harvestDate: string;
  quantity: number;
  honeyType: string;
  floralSource: string;
  extractionMethod: string;
  storageTemperature: number;
  storageLocation: string;
}

export function createBatch(input: CreateBatchInput): HoneyBatch {
  state.batchCounter += 1;
  const batchCounter = state.batchCounter;
  const hive = getHiveById(input.hiveId);
  const latest = hive ? getLatestSensorReading(hive.id) : undefined;
  const health = hive ? computeHiveHealth(hive, getSensorReadings(hive.id)) : undefined;

  const batch: HoneyBatch = {
    id: `hb_${Date.now()}_${batchCounter}`,
    batchCode: `HC-2026-${batchCounter}`,
    hiveId: input.hiveId,
    beekeeperId: input.beekeeperId,
    harvestDate: input.harvestDate,
    quantity: input.quantity,
    honeyType: input.honeyType,
    floralSource: input.floralSource,
    extractionMethod: input.extractionMethod,
    storageTemperature: input.storageTemperature,
    storageLocation: input.storageLocation,
    status: "DRAFT",
    envSnapshot: {
      temperature: latest?.temperature ?? 34,
      humidity: latest?.humidity ?? 60,
      hiveWeight: latest?.weight ?? 40,
      aiHealthScore: health?.healthScore ?? 80,
    },
    createdAt: new Date().toISOString(),
  };
  state.batches.unshift(batch);
  return batch;
}

export function sendBatchToLab(batchId: string): { batch: HoneyBatch; sample: LabSample } | undefined {
  const batch = getBatchById(batchId);
  if (!batch) return undefined;
  batch.status = "AWAITING_LAB";

  state.sampleCounter += 1;
  const sample: LabSample = {
    id: `ls_${Date.now()}_${state.sampleCounter}`,
    batchId: batch.id,
    laboratoryId: labIdentity.laboratoryId,
    receivedAt: new Date().toISOString(),
    status: "PENDING",
    priority: "NORMAL",
  };
  state.labSamples.unshift(sample);
  return { batch, sample };
}

// ---------------------------------------------------------------------------
// Laboratory
// ---------------------------------------------------------------------------

export function getLabSamples(): LabSample[] {
  return state.labSamples.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

export interface EnrichedLabSample extends LabSample {
  batchCode: string;
  honeyType: string;
  quantity: number;
  hiveCode: string;
  beekeeperCode: string;
}

export function getEnrichedLabSamples(): EnrichedLabSample[] {
  return getLabSamples().map((sample) => {
    const batch = getBatchById(sample.batchId);
    const hive = batch ? getHiveById(batch.hiveId) : undefined;
    const beekeeper = batch ? getBeekeeperById(batch.beekeeperId) : undefined;
    return {
      ...sample,
      batchCode: batch?.batchCode ?? "—",
      honeyType: batch?.honeyType ?? "—",
      quantity: batch?.quantity ?? 0,
      hiveCode: hive?.hiveCode ?? "—",
      beekeeperCode: beekeeper?.beekeeperCode ?? "—",
    };
  });
}

export function getLabSampleById(id: string): LabSample | undefined {
  return state.labSamples.find((s) => s.id === id);
}

export function getLabSampleByBatchId(batchId: string): LabSample | undefined {
  return state.labSamples.find((s) => s.batchId === batchId);
}

export function getLabTestsBySample(sampleId: string): LabTest[] {
  return state.labTests.filter((t) => t.sampleId === sampleId);
}

export function getTestTemplates() {
  return testTemplates;
}

export interface SubmittedTestInput {
  category: LabTest["category"];
  testName: string;
  unit: string;
  expectedRange: string;
  measuredValue: number | string;
  remarks?: string;
}

export function submitLabTests(sampleId: string, tests: SubmittedTestInput[]): LabTest[] {
  const sample = getLabSampleById(sampleId);
  if (!sample) throw new Error("Sample not found");

  // Replace any existing tests for this sample with the submitted set.
  state.labTests = state.labTests.filter((t) => t.sampleId !== sampleId);

  const saved: LabTest[] = tests.map((t, idx) => {
    const result = evaluateTestResult({ measuredValue: t.measuredValue, expectedRange: t.expectedRange });
    return {
      id: `${sampleId}_t${idx}_${Date.now()}`,
      sampleId,
      category: t.category,
      testName: t.testName,
      measuredValue: t.measuredValue,
      unit: t.unit,
      expectedRange: t.expectedRange,
      result,
      remarks: t.remarks ?? "",
    };
  });

  state.labTests.push(...saved);
  sample.status = "TESTING_IN_PROGRESS";
  return saved;
}

export function getAllLabReports(): LabReport[] {
  return [...state.labReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getLabReportBySample(sampleId: string): LabReport | undefined {
  return state.labReports.find((r) => r.sampleId === sampleId);
}

export function getLabReportByBatch(batchId: string): LabReport | undefined {
  return state.labReports.find((r) => r.batchId === batchId);
}

export function approveLabReport(sampleId: string, technicianId: string): LabReport | undefined {
  const sample = getLabSampleById(sampleId);
  if (!sample) return undefined;
  const tests = getLabTestsBySample(sampleId);
  if (tests.length === 0) return undefined;

  const computed = computeQuality(tests);
  const report: LabReport = {
    id: `lr_${sampleId}_${Date.now()}`,
    sampleId,
    batchId: sample.batchId,
    technicianId,
    qualityScore: computed.qualityScore,
    qualityGrade: computed.qualityGrade,
    overallResult: computed.overallResult,
    breakdown: computed.breakdown,
    remarks:
      computed.overallResult === "PASSED"
        ? "Sample meets HoneyChain demo quality thresholds across physical, chemical, and microbiological parameters."
        : "Sample failed one or more critical screening tests. Batch withheld from blockchain registration.",
    createdAt: new Date().toISOString(),
    digitallySigned: true,
  };

  state.labReports = state.labReports.filter((r) => r.sampleId !== sampleId);
  state.labReports.push(report);
  sample.status = "COMPLETED";

  const batch = getBatchById(sample.batchId);
  if (batch) {
    batch.status = computed.overallResult === "PASSED" ? "LAB_PASSED" : "LAB_FAILED";
  }

  return report;
}

// ---------------------------------------------------------------------------
// Blockchain
// ---------------------------------------------------------------------------

export async function registerBatchOnBlockchain(batchId: string): Promise<BlockchainRecord | undefined> {
  const batch = getBatchById(batchId);
  const report = getLabReportByBatch(batchId);
  if (!batch || !report || report.overallResult !== "PASSED") return undefined;

  const record = await blockchainService.registerLabReport(batchId, {
    batchCode: batch.batchCode,
    qualityScore: report.qualityScore,
    qualityGrade: report.qualityGrade,
    reportId: report.id,
  });
  state.blockchainRecords.push(record);
  batch.status = "BLOCKCHAIN_REGISTERED";
  return record;
}

export function getBlockchainRecordsByBatch(batchId: string): BlockchainRecord[] {
  return state.blockchainRecords.filter((r) => r.batchId === batchId);
}

export function getAllBlockchainRecords(): BlockchainRecord[] {
  return state.blockchainRecords;
}

// ---------------------------------------------------------------------------
// Dashboards / aggregates
// ---------------------------------------------------------------------------

export function getPlatformStats() {
  const activeHives = state.hives.length;
  const totalBatches = state.batches.length;
  const labVerifiedBatches = state.batches.filter((b) => b.status === "BLOCKCHAIN_REGISTERED").length;
  const testedBatches = state.labReports.length;
  const verificationSuccessRate = testedBatches
    ? Math.round((state.labReports.filter((r) => r.overallResult === "PASSED").length / testedBatches) * 1000) / 10
    : 0;
  return {
    activeHives,
    totalBatches,
    labVerifiedBatches,
    verificationSuccessRate,
    beekeepersCount: state.beekeepers.length,
  };
}

export function getBeekeeperDashboard(beekeeperId: string) {
  const hiveList = getHivesByBeekeeper(beekeeperId);
  const healthyHives = hiveList.filter((h) => h.status === "HEALTHY").length;
  const attentionHives = hiveList.filter((h) => h.status !== "HEALTHY").length;

  const predictions = hiveList.map((h) => getHiveYieldPrediction(h.id)?.predictedYieldKg ?? 0);
  const estimatedYieldKg = Math.round(predictions.reduce((a, b) => a + b, 0) * 10) / 10;

  const batchList = getBatchesByBeekeeper(beekeeperId);
  const activeBatches = batchList.filter((b) => b.status !== "BLOCKCHAIN_REGISTERED" && b.status !== "LAB_FAILED").length;

  const nextInspectionDays = hiveList.length
    ? Math.min(
        ...hiveList.map((h) => Math.ceil((new Date(h.nextInspection).getTime() - Date.now()) / (24 * 3600 * 1000)))
      )
    : 0;

  return {
    totalHives: hiveList.length,
    healthyHives,
    attentionHives,
    estimatedYieldKg,
    nextHarvestDays: Math.max(1, nextInspectionDays),
    activeBatches,
  };
}

export function getLabDashboard() {
  const pendingSamples = state.labSamples.filter((s) => s.status !== "COMPLETED").length;
  const testsCompleted = state.labReports.length;
  const passed = state.labReports.filter((r) => r.overallResult === "PASSED").length;
  const failed = state.labReports.filter((r) => r.overallResult === "FAILED").length;
  const avgQualityScore = testsCompleted
    ? Math.round((state.labReports.reduce((sum, r) => sum + r.qualityScore, 0) / testsCompleted) * 10) / 10
    : 0;
  return { pendingSamples, testsCompleted, passed, failed, avgQualityScore };
}

// ---------------------------------------------------------------------------
// Consumer verification (public-safe projection)
// ---------------------------------------------------------------------------

export function getPublicVerification(batchCode: string) {
  const batch = getBatchByCode(batchCode);
  if (!batch) return { found: false as const };

  const hive = getHiveById(batch.hiveId);
  const beekeeper = hive ? getBeekeeperById(hive.beekeeperId) : undefined;
  const sample = getLabSampleByBatchId(batch.id);
  const report = sample ? getLabReportBySample(sample.id) : undefined;
  const tests = sample ? getLabTestsBySample(sample.id) : [];
  const blockchainRecord = getBlockchainRecordsByBatch(batch.id)[0];

  if (!hive || !beekeeper) return { found: false as const };

  const isVerified = batch.status === "BLOCKCHAIN_REGISTERED" && !!blockchainRecord;

  const consumerFriendlyTests = tests
    .filter((t) => ["Moisture", "pH", "HMF (Hydroxymethylfurfural)", "Sucrose"].includes(t.testName))
    .map((t) => ({ testName: t.testName, measuredValue: t.measuredValue, unit: t.unit, result: t.result }));
  const allPublicTests = tests.map((t) => ({ category: t.category, testName: t.testName, measuredValue: t.measuredValue, unit: t.unit, result: t.result }));
  const adulterationPassed = tests.length > 0 && tests.filter((t) => t.category === "ADULTERATION").every((t) => t.result === "PASS");
  const beeActivityLabel = batch.envSnapshot.aiHealthScore >= 75 ? "High" : batch.envSnapshot.aiHealthScore >= 50 ? "Moderate" : "Low";

  return {
    found: true as const,
    isVerified,
    batch: {
      batchCode: batch.batchCode,
      harvestDate: batch.harvestDate,
      quantity: batch.quantity,
      honeyType: batch.honeyType,
      floralSource: batch.floralSource,
      extractionMethod: batch.extractionMethod,
      storageTemperature: batch.storageTemperature,
      storageLocation: batch.storageLocation,
      status: batch.status,
      createdAt: batch.createdAt,
    },
    hive: {
      hiveCode: hive.hiveCode,
      name: hive.name,
      region: hive.location,
      harvestConditions: { ...batch.envSnapshot, beeActivity: beeActivityLabel },
    },
    beekeeper: {
      beekeeperCode: beekeeper.beekeeperCode,
      name: beekeeper.name,
      region: beekeeper.region,
      registrationStatus: beekeeper.registrationStatus,
    },
    lab: report
      ? {
          overallResult: report.overallResult,
          qualityGrade: report.qualityGrade,
          qualityScore: report.qualityScore,
          breakdown: report.breakdown,
          selectedTests: consumerFriendlyTests,
          allTests: allPublicTests,
          adulterationPassed,
          testedAt: report.createdAt,
        }
      : null,
    blockchain: blockchainRecord
      ? {
          transactionHash: blockchainRecord.transactionHash,
          blockNumber: blockchainRecord.blockNumber,
          network: blockchainRecord.network,
          timestamp: blockchainRecord.timestamp,
          isDemo: blockchainRecord.isDemo,
        }
      : null,
    timeline: buildTimeline(batch, sample, report, blockchainRecord),
  };
}

function buildTimeline(
  batch: HoneyBatch,
  sample?: LabSample,
  report?: LabReport,
  blockchainRecord?: BlockchainRecord
) {
  const events: { icon: string; label: string; date: string }[] = [];
  const dayBeforeHarvest = new Date(new Date(batch.harvestDate).getTime() - 24 * 3600 * 1000).toISOString();
  events.push({ icon: "hive", label: "Hive monitoring recorded", date: dayBeforeHarvest });
  events.push({ icon: "harvest", label: "Honey harvested", date: batch.harvestDate });
  events.push({ icon: "batch", label: `Batch ${batch.batchCode} created`, date: batch.createdAt });
  if (sample) {
    events.push({ icon: "lab-received", label: "Laboratory sample received", date: sample.receivedAt });
  }
  if (report) {
    events.push({ icon: "lab-done", label: "Laboratory testing completed", date: report.createdAt });
  }
  if (blockchainRecord) {
    events.push({ icon: "blockchain", label: "Batch registered on blockchain", date: blockchainRecord.timestamp });
    events.push({ icon: "consumer", label: "Consumer verification available", date: blockchainRecord.timestamp });
  }
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
