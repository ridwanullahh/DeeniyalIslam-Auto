/**
 * POST /api/admin/login
 * Body: { email, password }
 * Sets a signed JWT cookie and returns the admin email.
 *
 * Rate-limited per IP (5 attempts per 5 minutes).
 */
import type { APIRoute } from "astro";
import { findAdmin, issueSession, sessionCookie } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { logger } from "@/lib/logger";

const log = logger("api:admin:login");

// In-memory rate limiter (per pod). For multi-instance deployments, replace
// with a Redis-backed limiter.
const attempts = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }
  entry.count++;
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || "unknown";

  if (!checkRateLimit(ip)) {
    log.warn({ ip }, "Login rate-limited");
    return new Response(
      JSON.stringify({ ok: false, error: "Too many attempts. Try again in 5 minutes." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return new Response(
      JSON.stringify({ ok: false, error: "Email and password are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const admin = findAdmin(email, password);
  if (!admin) {
    log.warn({ ip, email }, "Failed login attempt");
    await recordAudit({
      actor: email,
      action: "admin.login.failed",
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid email or password" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const token = await issueSession(admin.email);
  await recordAudit({
    actor: admin.email,
    action: "admin.login.success",
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  log.info({ email: admin.email, ip }, "Admin logged in");

  return new Response(JSON.stringify({ ok: true, email: admin.email }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie(token),
    },
  });
};
