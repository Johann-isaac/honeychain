import { NextRequest, NextResponse } from "next/server";
import { changeBeekeeperPassword } from "@/lib/db";
import { getCurrentBeekeeperId, UnauthenticatedError } from "@/lib/auth";
import { ValidationError, requireString } from "@/lib/validation";

// POST /api/auth/change-password — for a signed-in beekeeper who knows
// their current password.
//
// Deliberately NOT a "forgot password" reset: that needs a mailer to send a
// one-time token, and sending a reset link to an unverified address is worse
// than having no reset at all. This covers the case we can secure today.
export async function POST(request: NextRequest) {
  try {
    const beekeeperId = await getCurrentBeekeeperId();
    const body = await request.json();

    const currentPassword = requireString(body.currentPassword, "Current password");
    const newPassword = requireString(body.newPassword, "New password");

    if (newPassword.length < 8) {
      throw new ValidationError("New password must be at least 8 characters.");
    }
    if (newPassword === currentPassword) {
      throw new ValidationError("The new password must be different from the current one.");
    }

    const ok = await changeBeekeeperPassword(beekeeperId, currentPassword, newPassword);
    if (!ok) {
      // Same shape as a validation failure on purpose — this endpoint is
      // already behind a session, so there is nothing to enumerate.
      return NextResponse.json({ error: "Your current password is not correct." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // proxy.ts does not cover /api/auth/*, so this route is gated by
    // getCurrentBeekeeperId() throwing. That has to surface as 401, not the
    // generic 400 — a client cannot tell "you are signed out" from "your
    // password was wrong" otherwise.
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Unable to change password.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
