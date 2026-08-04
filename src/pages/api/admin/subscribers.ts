/**
 * GET /api/admin/subscribers — list subscribers (search, filter by platform/status)
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, type FilterExpr } from "@/lib/lightbase/client";

const subscribers = collections("subscribers");

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  const params = ctx.url.searchParams;
  const search = params.get("search")?.trim() || "";
  const platform = params.get("platform");
  const status = params.get("status");
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  const filters: FilterExpr[] = [];
  if (platform) filters.push({ field: "platform", op: "eq", value: platform });
  if (status) filters.push({ field: "status", op: "eq", value: status });
  if (search) {
    filters.push({
      or: [
        { field: "handle", op: "ilike", value: `%${search}%` },
        { field: "name", op: "ilike", value: `%${search}%` },
      ],
    });
  }
  const filter: FilterExpr | undefined = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0]
    : { and: filters };

  try {
    const result = await subscribers.list({
      filter, sort: "joinedAt:desc", limit, after, count: true,
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
