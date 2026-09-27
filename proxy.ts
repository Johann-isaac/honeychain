import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Gatekeeper for everything that belongs to a specific logged-in
// beekeeper. Runs on the Edge runtime, so it can't import lib/auth.ts
// (which is "server-only" and uses next/headers) — it duplicates just
// the JWT verification here instead.
//
// Deliberately NOT covered: /api/hive-data (ESP32s authenticate with a
// per-hive device secret, not a beekeeper session — see that route),
// /verify/* and /api/verify/* (public consumer-facing pages), /consumer/*,
// /login, /signup, and /api/auth/*.

const SESSION_COOKIE_NAME = "hc_session";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const isPage = request.nextUrl.pathname.startsWith("/beekeeper");
  const authed = await hasValidSession(request);

  if (authed) return NextResponse.next();

  if (isPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.json({ error: "Not signed in." }, { status: 401 });
}

export const config = {
  matcher: [
    "/beekeeper/:path*",
    "/api/beekeeper/:path*",
    "/api/hives",
    "/api/hives/:path*",
    "/api/batches",
    "/api/batches/:path*",
    "/api/alerts/:path*",
  ],
};
