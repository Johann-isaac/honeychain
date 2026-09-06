import { NextResponse } from "next/server";
import {
  getBatchById,
  getBeekeeperById,
  getHiveHealth,
  getHiveById,
  getLabReportBySample,
  getLabSampleById,
  getLabTestsBySample,
  getBlockchainRecordsByBatch,
} from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = getLabSampleById(id);
  if (!sample) return NextResponse.json({ error: "Sample not found" }, { status: 404 });

  const batch = getBatchById(sample.batchId);
  const hive = batch ? getHiveById(batch.hiveId) : undefined;
  const beekeeper = batch ? getBeekeeperById(batch.beekeeperId) : undefined;
  const tests = getLabTestsBySample(id);
  const report = getLabReportBySample(id);
  const health = hive ? getHiveHealth(hive.id) : undefined;
  const blockchain = batch ? getBlockchainRecordsByBatch(batch.id)[0] ?? null : null;

  return NextResponse.json({ sample, batch, hive, beekeeper, tests, report, health, blockchain });
}
