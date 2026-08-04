/**
 * Scheduler engine.
 *
 * Two parallel workloads:
 *   1. Per-subscriber subscriptions (quran verse, hadith, adhkar, reminders, salah reminders)
 *   2. Per-subscriber khatma page deliveries
 *   3. Global autopost (broadcast to channels + site)
 *
 * Each tick (every 30s by default):
 *   - Find due subscriptions (status=active, nextSendAt <= now)
 *   - For each: fetch content, send via channel adapter (respecting guardrails),
 *     log delivery, compute nextSendAt using the scheduling library
 *   - Find due khatmas (status=active, nextSendAt <= now) — handled by khatma engine
 *   - Find due autoposts (status=scheduled, scheduledFor <= now) — handled by autoposter
 *
 * Runs in-process via setInterval. Bismillah Ar-Rahman Ar-Raheem.
 */
import cronParser from "cron-parser";
import { CONFIG } from "@/config";
import { collections } from "@/lib/lightbase/client";
import { getAdapter } from "@/lib/channels/registry";
import { logger } from "@/lib/logger";
import { canSendToSubscriber, canSendOnChannel, recordChannelSend } from "@/lib/guardrails";
import { computeNextSendAt, type ScheduleSpec } from "@/lib/scheduling";
import { getSalahTimesForSubscriber } from "@/lib/salah/client";
import { processDueKhatmas } from "@/lib/khatma/engine";
import { processDueAutoposts } from "@/lib/autoposter";

const log = logger("scheduler:engine");
const { CronExpressionParser } = cronParser;

const subscriptions = collections("subscriptions");
const subscribers = collections("subscribers");
const deliveryLog = collections("delivery_log");
const quran = collections("quran_verses");
const hadiths = collections("hadiths");
const adhkar = collections("adhkar");
const reminders = collections("reminders");

let pollTimer: ReturnType<typeof setInterval> | null = null;

export interface SchedulerStatus {
  running: boolean;
  lastRunAt: string | null;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  khatmaProcessed: number;
  khatmaSent: number;
  autopostProcessed: number;
  autopostSent: number;
}

const status: SchedulerStatus = {
  running: false,
  lastRunAt: null,
  processed: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
  khatmaProcessed: 0,
  khatmaSent: 0,
  autopostProcessed: 0,
  autopostSent: 0,
};

export function getSchedulerStatus(): SchedulerStatus {
  return { ...status };
}

export function startScheduler(): void {
  if (pollTimer) {
    log.warn("Scheduler already running");
    return;
  }
  if (!CONFIG.scheduler.enabled) {
    log.info("Scheduler disabled by config");
    return;
  }
  log.info({ pollIntervalSec: CONFIG.scheduler.pollIntervalSec }, "Starting scheduler");
  status.running = true;
  setTimeout(() => runOnce().catch((e) => log.error({ err: e }, "Initial run failed")), 5_000);
  pollTimer = setInterval(() => {
    runOnce().catch((e) => log.error({ err: e }, "Scheduler tick failed"));
  }, CONFIG.scheduler.pollIntervalSec * 1000);
}

export function stopScheduler(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  status.running = false;
  log.info("Scheduler stopped");
}

async function runOnce(): Promise<void> {
  const now = new Date().toISOString();
  status.lastRunAt = now;
  log.debug({ now }, "Scheduler tick");

  // 1. Per-subscriber subscriptions
  try {
    const due = await subscriptions.list({
      filter: { and: [
        { field: "status", op: "eq", value: "active" },
        { field: "nextSendAt", op: "lte", value: now },
      ] },
      limit: 50,
      sort: "nextSendAt:asc",
    });

    if (due.data.length > 0) {
      log.info({ count: due.data.length }, "Processing due subscriptions");
    }

    for (const sub of due.data) {
      status.processed++;
      try {
        const r = await processSubscription(sub as any);
        if (r.sent) status.sent++;
        else if (r.skipped) status.skipped++;
        else status.failed++;
      } catch (e) {
        status.failed++;
        log.error({ err: e, subscriptionId: sub.id }, "Failed to process subscription");
        await updateNextSendAt(sub.id, sub as any).catch(() => {});
      }
    }
  } catch (e) {
    log.error({ err: e }, "Scheduler tick failed (subscriptions)");
  }

  // 2. Khatma deliveries
  try {
    const k = await processDueKhatmas();
    status.khatmaProcessed += k.processed;
    status.khatmaSent += k.sent;
  } catch (e) {
    log.error({ err: e }, "Khatma batch failed");
  }

  // 3. Global autopost
  try {
    const a = await processDueAutoposts();
    status.autopostProcessed += a.processed;
    status.autopostSent += a.sent;
  } catch (e) {
    log.error({ err: e }, "Autopost batch failed");
  }
}

interface ProcessResult {
  sent: boolean;
  skipped: boolean;
  failed: boolean;
}

async function processSubscription(sub: any): Promise<ProcessResult> {
  // 1. Fetch the subscriber
  let subscriber;
  try {
    subscriber = await subscribers.get(sub.subscriberId);
  } catch {
    log.warn({ subscriptionId: sub.id, subscriberId: sub.subscriberId }, "Subscriber not found");
    await subscriptions.update(sub.id, { status: "archived" });
    return { sent: false, skipped: true, failed: false };
  }
  if (!subscriber || subscriber.status !== "active") {
    log.info({ subscriptionId: sub.id, subscriberStatus: subscriber?.status }, "Skipping inactive subscriber");
    await subscriptions.update(sub.id, { status: "archived" });
    return { sent: false, skipped: true, failed: false };
  }

  // 2. ToS guardrails — per-subscriber rate limits + opt-out honor
  const guard = await canSendToSubscriber(subscriber.id);
  if (!guard.allowed) {
    log.info({ subscriptionId: sub.id, subscriberId: subscriber.id, reason: guard.reason }, "Delivery skipped by guardrail");
    await deliveryLog.insert({
      subscriptionId: sub.id,
      subscriberId: subscriber.id,
      contentType: sub.contentType,
      channel: sub.channel,
      status: "skipped",
      attemptedAt: new Date().toISOString(),
      error: `guardrail: ${guard.reason}`,
    }).catch(() => {});
    await updateNextSendAt(sub.id, sub);
    return { sent: false, skipped: true, failed: false };
  }

  // 3. Channel-level rate limit
  const channelGuard = canSendOnChannel(sub.channel);
  if (!channelGuard.allowed) {
    log.info({ channel: sub.channel, reason: channelGuard.reason }, "Channel rate-limited");
    // Don't bump nextSendAt — we want to retry on the next tick
    return { sent: false, skipped: true, failed: false };
  }

  // 4. Fetch content based on contentType
  const content = await fetchContentForType(sub.contentType);
  if (!content) {
    log.warn({ contentType: sub.contentType }, "No content available for type");
    await deliveryLog.insert({
      subscriptionId: sub.id,
      subscriberId: subscriber.id,
      contentType: sub.contentType,
      channel: sub.channel,
      status: "skipped",
      attemptedAt: new Date().toISOString(),
      error: "No content available",
    });
    await updateNextSendAt(sub.id, sub);
    return { sent: false, skipped: true, failed: false };
  }

  // 5. Send via channel adapter
  const adapter = await getAdapter(sub.channel);
  const message = formatMessage(sub.contentType, content);
  const result = await adapter.send(subscriber.handle, message);
  recordChannelSend(sub.channel);

  // 6. Log delivery
  await deliveryLog.insert({
    subscriptionId: sub.id,
    subscriberId: subscriber.id,
    contentType: sub.contentType,
    channel: sub.channel,
    status: result.ok ? "sent" : "failed",
    attemptedAt: new Date().toISOString(),
    error: result.error,
  });

  // 7. Update lastSentAt + nextSendAt (using scheduling library)
  const now = new Date().toISOString();
  const spec = specFromSubscription(sub);
  let salahTimes = null;
  if (spec.scheduleType === "salah_relative") {
    salahTimes = await getSalahTimesForSubscriber(subscriber.id);
  }
  const nextSendAt = computeNextSendAt(spec, {
    timezone: subscriber.timezone ?? "UTC",
    salahTimes: salahTimes ?? undefined,
  }) ?? new Date(Date.now() + 3600_000).toISOString();

  await subscriptions.update(sub.id, {
    lastSentAt: now,
    nextSendAt,
    updatedAt: now,
  });

  log.info({
    subscriptionId: sub.id,
    contentType: sub.contentType,
    channel: sub.channel,
    subscriber: subscriber.handle,
    ok: result.ok,
    nextSendAt,
  }, "Delivery attempted");

  return { sent: result.ok, skipped: false, failed: !result.ok };
}

function specFromSubscription(sub: any): ScheduleSpec {
  // Existing subscriptions only have scheduleCron; we preserve backward compat
  // by detecting salah-related contentTypes and auto-anchoring to the right salah.
  if (sub.scheduleType === "salah_relative") {
    return {
      scheduleType: "salah_relative",
      salahKey: sub.salahKey,
      salahOffsetMinutes: sub.salahOffsetMinutes ?? 0,
    };
  }
  if (sub.scheduleType === "interval_minutes") {
    return { scheduleType: "interval_minutes", intervalMinutes: sub.intervalMinutes ?? 360 };
  }
  // Default: cron (backward compat)
  return { scheduleType: "cron", scheduleCron: sub.scheduleCron };
}

async function fetchContentForType(contentType: string): Promise<any> {
  try {
    switch (contentType) {
      case "quran_verse": {
        const list = await quran.list({ limit: 100 });
        return list.data.length > 0 ? list.data[Math.floor(Math.random() * list.data.length)] : null;
      }
      case "hadith": {
        const list = await hadiths.list({ limit: 100 });
        return list.data.length > 0 ? list.data[Math.floor(Math.random() * list.data.length)] : null;
      }
      case "adhkar_morning":
      case "adhkar_evening":
      case "adhkar_sleep":
      case "adhkar_after_prayer": {
        const category = contentType.replace("adhkar_", "");
        const list = await adhkar.list({
          filter: { field: "category", op: "eq", value: category },
          limit: 100,
        });
        return list.data.length > 0 ? list.data[Math.floor(Math.random() * list.data.length)] : null;
      }
      case "general_reminder": {
        const list = await reminders.list({
          filter: { field: "isPublished", op: "eq", value: true },
          limit: 100,
        });
        return list.data.length > 0 ? list.data[Math.floor(Math.random() * list.data.length)] : null;
      }
      default:
        return null;
    }
  } catch (e) {
    log.error({ err: e, contentType }, "Failed to fetch content");
    return null;
  }
}

function formatMessage(contentType: string, content: any): string {
  switch (contentType) {
    case "quran_verse":
      return [
        `*Surah ${content.surahNameEn} — ${content.surah}:${content.ayah}*`,
        "",
        content.arabic,
        "",
        content.translation,
        content.transliteration ? `\n_${content.transliteration}_` : "",
        `\n— ${content.source ?? "Saheeh International"}`,
      ].join("\n");
    case "hadith":
      return [
        `*${content.collection} #${content.hadithNumber}*${content.grade ? " [" + content.grade + "]" : ""}`,
        content.narratorEn ? `Narrated by ${content.narratorEn}\n` : "",
        content.textAr,
        "",
        content.textEn,
        content.source ? `\n— ${content.source}` : "",
      ].filter(Boolean).join("\n");
    case "adhkar_morning":
    case "adhkar_evening":
    case "adhkar_sleep":
    case "adhkar_after_prayer": {
      const label = contentType.replace("adhkar_", "");
      return [
        `*${label.charAt(0).toUpperCase() + label.slice(1)} Dhikr — repeat ×${content.repeatCount}*`,
        "",
        content.arabic,
        "",
        content.transliteration ?? "",
        "",
        content.translation,
        content.source ? `\n— ${content.source}` : "",
      ].filter(Boolean).join("\n");
    }
    case "general_reminder":
      return [
        `*${content.title}*`,
        "",
        content.body,
        content.source ? `\n— ${content.source}` : "",
      ].filter(Boolean).join("\n");
    default:
      return JSON.stringify(content);
  }
}

async function updateNextSendAt(subscriptionId: string, sub: any): Promise<void> {
  try {
    const subscriber = await subscribers.get(sub.subscriberId);
    const tz = subscriber?.timezone ?? "UTC";
    const spec = specFromSubscription(sub);
    let salahTimes = null;
    if (spec.scheduleType === "salah_relative") {
      salahTimes = await getSalahTimesForSubscriber(subscriber.id);
    }
    const next = computeNextSendAt(spec, { timezone: tz, salahTimes: salahTimes ?? undefined })
      ?? new Date(Date.now() + 3600_000).toISOString();
    await subscriptions.update(subscriptionId, { nextSendAt: next });
  } catch (e) {
    log.error({ err: e, subscriptionId }, "Failed to update nextSendAt");
  }
}
