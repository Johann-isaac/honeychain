import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service_role key.
//
// SECURITY: the service_role key bypasses Row Level Security and must
// NEVER be sent to the browser or embedded in the ESP32 firmware. It is
// only read here, from process.env, inside server code (API routes,
// server components) — never exported to a client bundle. The ESP32
// never talks to Supabase directly; it only calls this app's own
// /api/hive-data endpoint (see app/api/hive-data/route.ts), which is the
// only thing allowed to hold this key.
//
// Required env vars (see .env.local.example):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// The client is created lazily (on first real query) rather than at
// import time, so the app can still boot and show a clear error on the
// page that needs it instead of crashing every route before you've had a
// chance to paste in credentials.

declare global {
  // eslint-disable-next-line no-var
  var __honeychainSupabase: SupabaseClient | undefined;
}

export function getSupabase(): SupabaseClient {
  if (globalThis.__honeychainSupabase) return globalThis.__honeychainSupabase;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local — see .env.local.example."
    );
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  globalThis.__honeychainSupabase = client;
  return client;
}
