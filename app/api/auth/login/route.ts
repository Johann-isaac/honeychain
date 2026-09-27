import { NextRequest, NextResponse } from "next/server";
import { verifyBeekeeperCredentials } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { ValidationError, requireString } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = requireString(body.username, "Username").toLowerCase();
    const password = requireString(body.password, "Password");

    const beekeeper = await verifyBeekeeperCredentials(username, password);
    if (!beekeeper) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    await setSessionCookie(beekeeper.id);
    return NextResponse.json({ beekeeper });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to sign in." }, { status: 400 });
  }
}
