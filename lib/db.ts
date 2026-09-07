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
  sensorReadingsByHive,
  users,
} from "@/lib/mockData";
import { computeHiveHealth, predictYield } from "@/lib/aiHealthService";
import { blockchainService } from "@/lib/blockchainService";
import type { Alert, Beekeeper, BlockchainRecord, Hive, HoneyBatch, SensorReading, User, YieldForecast } from "@/types";

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
  blockchainRecords: BlockchainRecord[];
  batchCounter: number;
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
    blockchainRecords: [...seedBlockchainRecords],
    batchCounter: 1000,
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

// Creates a batch and immediately registers it on the (demo) blockchain —
// there is no laboratory step in between. If the registration call ever
// throws (e.g. once this is swapped for a real Web3 provider that can hit
// a network error), the batch is kept but marked REGISTRATION_FAILED
// instead of silently losing the beekeeper's submission.
export async function createBatch(input: CreateBatchInput): Promise<HoneyBatch> {
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

  try {
    const record = await blockchainService.registerBatch(batch.id, {
      batchCode: batch.batchCode,
      hiveId: batch.hiveId,
      harvestDate: batch.harvestDate,
      quantity: batch.quantity,
    });
    state.blockchainRecords.push(record);
    batch.status = "BLOCKCHAIN_REGISTERED";
  } catch {
    batch.status = "REGISTRATION_FAILED";
  }

  return batch;
}

// ---------------------------------------------------------------------------
// Blockchain
// ---------------------------------------------------------------------------

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
  const verifiedBatches = state.batches.filter((b) => b.status === "BLOCKCHAIN_REGISTERED").length;
  return {
    activeHives,
    totalBatches,
    verifiedBatches,
    beekeepersCount: state.beekeepers.length,
  };
}

export function getBeekeeperDashboard(beekeeperId: string) {
  const hiveList = getHivesByBeekeeper(beekeeperId);
  const healthyHives = hiveList.filter((h) => h.status === "HEALTHY").length;
  const attentionHives = hiveList.filter((h) => h.status !== "HEALTHY").length;

  const predictions = hiveList.map((h) => getHiveYieldPrediction(h.id)?.predictedYieldKg ?? 0);
  const estimatedYieldKg = Math.round(predictions.reduce((a, b) => a + b, 0) * 10) / 10;

  const totalBatches = getBatchesByBeekeeper(beekeeperId).length;

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
    totalBatches,
  };
}

// Aggregate "next expected yield" forecast across every hive a beekeeper
// owns, for the dashboard's yield-prediction feature.
export function getBeekeeperYieldForecast(beekeeperId: string): YieldForecast {
  const hiveList = getHivesByBeekeeper(beekeeperId);

  const perHive = hiveList
    .map((hive) => {
      const prediction = getHiveYieldPrediction(hive.id);
      if (!prediction) return null;
      return {
        hiveId: hive.id,
        hiveCode: hive.hiveCode,
        hiveName: hive.name,
        predictedYieldKg: prediction.predictedYieldKg,
        expectedHarvestDate: prediction.expectedHarvestDate,
        confidence: prediction.confidence,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => new Date(a.expectedHarvestDate).getTime() - new Date(b.expectedHarvestDate).getTime());

  const totalPredictedKg = Math.round(perHive.reduce((sum, h) => sum + h.predictedYieldKg, 0) * 10) / 10;
  const averageConfidence = perHive.length
    ? Math.round(perHive.reduce((sum, h) => sum + h.confidence, 0) / perHive.length)
    : 0;

  return {
    totalPredictedKg,
    averageConfidence,
    nextHarvest: perHive[0] ?? null,
    perHive,
  };
}

// ---------------------------------------------------------------------------
// Consumer verification (public-safe projection)
// ---------------------------------------------------------------------------

export function getPublicVerification(batchCode: string) {
  const batch = getBatchByCode(batchCode);
  if (!batch) return { found: false as const };

  const hive = getHiveById(batch.hiveId);
  const beekeeper = hive ? getBeekeeperById(hive.beekeeperId) : undefined;
  const blockchainRecord = getBlockchainRecordsByBatch(batch.id)[0];

  if (!hive || !beekeeper) return { found: false as const };

  const isVerified = batch.status === "BLOCKCHAIN_REGISTERED" && !!blockchainRecord;
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
    blockchain: blockchainRecord
      ? {
          transactionHash: blockchainRecord.transactionHash,
          blockNumber: blockchainRecord.blockNumber,
          network: blockchainRecord.network,
          timestamp: blockchainRecord.timestamp,
          isDemo: blockchainRecord.isDemo,
        }
      : null,
    timeline: buildTimeline(batch, blockchainRecord),
  };
}

function buildTimeline(batch: HoneyBatch, blockchainRecord?: BlockchainRecord) {
  const events: { icon: string; label: string; date: string }[] = [];
  const dayBeforeHarvest = new Date(new Date(batch.harvestDate).getTime() - 24 * 3600 * 1000).toISOString();
  events.push({ icon: "hive", label: "Hive monitoring recorded", date: dayBeforeHarvest });
  events.push({ icon: "harvest", label: "Honey harvested", date: batch.harvestDate });
  events.push({ icon: "batch", label: `Batch ${batch.batchCode} created`, date: batch.createdAt });
  if (blockchainRecord) {
    events.push({ icon: "blockchain", label: "Batch registered on blockchain", date: blockchainRecord.timestamp });
    events.push({ icon: "consumer", label: "Consumer verification available", date: blockchainRecord.timestamp });
  }
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
