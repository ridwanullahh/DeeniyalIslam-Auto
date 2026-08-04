/**
 * GET  /api/admin/quran          — list with optional ?search, ?surah, ?limit, ?after
 * POST /api/admin/quran          — create a new verse
 *
 * Admin-only (middleware enforces).
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError } from "@/lib/lightbase/client";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";

const quran = collections("quran_verses");

const VerseSchema = z.object({
  surah: z.number().int().min(1).max(114),
  ayah: z.number().int().min(1),
  surahNameAr: z.string().min(1),
  surahNameEn: z.string().min(1),
  surahNameTranslit: z.string().optional().default(""),
  arabic: z.string().min(1),
  translation: z.string().min(1),
  transliteration: z.string().optional().default(""),
  source: z.string().default("Saheeh International"),
  tags: z.array(z.string()).default([]),
  juz: z.number().int().min(1).max(30).optional(),
  page: z.number().int().min(1).max(604).optional(),
});

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const search = params.get("search")?.trim() || "";
  const surah = params.get("surah");
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;

  // Build filter
  const filters: any[] = [];
  if (surah) filters.push({ field: "surah", op: "eq", value: Number(surah) });
  if (search) {
    filters.push({
      or: [
        { field: "translation", op: "search", value: search },
        { field: "arabic", op: "search", value: search },
        { field: "surahNameEn", op: "search", value: search },
        { field: "surahNameTranslit", op: "ilike", value: `%${search}%` },
      ],
    });
  }
  const filter = filters.length === 0 ? undefined
    : filters.length === 1 ? filters[0]
    : { and: filters };

  try {
    const result = await quran.list({
      filter,
      sort: "surah:asc,ayah:asc",
      limit,
      after,
      count: true,
    });
    return new Response(JSON.stringify({
      ok: true,
      data: result.data,
      hasMore: result.hasMore,
      count: result.count,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  const parsed = VerseSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  try {
    const doc = await quran.insert(parsed.data);
    await recordAudit({
      actor: locals.adminEmail ?? "admin",
      action: "quran.create",
      target: doc.id,
      after: parsed.data,
      ip: clientAddress || "unknown",
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return new Response(JSON.stringify({ ok: true, document: doc }), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
