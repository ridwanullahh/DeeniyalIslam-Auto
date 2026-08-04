/**
 * Public content API — no auth required.
 * GET /api/public/reminders — list reminders
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError, type FilterExpr } from "@/lib/lightbase/client";

const reminders = collections("reminders");

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const category = params.get("category");
  const language = params.get("language") ?? "en";
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  const filters: FilterExpr[] = [
    { field: "isPublished", op: "eq", value: true },
  ];
  if (category) filters.push({ field: "category", op: "eq", value: category });
  if (language) filters.push({ field: "language", op: "eq", value: language });

  try {
    const result = await reminders.list({
      filter: { and: filters }, sort: "category:asc", limit, after, count: true,
    });
    return new Response(JSON.stringify({
      ok: true, data: result.data, hasMore: result.hasMore, count: result.count,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
