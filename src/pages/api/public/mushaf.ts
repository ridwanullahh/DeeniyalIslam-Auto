/**
 * GET /api/public/mushaf?page=N — get a single Mushaf page by number (public, no auth)
 */
import type { APIRoute } from "astro";
import { collections } from "@/lib/lightbase/client";

const quranPages = collections("quran_pages");

export const GET: APIRoute = async ({ url }) => {
  const page = Number(url.searchParams.get("page") ?? "1");
  if (!Number.isFinite(page) || page < 1 || page > 604) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid page number (1-604)" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const list = await quranPages.list({
      filter: { field: "pageNumber", op: "eq", value: page },
      limit: 1,
    });
    if (list.data.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Page not uploaded yet" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, page: list.data[0] }), {
      status: 200, headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
