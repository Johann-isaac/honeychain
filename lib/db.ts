// Supabase-backed data access layer.
//
// This is the only file that talks to Supabase directly — every page,
// component, and API route goes through the functions exported here. Rows
// come back from Postgres in snake_case; the map* helpers below translate
// them to the camelCase domain types in types/index.ts so nothing else in
// the app needs to know the storage layer changed.
//
// There is no authentication system yet, so "the current beekeeper" is a
// single bootstrapped row (see getDefaultBeekeeperId) rather than
// something derived from a logged-in session. Every hive a beekeeper adds
// from the UI is real: there is no seed/demo data left in this file.

import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { computeHiveHealth, deriveHiveAlerts, predictYield } from "@/lib/aiHealthService";
import { blockchainService } from "@/lib/blockchainService";
import { daysUntil } from "@/lib/utils";
import type { Alert, Beekeeper, BlockchainRecord, Hive, HoneyBatch, SensorReading, YieldForecast } from "@/types";

// ---------------------------------------------------------------------------
// Row → domain mappers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function mapBeekeeper(row: Row): Beekeeper {
  return {
    id: row.id,
    beekeeperCode: row.beekeeper_code,
    name: row.name,
    email: row.email,
    region: row.region,
    registrationStatus: row.registration_status,
    phone: row.phone ?? undefined,
    joinedDate: row.joined_date,
  };
}

function mapHive(row: Row): Hive {
  return {
    id: row.id,
    hiveCode: row.hive_code,
    beekeeperId: row.beekeeper_id,
    name: row.name,
    location: row.location,
    installationDate: row.installation_date,
    queenAge: row.queen_age,
    queenStatus: row.queen_status,
    colonyStrength: row.colony_strength,
    status: row.status,
    lastInspection: row.last_inspection,
    nextInspection: row.next_inspection,
  };
}

function mapSensorReading(row: Row): SensorReading {
  return {
    id: String(row.id),
    hiveId: row.hive_id,
    temperature: Number(row.temperature),
    humidity: Number(row.humidity),
    weight: Number(row.weight),
    soundLevel: Number(row.sound_level),
    vibration: row.vibration,
    timestamp: row.recorded_at,
  };
}

function mapAlert(row: Row): Alert {
  return {
    id: row.id,
    hiveId: row.hive_id,
    severity: row.severity,
    title: row.title,
    message: row.message,
    recommendation: row.recommendation,
    timestamp: row.timestamp,
    dismissed: row.dismissed,
  };
}

function mapBatch(row: Row): HoneyBatch {
  return {
    id: row.id,
    batchCode: row.batch_code,
    hiveId: row.hive_id,
    beekeeperId: row.beekeeper_id,
    harvestDate: row.harvest_date,
    quantity: Number(row.quantity),
    honeyType: row.honey_type,
    floralSource: row.floral_source,
    extractionMethod: row.extraction_method,
    storageTemperature: Number(row.storage_temperature),
    storageLocation: row.storage_location,
    status: row.status,
    envSnapshot: row.env_snapshot,
    createdAt: row.created_at,
  };
}

function mapBlockchainRecord(row: Row): BlockchainRecord {
  return {
    id: row.id,
    batchId: row.batch_id,
    transactionHash: row.transaction_hash,
    blockNumber: Number(row.block_number),
    network: row.network,
    timestamp: row.timestamp,
    status: row.status,
    isDemo: row.is_demo,
    dataHash: row.data_hash,
  };
}

function assertNoError<T>(data: T | null, error: { message: string } | null, context: string): T {
  if (error) throw new Error(`${context}: ${error.message}`);
  if (data === null) throw new Error(`${context}: no data returned`);
  return data;
}

// ---------------------------------------------------------------------------
// Beekeepers
// ---------------------------------------------------------------------------

// There is no login yet, so the app operates as a single beekeeper account,
// auto-created on first use. Override its identity with DEFAULT_BEEKEEPER_*
// env vars, or edit it later from /beekeeper/profile.
async function getOrCreateDefaultBeekeeper(): Promise<Beekeeper> {
  const db = getSupabase();
  const code = process.env.DEFAULT_BEEKEEPER_CODE ?? "BK-0001";

  const { data: existing } = await db.from("beekeepers").select("*").eq("beekeeper_code", code).maybeSingle();
  if (existing) return mapBeekeeper(existing);

  const { data: created, error } = await db
    .from("beekeepers")
    .insert({
      beekeeper_code: code,
      name: process.env.DEFAULT_BEEKEEPER_NAME ?? "Beekeeper",
      email: process.env.DEFAULT_BEEKEEPER_EMAIL ?? "beekeeper@honeychain.demo",
      region: process.env.DEFAULT_BEEKEEPER_REGION ?? "Unknown Region",
      registration_status: "VERIFIED",
    })
    .select()
    .single();

  return mapBeekeeper(assertNoError(created, error, "Unable to create default beekeeper"));
}

export async function getDefaultBeekeeperId(): Promise<string> {
  const beekeeper = await getOrCreateDefaultBeekeeper();
  return beekeeper.id;
}

export async function getBeekeeperById(id: string): Promise<Beekeeper | undefined> {
  const { data } = await getSupabase().from("beekeepers").select("*").eq("id", id).maybeSingle();
  return data ? mapBeekeeper(data) : undefined;
}

export interface UpdateBeekeeperInput {
  name?: string;
  region?: string;
  phone?: string;
}

export async function updateBeekeeper(id: string, input: UpdateBeekeeperInput): Promise<Beekeeper> {
  const { data, error } = await getSupabase()
    .from("beekeepers")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  return mapBeekeeper(assertNoError(data, error, "Unable to update beekeeper"));
}

// ---------------------------------------------------------------------------
// Hives
// ---------------------------------------------------------------------------

export async function getHivesByBeekeeper(beekeeperId: string): Promise<Hive[]> {
  const { data } = await getSupabase()
    .from("hives")
    .select("*")
    .eq("beekeeper_id", beekeeperId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(mapHive);
}

export async function getHiveById(id: string): Promise<Hive | undefined> {
  const { data } = await getSupabase().from("hives").select("*").eq("id", id).maybeSingle();
  return data ? mapHive(data) : undefined;
}

// Used by the ESP32 ingestion endpoint: the device only knows its own
// hive_code (flashed into firmware), never the internal uuid.
export async function getHiveByCode(hiveCode: string): Promise<Hive | undefined> {
  const { data } = await getSupabase().from("hives").select("*").eq("hive_code", hiveCode).maybeSingle();
  return data ? mapHive(data) : undefined;
}

export interface CreateHiveInput {
  beekeeperId: string;
  name: string;
  location: string;
  queenAge?: number;
  colonyStrength?: number;
}

// Generates the hive_code the beekeeper then flashes into that hive's
// ESP32 firmware as HIVE_ID.
export async function createHive(input: CreateHiveInput): Promise<Hive> {
  const db = getSupabase();
  const { count } = await db.from("hives").select("*", { count: "exact", head: true });
  const hiveCode = `HIVE-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const now = new Date();
  const nextInspection = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  const { data, error } = await db
    .from("hives")
    .insert({
      hive_code: hiveCode,
      beekeeper_id: input.beekeeperId,
      name: input.name,
      location: input.location,
      installation_date: now.toISOString(),
      queen_age: input.queenAge ?? 0,
      queen_status: "ACTIVE",
      colony_strength: input.colonyStrength ?? 70,
      status: "HEALTHY",
      last_inspection: now.toISOString(),
      next_inspection: nextInspection.toISOString(),
    })
    .select()
    .single();

  return mapHive(assertNoError(data, error, "Unable to create hive"));
}

// ---------------------------------------------------------------------------
// Sensor readings
// ---------------------------------------------------------------------------

export async function getSensorReadings(hiveId: string, hoursBack?: number): Promise<SensorReading[]> {
  let query = getSupabase().from("sensor_readings").select("*").eq("hive_id", hiveId).order("recorded_at", { ascending: true });
  if (hoursBack) {
    query = query.gte("recorded_at", new Date(Date.now() - hoursBack * 3600 * 1000).toISOString());
  }
  const { data } = await query;
  return (data ?? []).map(mapSensorReading);
}

export async function getLatestSensorReading(hiveId: string): Promise<SensorReading | undefined> {
  const { data } = await getSupabase()
    .from("sensor_readings")
    .select("*")
    .eq("hive_id", hiveId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapSensorReading(data) : undefined;
}

export interface InsertSensorReadingInput {
  hiveId: string;
  temperature: number;
  humidity: number;
  weight: number;
  soundLevel: number;
  vibration: boolean;
  recordedAt?: string;
}

// Called by POST /api/hive-data — the only write path an ESP32 ever
// reaches, and only after its Bearer device token is checked there.
export async function insertSensorReading(input: InsertSensorReadingInput): Promise<SensorReading> {
  const { data, error } = await getSupabase()
    .from("sensor_readings")
    .insert({
      hive_id: input.hiveId,
      temperature: input.temperature,
      humidity: input.humidity,
      weight: input.weight,
      sound_level: input.soundLevel,
      vibration: input.vibration,
      recorded_at: input.recordedAt ?? new Date().toISOString(),
    })
    .select()
    .single();

  return mapSensorReading(assertNoError(data, error, "Unable to insert sensor reading"));
}

export async function getHiveHealth(hiveId: string) {
  const hive = await getHiveById(hiveId);
  if (!hive) return undefined;
  return computeHiveHealth(hive, await getSensorReadings(hiveId));
}

export async function getHiveYieldPrediction(hiveId: string) {
  const hive = await getHiveById(hiveId);
  if (!hive) return undefined;
  const [readings, pastBatches] = await Promise.all([getSensorReadings(hiveId), getBatchesByHive(hiveId)]);
  return predictYield(hive, readings, pastBatches);
}

// ---------------------------------------------------------------------------
// Alerts — derived from live sensor anomalies, persisted so dismissal
// sticks instead of the same alert reappearing on the next page load.
// ---------------------------------------------------------------------------

async function syncHiveAlerts(hiveId: string): Promise<void> {
  const db = getSupabase();
  const readings = await getSensorReadings(hiveId, 24);
  const derived = deriveHiveAlerts(readings);
  if (derived.length === 0) return;

  const { data: existingRows } = await db.from("alerts").select("title").eq("hive_id", hiveId).eq("dismissed", false);
  const existingTitles = new Set((existingRows ?? []).map((r) => r.title as string));
  const toInsert = derived
    .filter((a) => !existingTitles.has(a.title))
    .map((a) => ({ hive_id: hiveId, severity: a.severity, title: a.title, message: a.message, recommendation: a.recommendation }));

  if (toInsert.length > 0) await db.from("alerts").insert(toInsert);
}

export async function getAlertsForBeekeeper(beekeeperId: string): Promise<Alert[]> {
  const hives = await getHivesByBeekeeper(beekeeperId);
  if (hives.length === 0) return [];

  await Promise.all(hives.map((h) => syncHiveAlerts(h.id)));

  const { data } = await getSupabase()
    .from("alerts")
    .select("*")
    .in("hive_id", hives.map((h) => h.id))
    .eq("dismissed", false)
    .order("timestamp", { ascending: false });

  return (data ?? []).map(mapAlert);
}

export async function dismissAlert(alertId: string): Promise<boolean> {
  const { data } = await getSupabase().from("alerts").update({ dismissed: true }).eq("id", alertId).select("id").maybeSingle();
  return !!data;
}

// ---------------------------------------------------------------------------
// Honey batches
// ---------------------------------------------------------------------------

export async function getBatchesByBeekeeper(beekeeperId: string): Promise<HoneyBatch[]> {
  const { data } = await getSupabase()
    .from("honey_batches")
    .select("*")
    .eq("beekeeper_id", beekeeperId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapBatch);
}

export async function getBatchesByHive(hiveId: string): Promise<HoneyBatch[]> {
  const { data } = await getSupabase().from("honey_batches").select("*").eq("hive_id", hiveId);
  return (data ?? []).map(mapBatch);
}

export async function getBatchById(id: string): Promise<HoneyBatch | undefined> {
  const { data } = await getSupabase().from("honey_batches").select("*").eq("id", id).maybeSingle();
  return data ? mapBatch(data) : undefined;
}

export async function getBatchByCode(code: string): Promise<HoneyBatch | undefined> {
  const { data } = await getSupabase().from("honey_batches").select("*").ilike("batch_code", code).maybeSingle();
  return data ? mapBatch(data) : undefined;
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
  const db = getSupabase();
  const hive = await getHiveById(input.hiveId);
  const [latest, health] = await Promise.all([
    getLatestSensorReading(input.hiveId),
    hive ? getHiveHealth(input.hiveId) : Promise.resolve(undefined),
  ]);

  const batchCode = `HC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const { data: inserted, error } = await db
    .from("honey_batches")
    .insert({
      batch_code: batchCode,
      hive_id: input.hiveId,
      beekeeper_id: input.beekeeperId,
      harvest_date: input.harvestDate,
      quantity: input.quantity,
      honey_type: input.honeyType,
      floral_source: input.floralSource,
      extraction_method: input.extractionMethod,
      storage_temperature: input.storageTemperature,
      storage_location: input.storageLocation,
      status: "DRAFT",
      env_snapshot: {
        temperature: latest?.temperature ?? 34,
        humidity: latest?.humidity ?? 60,
        hiveWeight: latest?.weight ?? 40,
        aiHealthScore: health?.healthScore ?? 80,
      },
    })
    .select()
    .single();

  const batch = mapBatch(assertNoError(inserted, error, "Unable to create batch"));

  try {
    const record = await blockchainService.registerBatch(batch.id, {
      batchCode: batch.batchCode,
      hiveId: batch.hiveId,
      harvestDate: batch.harvestDate,
      quantity: batch.quantity,
    });
    await db.from("blockchain_records").insert({
      batch_id: batch.id,
      transaction_hash: record.transactionHash,
      block_number: record.blockNumber,
      network: record.network,
      timestamp: record.timestamp,
      status: record.status,
      is_demo: record.isDemo,
      data_hash: record.dataHash,
    });
    await db.from("honey_batches").update({ status: "BLOCKCHAIN_REGISTERED" }).eq("id", batch.id);
    batch.status = "BLOCKCHAIN_REGISTERED";
  } catch {
    await db.from("honey_batches").update({ status: "REGISTRATION_FAILED" }).eq("id", batch.id);
    batch.status = "REGISTRATION_FAILED";
  }

  return batch;
}

// ---------------------------------------------------------------------------
// Blockchain
// ---------------------------------------------------------------------------

export async function getBlockchainRecordsByBatch(batchId: string): Promise<BlockchainRecord[]> {
  const { data } = await getSupabase().from("blockchain_records").select("*").eq("batch_id", batchId);
  return (data ?? []).map(mapBlockchainRecord);
}

// ---------------------------------------------------------------------------
// Dashboards / aggregates
// ---------------------------------------------------------------------------

export async function getPlatformStats() {
  const db = getSupabase();
  const [hiveCount, batchCount, verifiedCount, beekeeperCount] = await Promise.all([
    db.from("hives").select("*", { count: "exact", head: true }),
    db.from("honey_batches").select("*", { count: "exact", head: true }),
    db.from("honey_batches").select("*", { count: "exact", head: true }).eq("status", "BLOCKCHAIN_REGISTERED"),
    db.from("beekeepers").select("*", { count: "exact", head: true }),
  ]);

  return {
    activeHives: hiveCount.count ?? 0,
    totalBatches: batchCount.count ?? 0,
    verifiedBatches: verifiedCount.count ?? 0,
    beekeepersCount: beekeeperCount.count ?? 0,
  };
}

export async function getBeekeeperDashboard(beekeeperId: string) {
  const hiveList = await getHivesByBeekeeper(beekeeperId);
  const healthyHives = hiveList.filter((h) => h.status === "HEALTHY").length;
  const attentionHives = hiveList.length - healthyHives;

  const predictions = await Promise.all(hiveList.map(async (h) => (await getHiveYieldPrediction(h.id))?.predictedYieldKg ?? 0));
  const estimatedYieldKg = Math.round(predictions.reduce((a, b) => a + b, 0) * 10) / 10;

  const totalBatches = (await getBatchesByBeekeeper(beekeeperId)).length;

  const inspectionDays = hiveList.filter((h) => h.nextInspection).map((h) => daysUntil(h.nextInspection));
  const nextInspectionDays = inspectionDays.length ? Math.min(...inspectionDays) : 0;

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
export async function getBeekeeperYieldForecast(beekeeperId: string): Promise<YieldForecast> {
  const hiveList = await getHivesByBeekeeper(beekeeperId);

  const perHive = (
    await Promise.all(
      hiveList.map(async (hive) => {
        const prediction = await getHiveYieldPrediction(hive.id);
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
    )
  )
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

export async function getPublicVerification(batchCode: string) {
  const batch = await getBatchByCode(batchCode);
  if (!batch) return { found: false as const };

  const [hive, blockchainRecords] = await Promise.all([getHiveById(batch.hiveId), getBlockchainRecordsByBatch(batch.id)]);
  const beekeeper = hive ? await getBeekeeperById(hive.beekeeperId) : undefined;
  const blockchainRecord = blockchainRecords[0];

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
