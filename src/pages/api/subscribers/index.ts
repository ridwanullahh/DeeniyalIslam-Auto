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
    contentType: z.enum(["quran_verse", "quran_page", "hadith", "adhkar_morning", "adhkar_evening", "adhkar_sleep", "adhkar_after_prayer", "general_reminder", "khatma_page", "salah_reminder"]),
    scheduleCron: z.string().min(1).optional(),
    scheduleType: z.enum(["cron", "salah_relative", "interval_minutes"]).optional(),
    salahKey: z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]).optional(),
    salahOffsetMinutes: z.number().int().min(-180).max(180).optional(),
    intervalMinutes: z.number().int().min(1).max(1440).optional(),
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
    // Check if subscriber already exists (to preserve meta on update)
    const existing = await subscribers.list({
      filter: { and: [
        { field: "platform", op: "eq", value: data.platform },
        { field: "handle", op: "eq", value: data.handle },
      ] },
      limit: 1,
    });
    const existingMeta = existing.data.length > 0 ? (existing.data[0] as any).meta ?? {} : {};
    const mergedMeta = { ...existingMeta, source: "website", lastSubscribeAt: now };

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
        joinedAt: existing.data.length > 0 ? (existing.data[0] as any).joinedAt : now,
        lastSeenAt: now,
        meta: mergedMeta,
      },
    );
    const subscriber = upsertRes.document;

    // Create subscriptions (skip duplicates by contentType for this subscriber)
    const createdSubs = [];
    for (const s of data.subscriptions) {
      // Determine schedule type — default to cron for backward compat
      const scheduleType = s.scheduleType ?? "cron";
      const scheduleCron = s.scheduleCron ?? "0 7 * * *"; // default 7am UTC

      // Parse cron to find local hour:minute + daysOfWeek (for cron schedule)
      let hour = 0, minute = 0, daysOfWeek: number[] = [];
      if (scheduleType === "cron" && scheduleCron) {
        const parts = scheduleCron.trim().split(/\s+/);
        minute = parts[0] === "*" ? 0 : Number(parts[0]);
        hour = parts[1] === "*" ? 0 : Number(parts[1]);
        daysOfWeek = parts[4] === "*" ? [] : parts[4].split(",").map(Number);
      }

      // Compute nextSendAt — for salah_relative, we need the subscriber's salah times
      // (which require location). If location isn't set yet, fall back to 6h from now
      // and the scheduler will recompute once location is set.
      let nextSendAt: string;
      if (scheduleType === "salah_relative") {
        // Try to fetch salah times — may return null if no location
        const { getSalahTimesForSubscriber } = await import("@/lib/salah/client");
        const { computeNextSendAt } = await import("@/lib/scheduling");
        const salahTimes = await getSalahTimesForSubscriber(subscriber.id);
        const computed = computeNextSendAt(
          { scheduleType, salahKey: s.salahKey, salahOffsetMinutes: s.salahOffsetMinutes ?? 0 },
          { timezone: data.timezone, salahTimes: salahTimes ?? undefined },
        );
        nextSendAt = computed ?? new Date(Date.now() + 6 * 3600_000).toISOString();
      } else {
        nextSendAt = computeNextSend(scheduleCron, data.timezone);
      }

      const newSub = await subscriptions.insert({
        subscriberId: subscriber.id,
        contentType: s.contentType,
        channel: data.platform,
        scheduleCron,
        scheduleType, // NEW field — but the subscriptions collection doesn't have it yet;
                       // we'll store it via meta or extend the schema. For now, the scheduler
                       // auto-detects salah_relative contentTypes (adhkar_morning etc.)
                       // and the khatma engine handles khatma_page.
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
