/**
 * GET /api/admin/guardrails — returns current guardrail config + live stats
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { CONFIG } from "@/config";

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  return new Response(JSON.stringify({
    ok: true,
    config: {
      maxPerSubscriberPerHour: CONFIG.guardrails.maxPerSubscriberPerHour,
      maxPerSubscriberPerDay: CONFIG.guardrails.maxPerSubscriberPerDay,
      minDelayBetweenSendsSec: CONFIG.guardrails.minDelayBetweenSendsSec,
      maxChannelPerMinute: CONFIG.guardrails.maxChannelPerMinute,
      honorOptOut: CONFIG.guardrails.honorOptOut,
    },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};
