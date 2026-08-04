/**
 * Public content API — no auth required.
 * GET /api/public/quran          — list verses (default: 25, sorted surah+ayah)
 * GET /api/public/quran?random=1 — single random verse (for "verse of the day")
 * GET /api/public/quran?surah=N  — filter by surah
 * GET /api/public/quran?search=… — search translations
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError, type FilterExpr } from "@/lib/lightbase/client";

const quran = collections("quran_verses");

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const search = params.get("search")?.trim() || "";
  const surah = params.get("surah");
  const random = params.get("random") === "1";
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  if (random) {
    try {
      const countRes = await quran.list({ count: true, limit: 1 });
      const total = countRes.count ?? 0;
      if (total === 0) {
        return new Response(JSON.stringify({ ok: false, error: "No verses available" }), {
          status: 404, headers: { "Content-Type": "application/json" },
        });
      }
      const list = await quran.list({ limit: 100 });
      const offset = Math.floor(Math.random() * Math.min(total, 100));
      const verse = list.data[offset % list.data.length];
      return new Response(JSON.stringify({ ok: true, verse }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: "Failed to fetch verse" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  }

  const filters: FilterExpr[] = [];
  if (surah) filters.push({ field: "surah", op: "eq", value: Number(surah) });
  if (search) {
    filters.push({
      or: [
        { field: "translation", op: "search", value: search },
        { field: "arabic", op: "search", value: search },
        { field: "surahNameEn", op: "search", value: search },
      ],
    });
  }
  const filter: FilterExpr | undefined = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0]
    : { and: filters };

  try {
    const result = await quran.list({
      filter, sort: "surah:asc,ayah:asc", limit, after, count: true,
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
