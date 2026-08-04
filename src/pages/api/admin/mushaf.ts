/**
 * GET  /api/admin/mushaf            — list pages (with Cloudinary URLs)
 * POST /api/admin/mushaf/upload     — upload a page image to Cloudinary (or fallback to Lightbase)
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, LightbaseError } from "@/lib/lightbase/client";
import { uploadBuffer, isCloudinaryEnabled, publicUrl } from "@/lib/cloudinary";
import { recordAudit } from "@/lib/admin/audit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const log = logger("api:admin:mushaf");
const quranPages = collections("quran_pages");

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  const params = ctx.url.searchParams;
  const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
  const after = params.get("after") || undefined;
  const missing = params.get("missing") === "1";

  try {
    const result = await quranPages.list({
      sort: "pageNumber:asc",
      limit,
      after,
      count: true,
    });
    return new Response(JSON.stringify({
      ok: true,
      data: result.data,
      hasMore: result.hasMore,
      count: result.count,
      cloudinaryEnabled: isCloudinaryEnabled(),
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

  const contentType = ctx.request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return new Response(JSON.stringify({ ok: false, error: "Expected multipart/form-data" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await ctx.request.formData();
    const file = formData.get("file");
    const pageNumberStr = formData.get("pageNumber");
    const juzStr = formData.get("juz");
    const hizbStr = formData.get("hizb");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: "Missing 'file' field" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const pageNumber = Number(pageNumberStr);
    if (!Number.isFinite(pageNumber) || pageNumber < 1 || pageNumber > 604) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid pageNumber (1-604)" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicId = `page_${String(pageNumber).padStart(3, "0")}`;
    let imageUrl: string;

    if (isCloudinaryEnabled()) {
      const uploaded = await uploadBuffer(buffer, publicId, undefined, file.type || "image/png");
      if (!uploaded) {
        return new Response(JSON.stringify({ ok: false, error: "Cloudinary upload failed" }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
      imageUrl = uploaded.secureUrl;
    } else {
      // Fallback: save to Lightbase storage
      const { uploadFile } = await import("@/lib/lightbase/client");
      const path = `mushaf/page_${String(pageNumber).padStart(3, "0")}.png`;
      try {
        await uploadFile("deeniyalislam-media", path, buffer, file.type || "image/png");
      } catch (e) {
        // Lightbase upload might not work without setup; fall back to a placeholder
        log.warn({ err: e }, "Lightbase upload failed; using placeholder URL");
      }
      const { publicFileUrl } = await import("@/lib/lightbase/client");
      imageUrl = publicFileUrl("deeniyalislam-media", path);
    }

    // Upsert quran_pages doc
    const doc = await quranPages.upsert(
      { field: "pageNumber", op: "eq", value: pageNumber },
      {
        pageNumber,
        juz: juzStr ? Number(juzStr) : null,
        hizb: hizbStr ? Number(hizbStr) : null,
        rubElHizb: null,
        surahs: [],
        imageUrl,
        width: null,
        height: null,
      },
    );

    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "mushaf.upload",
      target: doc.document.id,
      after: { pageNumber, imageUrl },
      ip: ctx.clientAddress || "unknown",
    });

    return new Response(JSON.stringify({ ok: true, page: doc.document }), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error({ err: e }, "Mushaf upload failed");
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
