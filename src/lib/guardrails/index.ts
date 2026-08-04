/**
 * ToS-compliance guardrails — prevent platform bans by enforcing hard limits
 * on outbound message rates.
 *
 * WhatsApp Business Policy (and similar ToS for Telegram, Messenger):
 *   - Business-initiated conversations must be useful, expected, and welcomed
 *   - Sending too many messages in a short period can trigger rate-limiting or ban
 *   - Each subscriber must be able to opt out at any time
 *
 * This module enforces:
 *   1. Per-subscriber hourly cap (default 12/hour)
 *   2. Per-subscriber daily cap (default 60/day)
 *   3. Min delay between sends to the same subscriber (default 60s)
 *   4. Per-channel global rate limit (default 30/min)
 *   5. Honor opt-out: blacklisted/unsubscribed subscribers never receive messages
 *
 * All checks return { allowed: boolean; reason?: string }. The scheduler
 * respects these and skips deliveries that would violate the limits.
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import { CONFIG } from "@/config";
import { collections } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";

const log = logger("guardrails");

const deliveryLog = collections("delivery_log");
const subscribers = collections("subscribers");

export interface GuardrailDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether we can send a message to a subscriber right now.
 * Returns allowed=true if all guardrails pass.
 */
export async function canSendToSubscriber(subscriberId: string): Promise<GuardrailDecision> {
  const g = CONFIG.guardrails;

  // 1. Honor opt-out — fetch subscriber status
  let subscriber: any;
  try {
    subscriber = await subscribers.get(subscriberId);
  } catch {
    return { allowed: false, reason: "subscriber_not_found" };
  }
  if (!subscriber) return { allowed: false, reason: "subscriber_not_found" };
  if (subscriber.status === "unsubscribed") {
    return { allowed: false, reason: "opted_out" };
  }
  if (subscriber.status === "blacklisted") {
    return { allowed: false, reason: "blacklisted" };
  }
  if (subscriber.status === "paused") {
    return { allowed: false, reason: "paused" };
  }

  const now = Date.now();
  const hourAgo = new Date(now - 3600_000).toISOString();
  const dayAgo = new Date(now - 86400_000).toISOString();
  const minDelayAgo = new Date(now - g.minDelayBetweenSendsSec * 1000).toISOString();

  // 2. Fetch recent deliveries for this subscriber
  try {
    const recent = await deliveryLog.list({
      filter: { and: [
        { field: "subscriberId", op: "eq", value: subscriberId },
        { field: "attemptedAt", op: "gte", value: dayAgo },
        { field: "status", op: "in", value: ["sent", "retrying"] },
      ] },
      limit: 100,
      sort: "attemptedAt:desc",
    });

    // 3. Min delay check — most recent send must be > minDelay ago
    if (recent.data.length > 0) {
      const lastSend = recent.data[0] as any;
      const lastSendTime = new Date(lastSend.attemptedAt).getTime();
      const elapsedSec = (now - lastSendTime) / 1000;
      if (elapsedSec < g.minDelayBetweenSendsSec) {
        return {
          allowed: false,
          reason: `min_delay_not_met (${Math.floor(g.minDelayBetweenSendsSec - elapsedSec)}s remaining)`,
        };
      }
    }

    // 4. Hourly cap
    const hourCount = recent.data.filter((d: any) => d.attemptedAt >= hourAgo).length;
    if (hourCount >= g.maxPerSubscriberPerHour) {
      log.warn({ subscriberId, hourCount, cap: g.maxPerSubscriberPerHour }, "Hourly cap hit");
      return { allowed: false, reason: `hourly_cap_hit (${hourCount}/${g.maxPerSubscriberPerHour})` };
    }

    // 5. Daily cap
    if (recent.data.length >= g.maxPerSubscriberPerDay) {
      log.warn({ subscriberId, count: recent.data.length, cap: g.maxPerSubscriberPerDay }, "Daily cap hit");
      return { allowed: false, reason: `daily_cap_hit (${recent.data.length}/${g.maxPerSubscriberPerDay})` };
    }

    // 6. Min delay referenced minDelayAgo — already checked above

    return { allowed: true };
  } catch (e) {
    log.error({ err: e, subscriberId }, "Guardrail check failed; allowing (fail-open)");
    return { allowed: true };
  }
}

/**
 * Check whether a channel can accept another outbound message right now
 * (global rate limit per channel).
 */
const channelSendTimes = new Map<string, number[]>();

export function canSendOnChannel(channel: string): GuardrailDecision {
  const g = CONFIG.guardrails;
  const now = Date.now();
  const windowMs = 60_000;
  const times = channelSendTimes.get(channel) ?? [];
  // Prune old entries
  const recent = times.filter((t) => now - t < windowMs);
  if (recent.length >= g.maxChannelPerMinute) {
    return { allowed: false, reason: `channel_rate_limited (${recent.length}/${g.maxChannelPerMinute} per min)` };
  }
  recent.push(now);
  channelSendTimes.set(channel, recent);
  return { allowed: true };
}

/**
 * Record that a delivery was attempted on a channel.
 * Used by the rate limiter to track sends per minute.
 */
export function recordChannelSend(channel: string): void {
  const now = Date.now();
  const times = channelSendTimes.get(channel) ?? [];
  times.push(now);
  channelSendTimes.set(channel, times);
}

/**
 * Reset all in-memory rate limiter state. Used for tests.
 */
export function resetGuardrails(): void {
  channelSendTimes.clear();
}
