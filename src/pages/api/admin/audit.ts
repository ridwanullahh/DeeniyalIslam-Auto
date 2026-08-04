/**
 * GET /api/admin/audit — list audit entries with optional search + filter
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, type FilterExpr } from "@/lib/lightbase/client";

const audit = collections("admin_audit");

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  const params = ctx.url.searchParams;
  const search = params.get("search")?.trim() || "";
  const action = params.get("action");
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  const filters: FilterExpr[] = [];
  if (action) {
    filters.push({ field: "action", op: "ilike", value: `%${action}%` });
  }
  if (search) {
    filters.push({
      or: [
        { field: "action", op: "ilike", value: `%${search}%` },
        { field: "actor", op: "ilike", value: `%${search}%` },
        { field: "target", op: "ilike", value: `%${search}%` },
      ],
    });
  }
  const filter: FilterExpr | undefined = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0]
    : { and: filters };

  try {
    const result = await audit.list({
      filter, sort: "at:desc", limit, after, count: true,
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
