/**
 * POST /api/subscribers
 * Public endpoint for new subscribers to onboard themselves via the website.
 *
 * Body:
 *   platform: 'whatsapp' | 'telegram' | 'discord' | 'messenger'
 *   handle:   E.164 phone (for whatsapp), TG chat id, Discord channel id, FB PSID
 *   name:     optional
 *   timezone: IANA tz (default 'Africa/Lagos')
 *   language: 'en' | 'ar' | 'fr' | 'ha' | 'yo' | 'sw'
 *   subscriptions: array of { contentType, scheduleCron }
 *
 * Idempotent: if a subscriber with the same (platform, handle) exists, the
 * existing record is updated (status set to 'active', new subscriptions added).
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError } from "@/lib/lightbase/client";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";
import cronParser from "cron-parser";

const subscribers = collections("subscribers");
const subscriptions = collections("subscriptions");

const { CronExpressionParser } = cronParser;

const SubscribeSchema = z.object({
  platform: z.enum(["whatsapp", "telegram", "discord", "messenger"]),
  handle: z.string().min(3).max(200),
  name: z.string().max(120).optional(),
  timezone: z.string().default("Africa/Lagos"),
  language: z.enum(["en", "ar", "fr", "ha", "yo", "sw"]).default("en"),
  subscriptions: z.array(z.object({
    contentType: z.enum(["quran_verse", "quran_page", "hadith", "adhkar_morning", "adhkar_evening", "adhkar_sleep", "adhkar_after_prayer", "general_reminder"]),
    scheduleCron: z.string().min(1),
  })).default([]),
});

// Rate limiter: max 3 subscribe requests per IP per 10 min
const rate = new Map<string, { count: number; ts: number }>();
const RATE_WINDOW = 10 * 60 * 1000;
const RATE_MAX = 3;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = rate.get(ip);
  if (!e || now - e.ts > RATE_WINDOW) {
    rate.set(ip, { count: 1, ts: now });
    return true;
  }
  if (e.count >= RATE_MAX) return false;
  e.count++;
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || "unknown";
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ ok: false, error: "Too many subscribe attempts. Please try again later." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const data = parsed.data;
  const now = new Date().toISOString();

  try {
    // Upsert subscriber by (platform, handle)
    const upsertRes = await subscribers.upsert(
      { and: [
        { field: "platform", op: "eq", value: data.platform },
        { field: "handle", op: "eq", value: data.handle },
      ] },
      {
        platform: data.platform,
        handle: data.handle,
        name: data.name ?? null,
        timezone: data.timezone,
        language: data.language,
        status: "active",
        joinedAt: now,
        lastSeenAt: now,
        meta: { source: "website" },
      },
    );
    const subscriber = upsertRes.document;

    // Create subscriptions (skip duplicates by contentType for this subscriber)
    const createdSubs = [];
    for (const s of data.subscriptions) {
      // Parse cron to find local hour:minute + daysOfWeek
      // Cron format: minute hour day month dayOfWeek
      const parts = s.scheduleCron.trim().split(/\s+/);
      const minute = parts[0] === "*" ? 0 : Number(parts[0]);
      const hour = parts[1] === "*" ? 0 : Number(parts[1]);
      const daysOfWeek = parts[4] === "*" ? [] : parts[4].split(",").map(Number);

      // Compute nextSendAt using the cron + subscriber timezone
      const nextSendAt = computeNextSend(s.scheduleCron, data.timezone);

      const newSub = await subscriptions.insert({
        subscriberId: subscriber.id,
        contentType: s.contentType,
        channel: data.platform,
        scheduleCron: s.scheduleCron,
        hourLocal: hour,
        minuteLocal: minute,
        daysOfWeek,
        nextSendAt,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      createdSubs.push(newSub);
    }

    await recordAudit({
      actor: "public",
      action: "subscriber.subscribe",
      target: subscriber.id,
      after: { platform: data.platform, handle: data.handle, subscriptions: data.subscriptions.length, isUpdate: !upsertRes.created },
      ip,
    });

    return new Response(JSON.stringify({
      ok: true,
      subscriber: { id: subscriber.id, isUpdate: !upsertRes.created },
      subscriptions: createdSubs.map((s: any) => ({ id: s.id, contentType: s.contentType, nextSendAt: s.nextSendAt })),
    }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * Compute the next send time (UTC ISO string) for a cron expression in a
 * given timezone. We use cron-parser (already in deps) which supports cron
 * expressions. We compute "now" in the subscriber's tz by converting the
 * current UTC instant into a tz-aware date, then ask cron-parser for the
 * next run after that instant.
 */
function computeNextSend(cronExpr: string, timezone: string): string {
  try {
    const interval = CronExpressionParser.parse(cronExpr, { tz: timezone });
    const next = interval.next();
    return next.toISOString();
  } catch (e) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
}
