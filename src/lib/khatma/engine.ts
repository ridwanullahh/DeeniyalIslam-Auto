/**
 * Khatma engine — manages Qur'an reading plans per subscriber.
 *
 * A khatma is a complete reading of the Qur'an (604 pages of the Mushaf Madinah).
 * Subscribers can choose their pace:
 *   - pages_per_day: 1+ page(s) per day at a fixed time
 *   - pages_per_salah: 1+ page(s) after every salah (5x/day) — finish in ~4 months
 *   - pages_per_week: 1+ page(s) per week — slow pace
 *   - juz_per_week: 1 juz (20 pages) per week — finish in 30 weeks (~7 months)
 *   - complete_in_days: finish the whole Qur'an in N days — page count auto-computed
 *
 * Schedule types: cron, salah_relative, interval_minutes
 *
 * Progress tracking: currentPage starts at startPage (default 1), advances
 * by pagesPerStep on each delivery. When currentPage > endPage (default 604),
 * the khatma is marked complete.
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import { collections } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";
import { computeNextSendAt, type ScheduleSpec } from "@/lib/scheduling";
import { getSalahTimesForSubscriber } from "@/lib/salah/client";
import { canSendToSubscriber } from "@/lib/guardrails";
import { getAdapter } from "@/lib/channels/registry";

const log = logger("khatma:engine");

const khatmaSubs = collections("khatma_subscriptions");
const subscribers = collections("subscribers");
const quranPages = collections("quran_pages");
const deliveryLog = collections("delivery_log");

const TOTAL_MUSHAF_PAGES = 604;

export interface CreateKhatmaInput {
  subscriberId: string;
  name?: string;
  pace: "pages_per_day" | "pages_per_salah" | "pages_per_week" | "juz_per_week" | "complete_in_days";
  pagesPerStep?: number;
  targetDays?: number;
  scheduleType: "cron" | "salah_relative" | "interval_minutes";
  scheduleCron?: string;
  salahKey?: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  salahOffsetMinutes?: number;
  intervalMinutes?: number;
  channel?: "whatsapp" | "telegram" | "discord" | "messenger";
  startPage?: number;
  endPage?: number;
}

export async function createKhatma(input: CreateKhatmaInput): Promise<{ ok: boolean; khatma?: any; error?: string }> {
  // Check for an existing active khatma
  const existing = await khatmaSubs.list({
    filter: { and: [
      { field: "subscriberId", op: "eq", value: input.subscriberId },
      { field: "status", op: "eq", value: "active" },
    ] },
    limit: 1,
  });
  if (existing.data.length > 0) {
    return { ok: false, error: "You already have an active khatma. Complete or abandon it first." };
  }

  // Compute pagesPerStep based on pace if not specified
  let pagesPerStep = input.pagesPerStep ?? 1;
  let targetDays = input.targetDays;
  const startPage = input.startPage ?? 1;
  const endPage = input.endPage ?? TOTAL_MUSHAF_PAGES;
  const totalPages = endPage - startPage + 1;

  if (input.pace === "complete_in_days" && targetDays) {
    // Distribute totalPages across targetDays, accounting for salah schedule
    let stepsPerDay = 1;
    if (input.scheduleType === "salah_relative") {
      if (input.salahKey) {
        stepsPerDay = 1; // One salah per day
      } else {
        stepsPerDay = 5; // After every salah = 5 per day
      }
    } else if (input.scheduleType === "interval_minutes") {
      const mins = input.intervalMinutes ?? 360;
      stepsPerDay = Math.max(1, Math.floor((24 * 60) / mins));
    }
    const totalSteps = targetDays * stepsPerDay;
    pagesPerStep = Math.max(1, Math.ceil(totalPages / totalSteps));
  } else if (input.pace === "juz_per_week") {
    pagesPerStep = 20; // 1 juz = 20 pages, weekly
  } else if (input.pace === "pages_per_salah" && !input.pagesPerStep) {
    pagesPerStep = 1;
  }

  // Compute targetEndAt
  let targetEndAt: string | null = null;
  if (targetDays) {
    targetEndAt = new Date(Date.now() + targetDays * 86400_000).toISOString();
  } else {
    // Estimate based on pace + schedule
    const stepsPerDay = estimateStepsPerDay(input);
    const totalSteps = Math.ceil(totalPages / pagesPerStep);
    const estDays = Math.ceil(totalSteps / stepsPerDay);
    targetEndAt = new Date(Date.now() + estDays * 86400_000).toISOString();
  }

  // Compute initial nextSendAt
  const subscriber = await subscribers.get(input.subscriberId);
  const tz = subscriber?.timezone ?? "UTC";
  let salahTimes = null;
  if (input.scheduleType === "salah_relative") {
    salahTimes = await getSalahTimesForSubscriber(input.subscriberId);
  }
  const spec: ScheduleSpec = {
    scheduleType: input.scheduleType,
    scheduleCron: input.scheduleCron,
    salahKey: input.salahKey,
    salahOffsetMinutes: input.salahOffsetMinutes ?? 5,
    intervalMinutes: input.intervalMinutes,
  };
  const nextSendAt = computeNextSendAt(spec, { timezone: tz, salahTimes: salahTimes ?? undefined }) ?? new Date(Date.now() + 3600_000).toISOString();

  const now = new Date().toISOString();
  const khatma = await khatmaSubs.insert({
    subscriberId: input.subscriberId,
    name: input.name ?? null,
    pace: input.pace,
    pagesPerStep,
    targetDays: targetDays ?? null,
    scheduleType: input.scheduleType,
    scheduleCron: input.scheduleCron ?? null,
    salahKey: input.salahKey ?? null,
    salahOffsetMinutes: input.salahOffsetMinutes ?? 5,
    intervalMinutes: input.intervalMinutes ?? null,
    channel: input.channel ?? "whatsapp",
    startPage,
    currentPage: startPage,
    endPage,
    deliveredCount: 0,
    startedAt: now,
    targetEndAt,
    nextSendAt,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  log.info({ khatmaId: khatma.id, subscriberId: input.subscriberId, pace: input.pace, pagesPerStep, targetEndAt }, "Khatma created");
  return { ok: true, khatma };
}

function estimateStepsPerDay(input: CreateKhatmaInput): number {
  if (input.scheduleType === "salah_relative") {
    return input.salahKey ? 1 : 5;
  }
  if (input.scheduleType === "interval_minutes") {
    const mins = input.intervalMinutes ?? 360;
    return Math.max(1, Math.floor((24 * 60) / mins));
  }
  // cron — assume 1/day unless cron has multiple daily runs
  return 1;
}

/**
 * Find all due khatma deliveries (nextSendAt <= now) and process them.
 * Called by the scheduler on each tick.
 */
export async function processDueKhatmas(): Promise<{ processed: number; sent: number; skipped: number; completed: number; failed: number }> {
  const now = new Date().toISOString();
  const result = { processed: 0, sent: 0, skipped: 0, completed: 0, failed: 0 };

  let due;
  try {
    due = await khatmaSubs.list({
      filter: { and: [
        { field: "status", op: "eq", value: "active" },
        { field: "nextSendAt", op: "lte", value: now },
      ] },
      limit: 30,
      sort: "nextSendAt:asc",
    });
  } catch (e) {
    log.error({ err: e }, "Failed to fetch due khatmas");
    return result;
  }

  for (const khatma of due.data) {
    result.processed++;
    try {
      const r = await deliverKhatmaPage(khatma as any);
      if (r.sent) result.sent++;
      else if (r.skipped) result.skipped++;
      else if (r.completed) result.completed++;
      else result.failed++;
    } catch (e) {
      result.failed++;
      log.error({ err: e, khatmaId: khatma.id }, "Khatma delivery failed");
      // Bump nextSendAt to avoid retry storm
      await bumpNextSendAt(khatma.id, khatma as any);
    }
  }
  return result;
}

async function deliverKhatmaPage(khatma: any): Promise<{ sent: boolean; skipped: boolean; completed: boolean }> {
  // Guardrails
  const guard = await canSendToSubscriber(khatma.subscriberId);
  if (!guard.allowed) {
    log.info({ khatmaId: khatma.id, reason: guard.reason }, "Khatma delivery skipped by guardrail");
    await bumpNextSendAt(khatma.id, khatma);
    return { sent: false, skipped: true, completed: false };
  }

  // Fetch subscriber
  let subscriber: any;
  try {
    subscriber = await subscribers.get(khatma.subscriberId);
  } catch {
    log.warn({ khatmaId: khatma.id }, "Subscriber not found; abandoning khatma");
    await khatmaSubs.update(khatma.id, { status: "abandoned" });
    return { sent: false, skipped: true, completed: false };
  }
  if (!subscriber || subscriber.status !== "active") {
    log.info({ khatmaId: khatma.id, subStatus: subscriber?.status }, "Skipping — subscriber not active");
    await bumpNextSendAt(khatma.id, khatma);
    return { sent: false, skipped: true, completed: false };
  }

  // Determine page(s) to deliver
  const pagesToDeliver: number[] = [];
  for (let i = 0; i < khatma.pagesPerStep; i++) {
    const pageNum = khatma.currentPage + i;
    if (pageNum > khatma.endPage) break;
    pagesToDeliver.push(pageNum);
  }
  if (pagesToDeliver.length === 0) {
    // Khatma complete!
    await khatmaSubs.update(khatma.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    // Send completion message
    const adapter = await getAdapter(khatma.channel);
    await adapter.send(subscriber.handle,
      `*Mabrouk! Khatma complete!*\n\nYou have finished reading the entire Qur'an from page ${khatma.startPage} to ${khatma.endPage}.\n\nMay Allah accept it from you. BaarakaLLAHu feek.\n\nReply 'khatma new' to start a new one, or 'help' for more commands.`,
    );
    log.info({ khatmaId: khatma.id, subscriberId: subscriber.id }, "Khatma completed!");
    return { sent: false, skipped: false, completed: true };
  }

  // Fetch page metadata
  const pageDocs = await Promise.all(
    pagesToDeliver.map(async (pn) => {
      const list = await quranPages.list({
        filter: { field: "pageNumber", op: "eq", value: pn },
        limit: 1,
      });
      return list.data[0] ?? null;
    }),
  );
  const validPages = pageDocs.filter((p) => p !== null);

  if (validPages.length === 0) {
    log.warn({ khatmaId: khatma.id, pages: pagesToDeliver }, "No page metadata found");
    await bumpNextSendAt(khatma.id, khatma);
    return { sent: false, skipped: true, completed: false };
  }

  // Compose + send the message
  const message = formatKhatmaMessage(khatma, validPages);
  const adapter = await getAdapter(khatma.channel);
  const sendResult = await adapter.send(subscriber.handle, message);

  // Log delivery
  await deliveryLog.insert({
    subscriptionId: `khatma:${khatma.id}`,
    subscriberId: subscriber.id,
    contentType: "khatma_page",
    channel: khatma.channel,
    status: sendResult.ok ? "sent" : "failed",
    attemptedAt: new Date().toISOString(),
    error: sendResult.error,
  });

  // Update progress
  const newCurrentPage = pagesToDeliver[pagesToDeliver.length - 1] + 1;
  const newDeliveredCount = (khatma.deliveredCount ?? 0) + pagesToDeliver.length;
  const isComplete = newCurrentPage > khatma.endPage;
  const now = new Date().toISOString();
  await khatmaSubs.update(khatma.id, {
    currentPage: newCurrentPage,
    deliveredCount: newDeliveredCount,
    lastDeliveredAt: now,
    updatedAt: now,
    nextSendAt: isComplete ? null : await computeNextKhatmaSendAt(khatma.id, khatma, subscriber),
    status: isComplete ? "completed" : "active",
    completedAt: isComplete ? now : null,
  });

  if (isComplete) {
    log.info({ khatmaId: khatma.id, subscriberId: subscriber.id }, "Khatma completed after final delivery");
    return { sent: sendResult.ok, skipped: false, completed: true };
  }

  return { sent: sendResult.ok, skipped: false, completed: false };
}

function formatKhatmaMessage(khatma: any, pages: any[]): string {
  const name = khatma.name ? ` (${khatma.name})` : "";
  const header = `*Qur'an Khatma${name} — Page ${pages[0].pageNumber}${pages.length > 1 ? `–${pages[pages.length - 1].pageNumber}` : ""} of ${khatma.endPage}*`;

  const progressPct = Math.round(((pages[pages.length - 1].pageNumber - khatma.startPage + 1) / (khatma.endPage - khatma.startPage + 1)) * 100);
  const progress = `Progress: ${progressPct}% (${pages[pages.length - 1].pageNumber}/${khatma.endPage})`;

  const pageList = pages.map((p) => {
    const surahs = (p.surahs ?? []).map((s: any) => `Surah ${s.surah}:${s.startAyah}-${s.endAyah}`).join("; ");
    const url = p.imageUrl ? `\n${p.imageUrl}` : "";
    return `Page ${p.pageNumber} (Juz ${p.juz})${surahs ? ` — ${surahs}` : ""}${url}`;
  }).join("\n\n");

  const footer = `\n\n_Reply 'pause' to pause or 'help' for commands._`;

  return [header, "", progress, "", pageList, footer].join("\n");
}

async function computeNextKhatmaSendAt(_khatmaId: string, khatma: any, subscriber: any): Promise<string> {
  const spec: ScheduleSpec = {
    scheduleType: khatma.scheduleType,
    scheduleCron: khatma.scheduleCron ?? undefined,
    salahKey: khatma.salahKey ?? undefined,
    salahOffsetMinutes: khatma.salahOffsetMinutes ?? 5,
    intervalMinutes: khatma.intervalMinutes ?? undefined,
  };
  let salahTimes = null;
  if (khatma.scheduleType === "salah_relative") {
    salahTimes = await getSalahTimesForSubscriber(subscriber.id);
  }
  const next = computeNextSendAt(spec, {
    timezone: subscriber.timezone ?? "UTC",
    salahTimes: salahTimes ?? undefined,
  });
  return next ?? new Date(Date.now() + 3600_000).toISOString();
}

async function bumpNextSendAt(khatmaId: string, khatma: any): Promise<void> {
  try {
    const subscriber = await subscribers.get(khatma.subscriberId);
    const next = await computeNextKhatmaSendAt(khatmaId, khatma, subscriber);
    await khatmaSubs.update(khatmaId, { nextSendAt: next });
  } catch (e) {
    log.error({ err: e, khatmaId }, "Failed to bump nextSendAt");
  }
}

/** Pause / resume / abandon a khatma */
export async function updateKhatmaStatus(khatmaId: string, status: "active" | "paused" | "abandoned"): Promise<boolean> {
  try {
    const updates: any = { status, updatedAt: new Date().toISOString() };
    if (status === "active") {
      // Recompute nextSendAt
      const khatma = await khatmaSubs.get(khatmaId);
      const subscriber = await subscribers.get(khatma.subscriberId);
      if (khatma && subscriber) {
        updates.nextSendAt = await computeNextKhatmaSendAt(khatmaId, khatma, subscriber);
      }
    } else {
      updates.nextSendAt = null;
    }
    await khatmaSubs.update(khatmaId, updates);
    return true;
  } catch (e) {
    log.error({ err: e, khatmaId, status }, "Failed to update khatma status");
    return false;
  }
}

/** Get a subscriber's active khatma (if any) */
export async function getActiveKhatma(subscriberId: string): Promise<any | null> {
  const list = await khatmaSubs.list({
    filter: { and: [
      { field: "subscriberId", op: "eq", value: subscriberId },
      { field: "status", op: "eq", value: "active" },
    ] },
    limit: 1,
  });
  return list.data[0] ?? null;
}
