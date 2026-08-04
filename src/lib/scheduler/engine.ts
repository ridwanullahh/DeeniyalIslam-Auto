/**
 * Scheduler engine.
 *
 * Polls the `subscriptions` collection for due subscriptions (nextSendAt <= now,
 * status = active) and dispatches them to the appropriate channel adapter.
 * Records each delivery in `delivery_log` and updates nextSendAt to the next
 * computed run time.
 *
 * Runs in-process via setInterval. Poll interval is configurable via
 * SCHEDULER_POLL_INTERVAL_SEC (default 30s).
 */
import cronParser from "cron-parser";
import { CONFIG } from "@/config";
import { collections } from "@/lib/lightbase/client";
import { getAdapter } from "@/lib/channels/registry";
import { logger } from "@/lib/logger";

const log = logger("scheduler:engine");

const { CronExpressionParser } = cronParser;

const subscriptions = collections("subscriptions");
const subscribers = collections("subscribers");
const deliveryLog = collections("delivery_log");
const quran = collections("quran_verses");
const hadiths = collections("hadiths");
const adhkar = collections("adhkar");
const reminders = collections("reminders");

let running = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

export interface SchedulerStatus {
  running: boolean;
  lastRunAt: string | null;
  processed: number;
  sent: number;
  failed: number;
}

const status: SchedulerStatus = {
  running: false,
  lastRunAt: null,
  processed: 0,
  sent: 0,
  failed: 0,
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
  // Run once immediately, then on interval
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

  try {
    // Find due subscriptions: status=active, nextSendAt <= now
    // We filter using a comparison — Lightbase supports gte/lt operators on datetime fields
    const due = await subscriptions.list({
      filter: { and: [
        { field: "status", op: "eq", value: "active" },
        { field: "nextSendAt", op: "lte", value: now },
      ] },
      limit: 50, // Process up to 50 per tick
      sort: "nextSendAt:asc",
    });

    if (due.data.length === 0) {
      log.debug("No due subscriptions");
      return;
    }
    log.info({ count: due.data.length }, "Processing due subscriptions");

    for (const sub of due.data) {
      status.processed++;
      try {
        await processSubscription(sub as any);
        status.sent++;
      } catch (e) {
        status.failed++;
        log.error({ err: e, subscriptionId: sub.id }, "Failed to process subscription");
        // Update the subscription's nextSendAt so we don't retry immediately
        await updateNextSendAt(sub.id, sub as any).catch(() => {});
      }
    }
  } catch (e) {
    log.error({ err: e }, "Scheduler tick failed");
  }
}

async function processSubscription(sub: any): Promise<void> {
  // Fetch the subscriber
  let subscriber;
  try {
    subscriber = await subscribers.get(sub.subscriberId);
  } catch {
    log.warn({ subscriptionId: sub.id, subscriberId: sub.subscriberId }, "Subscriber not found");
    await subscriptions.update(sub.id, { status: "archived" });
    return;
  }
  if (!subscriber || subscriber.status !== "active") {
    log.info({ subscriptionId: sub.id, subscriberStatus: subscriber?.status }, "Skipping inactive subscriber");
    await subscriptions.update(sub.id, { status: "archived" });
    return;
  }

  // Fetch content based on contentType
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
    return;
  }

  // Send via channel adapter
  const adapter = await getAdapter(sub.channel);
  const message = formatMessage(sub.contentType, content);
  const result = await adapter.send(subscriber.handle, message);

  // Log delivery
  await deliveryLog.insert({
    subscriptionId: sub.id,
    subscriberId: subscriber.id,
    contentType: sub.contentType,
    channel: sub.channel,
    status: result.ok ? "sent" : "failed",
    attemptedAt: new Date().toISOString(),
    error: result.error,
  });

  // Update lastSentAt + nextSendAt
  const now = new Date().toISOString();
  await subscriptions.update(sub.id, {
    lastSentAt: now,
    nextSendAt: computeNextSendAt(sub.scheduleCron, subscriber.timezone),
  });

  log.info({
    subscriptionId: sub.id,
    contentType: sub.contentType,
    channel: sub.channel,
    subscriber: subscriber.handle,
    ok: result.ok,
  }, "Delivery attempted");
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

function computeNextSendAt(cronExpr: string, timezone: string): string {
  try {
    const interval = CronExpressionParser.parse(cronExpr, { tz: timezone });
    const next = interval.next();
    return next.toISOString();
  } catch (e) {
    // Fallback: 24 hours from now
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
}

async function updateNextSendAt(subscriptionId: string, sub: any): Promise<void> {
  try {
    const subscriber = await subscribers.get(sub.subscriberId);
    const tz = subscriber?.timezone ?? "UTC";
    await subscriptions.update(subscriptionId, {
      nextSendAt: computeNextSendAt(sub.scheduleCron, tz),
    });
  } catch (e) {
    log.error({ err: e, subscriptionId }, "Failed to update nextSendAt");
  }
}
