/**
 * POST /api/khatma — public endpoint for creating a khatma subscription.
 * Body: { subscriberId, pace, pagesPerStep?, targetDays?, scheduleType, ... }
 *
 * Public (no admin auth) — but requires a valid subscriberId.
 * Rate-limited per IP.
 */
import type { APIRoute } from "astro";
import { createKhatma } from "@/lib/khatma/engine";
import { collections } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";

const log = logger("api:khatma");
const subscribers = collections("subscribers");

const rate = new Map<string, { count: number; ts: number }>();
const RATE_WINDOW = 10 * 60 * 1000;
const RATE_MAX = 3;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = rate.get(ip);
  if (!e || now - e.ts > RATE_WINDOW) { rate.set(ip, { count: 1, ts: now }); return true; }
  if (e.count >= RATE_MAX) return false;
  e.count++;
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || "unknown";
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ ok: false, error: "Too many attempts. Please try later." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  if (!body?.subscriberId) {
    return new Response(JSON.stringify({ ok: false, error: "subscriberId is required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // Verify subscriber exists
  let sub;
  try {
    sub = await subscribers.get(body.subscriberId);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Subscriber not found" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }
  if (!sub) {
    return new Response(JSON.stringify({ ok: false, error: "Subscriber not found" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await createKhatma({
      subscriberId: body.subscriberId,
      name: body.name,
      pace: body.pace,
      pagesPerStep: body.pagesPerStep,
      targetDays: body.targetDays,
      scheduleType: body.scheduleType,
      scheduleCron: body.scheduleCron,
      salahKey: body.salahKey,
      salahOffsetMinutes: body.salahOffsetMinutes,
      intervalMinutes: body.intervalMinutes,
      channel: body.channel ?? "whatsapp",
    });
    if (!result.ok) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, khatma: result.khatma }), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error({ err: e }, "Failed to create khatma");
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
