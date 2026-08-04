/**
 * Scheduling library — unified next-send-time computation for three schedule types:
 *
 *   1. cron             — standard UTC cron expression (cron-parser)
 *   2. salah_relative   — anchored to a subscriber's salah time + offset minutes
 *   3. interval_minutes — every N minutes from now
 *
 * This is channel-agnostic: it computes WHEN to send. The channel adapter
 * decides HOW to send. Both per-subscriber subscriptions AND the global
 * autoposter use this library.
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import cronParser from "cron-parser";
import { logger } from "@/lib/logger";
import type { SalahTimes } from "@/lib/salah/client";

const log = logger("scheduling");
const { CronExpressionParser } = cronParser;

export type ScheduleType = "cron" | "salah_relative" | "interval_minutes";

export interface ScheduleSpec {
  scheduleType: ScheduleType;
  scheduleCron?: string;
  salahKey?: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  salahOffsetMinutes?: number;
  intervalMinutes?: number;
}

export interface ScheduleContext {
  timezone: string;
  /** Today's salah times for the subscriber (required if scheduleType=salah_relative) */
  salahTimes?: SalahTimes;
  /** Used as the "now" reference for testing; defaults to new Date() */
  now?: Date;
}

/**
 * Compute the next send time (UTC ISO string) for a schedule spec.
 * Returns null if the schedule cannot be computed (e.g. missing salah times).
 */
export function computeNextSendAt(spec: ScheduleSpec, ctx: ScheduleContext): string | null {
  const now = ctx.now ?? new Date();
  try {
    switch (spec.scheduleType) {
      case "cron": {
        if (!spec.scheduleCron) {
          log.warn("cron schedule missing scheduleCron");
          return null;
        }
        const interval = CronExpressionParser.parse(spec.scheduleCron, { tz: ctx.timezone, currentDate: now });
        return interval.next().toISOString();
      }

      case "salah_relative": {
        if (!spec.salahKey) {
          return computeNextAnySalah(spec.salahOffsetMinutes ?? 0, ctx, now);
        }
        if (!ctx.salahTimes) {
          log.warn({ salahKey: spec.salahKey }, "salah_relative schedule missing salahTimes");
          return new Date(now.getTime() + 6 * 3600_000).toISOString();
        }
        return computeNextSpecificSalah(spec.salahKey, spec.salahOffsetMinutes ?? 0, ctx.salahTimes, ctx.timezone, now);
      }

      case "interval_minutes": {
        const mins = spec.intervalMinutes ?? 360;
        return new Date(now.getTime() + mins * 60_000).toISOString();
      }

      default:
        log.warn({ scheduleType: spec.scheduleType }, "Unknown schedule type");
        return null;
    }
  } catch (e) {
    log.error({ err: e, spec }, "Failed to compute next send");
    return null;
  }
}

/**
 * For "after every salah" schedules — compute the next salah-anchored time
 * across all 5 salahs of the day. If today's salahs are all in the past,
 * return tomorrow's Fajr + offset (approximated).
 */
function computeNextAnySalah(offsetMin: number, ctx: ScheduleContext, now: Date): string | null {
  if (!ctx.salahTimes) return null;
  const salahs: Array<{ key: string; time: string }> = [
    { key: "fajr", time: ctx.salahTimes.fajr },
    { key: "dhuhr", time: ctx.salahTimes.dhuhr },
    { key: "asr", time: ctx.salahTimes.asr },
    { key: "maghrib", time: ctx.salahTimes.maghrib },
    { key: "isha", time: ctx.salahTimes.isha },
  ];
  for (const s of salahs) {
    const t = new Date(s.time);
    const target = new Date(t.getTime() + offsetMin * 60_000);
    if (target > now) {
      return target.toISOString();
    }
  }
  return new Date(now.getTime() + 6 * 3600_000).toISOString();
}

function computeNextSpecificSalah(
  key: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha",
  offsetMin: number,
  salahTimes: SalahTimes,
  _timezone: string,
  now: Date,
): string {
  const t = new Date(salahTimes[key]);
  const target = new Date(t.getTime() + offsetMin * 60_000);
  if (target > now) {
    return target.toISOString();
  }
  return new Date(t.getTime() + 24 * 3600_000).toISOString();
}

export function validateScheduleSpec(spec: ScheduleSpec): string | null {
  switch (spec.scheduleType) {
    case "cron":
      if (!spec.scheduleCron) return "scheduleCron is required for cron schedule type";
      try {
        CronExpressionParser.parse(spec.scheduleCron);
      } catch {
        return `Invalid cron expression: ${spec.scheduleCron}`;
      }
      return null;
    case "salah_relative":
      if (spec.salahOffsetMinutes !== undefined && (spec.salahOffsetMinutes < -180 || spec.salahOffsetMinutes > 180)) {
        return "salahOffsetMinutes must be between -180 and 180";
      }
      return null;
    case "interval_minutes":
      if (!spec.intervalMinutes || spec.intervalMinutes < 1 || spec.intervalMinutes > 1440) {
        return "intervalMinutes must be between 1 and 1440";
      }
      return null;
    default:
      return `Unknown schedule type: ${spec.scheduleType as string}`;
  }
}

export function describeSchedule(spec: ScheduleSpec): string {
  switch (spec.scheduleType) {
    case "cron":
      return `Cron: ${spec.scheduleCron ?? "?"}`;
    case "salah_relative":
      if (!spec.salahKey) {
        const off = spec.salahOffsetMinutes ?? 0;
        return off === 0 ? "After every salah" : `After every salah ${off > 0 ? "+" : ""}${off}min`;
      }
      {
        const off = spec.salahOffsetMinutes ?? 0;
        const offStr = off === 0 ? "at" : (off > 0 ? `${off}min after` : `${-off}min before`);
        return `${offStr} ${spec.salahKey}`;
      }
    case "interval_minutes":
      return `Every ${spec.intervalMinutes ?? "?"} min`;
    default:
      return "Unknown schedule";
  }
}
