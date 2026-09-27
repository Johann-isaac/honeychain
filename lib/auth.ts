// Beekeeper authentication: password hashing, session cookies (signed JWT),
// and per-hive device secrets for ESP32 authentication.
//
// There is one credential type for humans (username + password, checked
// against beekeepers.password_hash) and a completely separate one for
// devices (a per-hive secret, checked against hives.device_secret_hash) —
// a beekeeper's login never lets an ESP32 post data, and a device secret
// never lets anyone into the dashboard.

import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE_NAME = "hc_session";
const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not configured (or too short). Set a long random string in .env.local — see .env.local.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(beekeeperId: string): Promise<string> {
  return new SignJWT({ beekeeperId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecretKey());
}

export async function verifySessionToken(token: string): Promise<{ beekeeperId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecretKey());
    if (typeof payload.beekeeperId !== "string") return null;
    return { beekeeperId: payload.beekeeperId };
  } catch {
    return null;
  }
}

export async function setSessionCookie(beekeeperId: string): Promise<void> {
  const token = await createSessionToken(beekeeperId);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not signed in.");
    this.name = "UnauthenticatedError";
  }
}

// Reads the logged-in beekeeper's id from the session cookie. Every
// /beekeeper/* page and beekeeper-scoped API route calls this instead of
// trusting a client-supplied id — middleware.ts already redirects/blocks
// requests with no valid session before they reach here, but this throws
// too as defense in depth (e.g. if a route handler is ever hit directly).
export async function getCurrentBeekeeperId(): Promise<string> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) throw new UnauthenticatedError();
  return session.beekeeperId;
}

// ---------------------------------------------------------------------------
// Per-hive device secrets
// ---------------------------------------------------------------------------

// Generated once per hive at registration time and shown to the beekeeper
// exactly once — only its hash is ever persisted. 32 hex chars (16 random
// bytes) is short enough to copy into an Arduino string literal by hand.
export function generateDeviceSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashDeviceSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, 10);
}

export async function verifyDeviceSecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}
