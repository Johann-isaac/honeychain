// Core domain types for HoneyChain.
// These mirror the Prisma schema (see prisma/schema.prisma) so the mock
// data layer (lib/db.ts) can be swapped for a real database without
// touching consumers of these types.

export type RegistrationStatus = "VERIFIED" | "PENDING" | "SUSPENDED";

export interface Beekeeper {
  id: string;
  beekeeperCode: string;
  name: string;
  email: string;
  region: string;
  registrationStatus: RegistrationStatus;
  phone?: string;
  joinedDate: string;
}

export type HiveStatus = "HEALTHY" | "ATTENTION" | "CRITICAL";
export type QueenStatus = "ACTIVE" | "AGING" | "UNKNOWN" | "REPLACED";

export interface Hive {
  id: string;
  hiveCode: string;
  beekeeperId: string;
  name: string;
  location: string;
  installationDate: string;
  queenAge: number; // months
  queenStatus: QueenStatus;
  colonyStrength: number; // 0-100
  status: HiveStatus;
  lastInspection: string;
  nextInspection: string;
}

// Mirrors exactly what the physical prototype reports: one DHT22 (temperature
// + humidity), one load cell via HX711 (weight), one analog microphone
// (soundLevel), and one digital vibration sensor (vibration). No field here
// should exist unless a real sensor on the hive produces it.
export interface SensorReading {
  id: string;
  hiveId: string;
  temperature: number; // C — DHT22
  humidity: number; // % — DHT22
  weight: number; // kg — load cell + HX711
  soundLevel: number; // raw analog microphone reading (higher = louder)
  vibration: boolean; // digital vibration sensor: true = vibration detected
  timestamp: string;
}

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Alert {
  id: string;
  hiveId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation: string;
  timestamp: string;
  dismissed: boolean;
}

// Every batch is registered on the (demo) blockchain the moment it's
// created — "DRAFT" only exists for the brief window before that
// registration call resolves, and "REGISTRATION_FAILED" is a defensive
// fallback if it ever throws.
export type BatchStatus = "DRAFT" | "BLOCKCHAIN_REGISTERED" | "REGISTRATION_FAILED";

export interface HoneyBatch {
  id: string;
  batchCode: string;
  hiveId: string;
  beekeeperId: string;
  harvestDate: string;
  quantity: number; // kg
  honeyType: string;
  floralSource: string;
  extractionMethod: string;
  storageTemperature: number;
  storageLocation: string;
  status: BatchStatus;
  // Environmental snapshot captured at harvest time
  envSnapshot: {
    temperature: number;
    humidity: number;
    hiveWeight: number;
    aiHealthScore: number;
  };
  createdAt: string;
}

export interface BlockchainRecord {
  id: string;
  batchId: string;
  transactionHash: string;
  blockNumber: number;
  network: string;
  timestamp: string;
  status: "CONFIRMED" | "PENDING" | "FAILED";
  isDemo: boolean;
  dataHash: string;
}

export interface AiHealthResult {
  healthScore: number;
  riskLevel: "LOW" | "MODERATE" | "ELEVATED";
  breakdown: {
    temperature: number;
    humidity: number;
    weightTrend: number;
    soundActivity: number;
  };
  anomalies: string[];
  recommendations: string[];
  summary: string;
}

export interface YieldPrediction {
  predictedYieldKg: number;
  expectedHarvestDate: string;
  confidence: number; // 0-100
  factors: {
    label: string;
    value: number; // 0-100 contribution score
  }[];
  history: { label: string; actual?: number; predicted?: number }[];
}

// Aggregate "next expected yield" forecast shown on the beekeeper dashboard,
// combining every hive's individual YieldPrediction.
export interface YieldForecast {
  totalPredictedKg: number;
  averageConfidence: number;
  nextHarvest: {
    hiveId: string;
    hiveCode: string;
    hiveName: string;
    predictedYieldKg: number;
    expectedHarvestDate: string;
    confidence: number;
  } | null;
  perHive: {
    hiveId: string;
    hiveCode: string;
    hiveName: string;
    predictedYieldKg: number;
    expectedHarvestDate: string;
    confidence: number;
  }[];
}
