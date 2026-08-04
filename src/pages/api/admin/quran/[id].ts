/**
 * GET    /api/admin/quran/[id]   — get a verse by id
 * PATCH  /api/admin/quran/[id]   — update a verse
 * DELETE /api/admin/quran/[id]   — delete a verse
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError } from "@/lib/lightbase/client";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";

const quran = collections("quran_verses");

const VerseUpdateSchema = z.object({
  surah: z.number().int().min(1).max(114).optional(),
  ayah: z.number().int().min(1).optional(),
  surahNameAr: z.string().min(1).optional(),
  surahNameEn: z.string().min(1).optional(),
  surahNameTranslit: z.string().optional(),
  arabic: z.string().min(1).optional(),
  translation: z.string().min(1).optional(),
  transliteration: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  juz: z.number().int().min(1).max(30).optional(),
  page: z.number().int().min(1).max(604).optional(),
  isFavorite: z.boolean().optional(),
});

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return new Response("Not found", { status: 404 });
  try {
    const doc = await quran.get(id);
    return new Response(JSON.stringify({ ok: true, document: doc }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof LightbaseError && (e.status === 404 || e.code === "not_found")) {
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals, clientAddress }) => {
  const id = params.id;
  if (!id) return new Response("Not found", { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  const parsed = VerseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  try {
    const before = await quran.get(id);
    const doc = await quran.update(id, parsed.data);
    await recordAudit({
      actor: locals.adminEmail ?? "admin",
      action: "quran.update",
      target: id,
      before,
      after: parsed.data,
      ip: clientAddress || "unknown",
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return new Response(JSON.stringify({ ok: true, document: doc }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, request, locals, clientAddress }) => {
  const id = params.id;
  if (!id) return new Response("Not found", { status: 404 });
  try {
    const before = await quran.get(id);
    await quran.delete(id);
    await recordAudit({
      actor: locals.adminEmail ?? "admin",
      action: "quran.delete",
      target: id,
      before,
      ip: clientAddress || "unknown",
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
