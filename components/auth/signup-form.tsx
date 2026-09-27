"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, region, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to create account.");
      // A full navigation (not router.push) so the new session cookie is
      // guaranteed to be picked up on the very next request — router.push
      // followed by router.refresh() races here and can leave the user
      // stuck on this page even though the account was created.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload so the new session cookie applies
      window.location.href = "/beekeeper";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
      setSubmitting(false);
    }
    // No `finally`: on success the browser is navigating away, and clearing
    // the submitting flag there would flash the idle button mid-navigation.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="field-label">
          Full name
        </label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1.5" autoComplete="name" required />
      </div>

      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1.5"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="region" className="field-label">
          Region
        </label>
        <input
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="e.g. Coimbatore, TN"
          className="input mt-1.5"
          required
        />
        <span className="field-hint">Shown to consumers on every batch you register.</span>
      </div>

      <div>
        <label htmlFor="new-username" className="field-label">
          Username
        </label>
        <input
          id="new-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input mt-1.5"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label htmlFor="new-password" className="field-label">
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pr-11"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <span className="field-hint">At least 8 characters.</span>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting} size="lg" className="w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
