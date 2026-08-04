/**
 * Public content API — no auth required.
 * GET /api/public/adhkar          — list adhkar (filter by category)
 * GET /api/public/adhkar?random=1 — single random dhikr
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError, type FilterExpr } from "@/lib/lightbase/client";

const adhkar = collections("adhkar");

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const category = params.get("category");
  const random = params.get("random") === "1";
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  if (random) {
    try {
      const filter = category ? { field: "category", op: "eq", value: category } as FilterExpr : undefined;
      const list = await adhkar.list({ filter, limit: 100 });
      if (list.data.length === 0) {
        return new Response(JSON.stringify({ ok: false, error: "No adhkar available" }), {
          status: 404, headers: { "Content-Type": "application/json" },
        });
      }
      const offset = Math.floor(Math.random() * list.data.length);
      return new Response(JSON.stringify({ ok: true, dhikr: list.data[offset] }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: "Failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  }

  const filter: FilterExpr | undefined = category
    ? { field: "category", op: "eq", value: category }
    : undefined;

  try {
    const result = await adhkar.list({
      filter, sort: "category:asc,order:asc", limit, after, count: true,
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
