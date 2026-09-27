import { NextRequest, NextResponse } from "next/server";
import { createBeekeeperAccount } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { ValidationError, requireString, sanitizeText } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = requireString(body.username, "Username", { maxLength: 40 }).toLowerCase();
    if (!/^[a-z0-9_.-]+$/.test(username)) {
      throw new ValidationError("Username may only contain letters, numbers, underscores, dots, and hyphens.");
    }
    const password = requireString(body.password, "Password");
    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters.");
    }
    const name = sanitizeText(requireString(body.name, "Name", { maxLength: 80 }));
    const email = sanitizeText(requireString(body.email, "Email", { maxLength: 120 }));
    const region = sanitizeText(requireString(body.region, "Region", { maxLength: 120 }));

    const beekeeper = await createBeekeeperAccount({ username, password, name, email, region });
    await setSessionCookie(beekeeper.id);

    return NextResponse.json({ beekeeper }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
