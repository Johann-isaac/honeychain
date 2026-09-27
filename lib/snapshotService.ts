// Camera snapshot storage — a thin wrapper around the "hive-snapshots"
// Supabase Storage bucket (public-read, write-only via service_role; see
// supabase/schema.sql). Mirrors the pattern in lib/qrService.ts: store a
// path/code, generate the public URL from it on demand.

import "server-only";
import { getSupabase } from "@/lib/supabase/server";

const BUCKET = "hive-snapshots";
const MAX_BYTES = 2 * 1024 * 1024; // matches the bucket's fileSizeLimit

export class SnapshotError extends Error {}

// Stores one JPEG frame for a hive, replacing whatever was there before —
// only the latest snapshot per hive is kept, not a history, to keep
// storage bounded for a prototype with no cleanup job.
export async function saveHiveSnapshot(hiveId: string, jpegBytes: Uint8Array): Promise<string> {
  if (jpegBytes.byteLength === 0) throw new SnapshotError("Empty image body.");
  if (jpegBytes.byteLength > MAX_BYTES) throw new SnapshotError("Image exceeds the 2MB limit.");

  const path = `${hiveId}/latest.jpg`;
  const { error } = await getSupabase()
    .storage.from(BUCKET)
    .upload(path, jpegBytes, { contentType: "image/jpeg", upsert: true });

  if (error) throw new SnapshotError(`Unable to store snapshot: ${error.message}`);
  return path;
}

export function getSnapshotUrl(path: string): string {
  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
