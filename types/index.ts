// Core domain types for HoneyChain.
// These mirror the Prisma schema (see prisma/schema.prisma) so the mock
// data layer (lib/db.ts) can be swapped for a real database without
// touching consumers of these types.

export type UserRole = "BEEKEEPER" | "LAB_TECHNICIAN" | "CONSUMER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type RegistrationStatus = "VERIFIED" | "PENDING" | "SUSPENDED";

export interface Beekeeper {
  id: string;
  userId: string;
  beekeeperCode: string;
  name: string;
  region: string;
  registrationStatus: RegistrationStatus;
  phone?: string;
  joinedDate: string;
}

export type HiveStatus = "HEALTHY" | "ATTENTION" | "CRITICAL";
export type QueenStatus = "ACTIVE" | "AGING" | "UNKNOWN" | "REPLACED";
export type ActivityLevel = "LOW" | "MODERATE" | "HIGH";

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

export interface SensorReading {
  id: string;
  hiveId: string;
  temperature: number; // C
  externalTemperature: number; // C
  humidity: number; // %
  weight: number; // kg
  activity: ActivityLevel;
  activityScore: number; // 0-100
  sound: number; // relative dB index
  battery: number; // %
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

export type BatchStatus =
  | "DRAFT"
  | "AWAITING_LAB"
  | "IN_TESTING"
  | "LAB_PASSED"
  | "LAB_FAILED"
  | "BLOCKCHAIN_REGISTERED";

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
  moisture?: number;
  ph?: number;
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

export type SampleStatus =
  | "PENDING"
  | "TESTING_IN_PROGRESS"
  | "COMPLETED";

export type SamplePriority = "NORMAL" | "HIGH";

export interface LabSample {
  id: string;
  batchId: string;
  laboratoryId: string;
  receivedAt: string;
  status: SampleStatus;
  priority: SamplePriority;
}

export type TestResult = "PASS" | "FAIL";

export interface LabTest {
  id: string;
  sampleId: string;
  category: "PHYSICAL" | "CHEMICAL" | "ADULTERATION" | "MICROBIOLOGICAL";
  testName: string;
  measuredValue: number | string;
  unit: string;
  expectedRange: string;
  result: TestResult;
  remarks: string;
}

export type OverallResult = "PASSED" | "FAILED";
export type QualityGrade = "A+" | "A" | "B" | "C" | "REJECTED";

export interface LabReport {
  id: string;
  sampleId: string;
  batchId: string;
  technicianId: string;
  qualityScore: number;
  qualityGrade: QualityGrade;
  overallResult: OverallResult;
  breakdown: {
    purity: number;
    chemicalQuality: number;
    physicalQuality: number;
    microbiologicalSafety: number;
  };
  remarks: string;
  createdAt: string;
  digitallySigned: boolean;
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
  recordType: "BATCH_REGISTRATION" | "LAB_REPORT";
}

export interface AiHealthResult {
  healthScore: number;
  riskLevel: "LOW" | "MODERATE" | "ELEVATED";
  breakdown: {
    temperature: number;
    humidity: number;
    weightTrend: number;
    beeActivity: number;
    environmentalStability: number;
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
