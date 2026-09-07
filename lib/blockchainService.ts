import crypto from "crypto";
import type { BlockchainRecord } from "@/types";

// blockchainService — abstraction layer over the underlying chain.
//
// This prototype ships a deterministic MOCK implementation. It is
// structured so that a real implementation (Polygon, Ethereum,
// Hyperledger Fabric, ...) can be dropped in behind the same
// `BlockchainProvider` interface without changing any caller.
//
// Every mock record is explicitly flagged `isDemo: true` and the UI must
// always render it as a "Demo Blockchain Transaction" / "Demo Blockchain
// Record" — never as a real on-chain confirmation.

export interface BlockchainProvider {
  network: string;
  isReal: boolean;
  registerBatch(batchId: string, payload: Record<string, unknown>): Promise<BlockchainRecord>;
  verifyBatch(batchId: string, dataHash: string): Promise<boolean>;
  getTransaction(transactionHash: string): Promise<BlockchainRecord | null>;
}

function hashPayload(payload: Record<string, unknown>) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function deterministicTxHash(seed: string) {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  return `0x${hash.slice(0, 64)}`;
}

function deterministicBlockNumber(seed: string) {
  const hash = crypto.createHash("sha256").update(`block:${seed}`).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 900000;
  return 1_800_000 + num;
}

declare global {
  // eslint-disable-next-line no-var
  var __honeychainBlockchainRecords: Map<string, BlockchainRecord> | undefined;
  // eslint-disable-next-line no-var
  var __honeychainBlockchainCounter: number | undefined;
}

// Pinned to globalThis for the same reason as lib/db.ts's state — so this
// index survives Turbopack's per-route module instantiation in dev.
const records = globalThis.__honeychainBlockchainRecords ?? new Map<string, BlockchainRecord>();
globalThis.__honeychainBlockchainRecords = records;
const DEMO_NETWORK = "HoneyChain Demo Network (mock)";

// Shared by the live mock provider below and by seed-data generation, so
// both paths produce records with the same shape and hashing scheme.
export function createDeterministicRecord(
  batchId: string,
  payload: Record<string, unknown>,
  timestamp: string,
  seedSuffix: string | number
): BlockchainRecord {
  const seed = `${batchId}:${seedSuffix}`;
  const dataHash = hashPayload(payload);
  const record: BlockchainRecord = {
    id: `bcr_${seed}`,
    batchId,
    transactionHash: deterministicTxHash(seed),
    blockNumber: deterministicBlockNumber(seed),
    network: DEMO_NETWORK,
    timestamp,
    status: "CONFIRMED",
    isDemo: true,
    dataHash,
  };
  records.set(record.transactionHash, record);
  return record;
}

class MockBlockchainProvider implements BlockchainProvider {
  network = DEMO_NETWORK;
  isReal = false;

  async registerBatch(batchId: string, payload: Record<string, unknown>) {
    await simulateLatency();
    globalThis.__honeychainBlockchainCounter = (globalThis.__honeychainBlockchainCounter ?? 0) + 1;
    return createDeterministicRecord(batchId, payload, new Date().toISOString(), globalThis.__honeychainBlockchainCounter);
  }

  async verifyBatch(batchId: string, dataHash: string) {
    for (const record of records.values()) {
      if (record.batchId === batchId && record.dataHash === dataHash) return true;
    }
    return false;
  }

  async getTransaction(transactionHash: string) {
    return records.get(transactionHash) ?? null;
  }
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 400));
}

// Swap point: if real blockchain credentials are configured via env vars,
// a real Web3 provider implementing the same interface would be selected
// here instead. e.g.:
//
//   export const blockchainService: BlockchainProvider = process.env.WEB3_RPC_URL
//     ? new PolygonBlockchainProvider(process.env.WEB3_RPC_URL, process.env.WEB3_PRIVATE_KEY)
//     : new MockBlockchainProvider();
export const blockchainService: BlockchainProvider = new MockBlockchainProvider();
