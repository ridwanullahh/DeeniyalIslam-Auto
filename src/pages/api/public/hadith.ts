/**
 * Public content API — no auth required.
 * GET /api/public/hadith         — list hadiths (search, filter by collection)
 * GET /api/public/hadith?random=1 — random hadith
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError, type FilterExpr } from "@/lib/lightbase/client";

const hadiths = collections("hadiths");

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const search = params.get("search")?.trim() || "";
  const collection = params.get("collection");
  const random = params.get("random") === "1";
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  if (random) {
    try {
      const list = await hadiths.list({ limit: 100 });
      if (list.data.length === 0) {
        return new Response(JSON.stringify({ ok: false, error: "No hadiths available" }), {
          status: 404, headers: { "Content-Type": "application/json" },
        });
      }
      const offset = Math.floor(Math.random() * list.data.length);
      return new Response(JSON.stringify({ ok: true, hadith: list.data[offset] }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: "Failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  }

  const filters: FilterExpr[] = [];
  if (collection) filters.push({ field: "collection", op: "eq", value: collection });
  if (search) {
    filters.push({
      or: [
        { field: "textEn", op: "search", value: search },
        { field: "textAr", op: "search", value: search },
      ],
    });
  }
  const filter: FilterExpr | undefined = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0]
    : { and: filters };

  try {
    const result = await hadiths.list({
      filter, sort: "collection:asc,hadithNumber:asc", limit, after, count: true,
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
