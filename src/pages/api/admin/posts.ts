/**
 * GET  /api/admin/posts       — list posts (filter by status, contentType)
 * POST /api/admin/posts       — create a new scheduled post (autopost)
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, type FilterExpr } from "@/lib/lightbase/client";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";

const posts = collections("posts");

const CreateSchema = z.object({
  contentType: z.enum(["quran_verse", "hadith", "adhkar", "reminder"]),
  refId: z.string().min(1),
  caption: z.string().max(5000).optional(),
  channelTargets: z.array(z.string()).min(1),
  scheduledFor: z.string(), // ISO datetime
});

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;
  const params = ctx.url.searchParams;
  const status = params.get("status");
  const contentType = params.get("contentType");
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  const filters: FilterExpr[] = [];
  if (status) filters.push({ field: "status", op: "eq", value: status });
  if (contentType) filters.push({ field: "contentType", op: "eq", value: contentType });
  const filter: FilterExpr | undefined = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0]
    : { and: filters };

  try {
    const result = await posts.list({
      filter, sort: "scheduledFor:desc", limit, after, count: true,
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
    const doc = await posts.insert({
      ...parsed.data,
      status: "scheduled",
      publishedAt: null,
      externalIds: {},
      error: null,
      createdBy: ctx.locals.adminEmail ?? "admin",
      createdAt: new Date().toISOString(),
    });
    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "post.schedule",
      target: doc.id,
      after: parsed.data,
      ip: ctx.clientAddress || "unknown",
    });
    return new Response(JSON.stringify({ ok: true, post: doc }), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
