/**
 * GET  /api/admin/khatma       — list all khatma subscriptions (admin view)
 * POST /api/admin/khatma       — create a khatma for a subscriber (admin-initiated)
 *
 * Admin-only.
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, type FilterExpr } from "@/lib/lightbase/client";
import { createKhatma } from "@/lib/khatma/engine";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";

const khatmaSubs = collections("khatma_subscriptions");

const CreateSchema = z.object({
  subscriberId: z.string().min(1),
  name: z.string().max(120).optional(),
  pace: z.enum(["pages_per_day", "pages_per_salah", "pages_per_week", "juz_per_week", "complete_in_days"]),
  pagesPerStep: z.number().int().min(1).max(604).optional(),
  targetDays: z.number().int().min(1).max(365).optional(),
  scheduleType: z.enum(["cron", "salah_relative", "interval_minutes"]),
  scheduleCron: z.string().optional(),
  salahKey: z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]).optional(),
  salahOffsetMinutes: z.number().int().min(-180).max(180).optional(),
  intervalMinutes: z.number().int().min(30).max(1440).optional(),
  channel: z.enum(["whatsapp", "telegram", "discord", "messenger"]).optional(),
  startPage: z.number().int().min(1).max(604).optional(),
  endPage: z.number().int().min(1).max(604).optional(),
});

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  const params = ctx.url.searchParams;
  const subscriberId = params.get("subscriberId");
  const status = params.get("status");
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  const filters: FilterExpr[] = [];
  if (subscriberId) filters.push({ field: "subscriberId", op: "eq", value: subscriberId });
  if (status) filters.push({ field: "status", op: "eq", value: status });
  const filter: FilterExpr | undefined = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0]
    : { and: filters };

  try {
    const result = await khatmaSubs.list({
      filter, sort: "createdAt:desc", limit, after, count: true,
    });
    return new Response(JSON.stringify({
      ok: true, data: result.data, hasMore: result.hasMore, count: result.count,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  let body: unknown;
  try { body = await ctx.request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      ok: false, error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    const result = await createKhatma(parsed.data);
    if (!result.ok) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }
    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "khatma.create",
      target: result.khatma?.id,
      after: parsed.data,
      ip: ctx.clientAddress || "unknown",
    });
    return new Response(JSON.stringify({ ok: true, khatma: result.khatma }), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
