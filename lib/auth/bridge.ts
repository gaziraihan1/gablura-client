// ─────────────────────────────────────────────────────────────────────────────
// Auth — Internal backend bridge (login audit + account lockout)
// ─────────────────────────────────────────────────────────────────────────────
// The credentials check lives in Next.js, but the Redis-backed account
// lockout and the audit log live in the Express backend. These calls are
// strictly best-effort: they must never block or break a login.

import crypto from "crypto";
import type { FailedAttemptResult } from "./types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function callInternal<T = Record<string, unknown>>(
  path: string,
  fields: Record<string, unknown>,
): Promise<T | null> {
  // Unit tests have no backend to talk to — skip the network call entirely.
  if (process.env.NODE_ENV === "test") return null;
  try {
    const timestamp = Date.now();
    const signature = crypto
      .createHmac("sha256", process.env.NEXTAUTH_SECRET!)
      .update(JSON.stringify(fields))
      .digest("hex");
    const res = await fetch(`${BACKEND_URL}/api/v1/internal${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, timestamp, signature }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[bridge] ${path} returned ${res.status}: ${body}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[bridge] ${path} failed:`, err);
    return null;
  }
}

/** Record a failed login with the backend and surface the lock status (if any). */
export async function recordLoginFailure(
  email: string,
): Promise<FailedAttemptResult | null> {
  const result = await callInternal<FailedAttemptResult>("/failed-attempt", {
    email,
  });
  void callInternal("/audit", {
    event: "LOGIN_FAILED",
    email,
    reason: "Invalid credentials",
    meta: { attempts: result?.attempts ?? 0 },
  });
  return result;
}
