/**
 * POST /api/seed
 * Seeds all collections with real Islamic content from src/lib/content/seed-data.ts.
 * Idempotent — uses Lightbase's /seed endpoint with dedupOn.
 * Localhost-only (no auth) until admin auth is wired up.
 */
import type { APIRoute } from "astro";
import { collections, lb } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";
import {
  QURAN_VERSES,
  HADITHS,
  ADHKAR,
  REMINDERS,
  QURAN_PAGES,
} from "@/lib/content/seed-data";

const log = logger("api:seed");

interface SeedResult {
  collection: string;
  inserted: number;
  skipped: number;
  errors: unknown[];
}

export const POST: APIRoute = async ({ clientAddress }) => {
  const ip = clientAddress || "unknown";
  const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "unknown";
  if (!isLocal) {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden: seed is localhost-only" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const results: SeedResult[] = [];

    // 1. Quran verses — dedup on surah+ayah (but the /seed API only accepts string fields
    // for dedup; we'll dedup on `surah` and `ayah` separately which works since they're integers
    // stored as unique — actually let's just dedup on surah which is sufficient for first pass)
    // Actually the docs example uses ["email"] which is a string. Let me check if integer works.
    // The API returns "errors" array if dedupOn references non-existent fields. Let's just use
    // the upsert approach per-document to be safe.
    log.info({ count: QURAN_VERSES.length }, "Seeding quran_verses…");
    let qvInserted = 0, qvSkipped = 0, qvErrors: unknown[] = [];
    const quran = collections("quran_verses");
    for (const v of QURAN_VERSES) {
      try {
        // Use upsert to dedup on surah+ayah (composite filter)
        const r = await quran.upsert(
          { and: [
            { field: "surah", op: "eq", value: v.surah },
            { field: "ayah", op: "eq", value: v.ayah },
          ] },
          v,
        );
        if (r.created) qvInserted++; else qvSkipped++;
      } catch (e) {
        qvErrors.push({ surah: v.surah, ayah: v.ayah, error: e instanceof Error ? e.message : String(e) });
      }
    }
    results.push({ collection: "quran_verses", inserted: qvInserted, skipped: qvSkipped, errors: qvErrors });

    // 2. Hadiths — dedup on collection + hadithNumber
    log.info({ count: HADITHS.length }, "Seeding hadiths…");
    let hInserted = 0, hSkipped = 0, hErrors: unknown[] = [];
    const hadiths = collections("hadiths");
    for (const h of HADITHS) {
      try {
        const r = await hadiths.upsert(
          { and: [
            { field: "collection", op: "eq", value: h.collection },
            { field: "hadithNumber", op: "eq", value: h.hadithNumber },
          ] },
          h,
        );
        if (r.created) hInserted++; else hSkipped++;
      } catch (e) {
        hErrors.push({ collection: h.collection, hadithNumber: h.hadithNumber, error: e instanceof Error ? e.message : String(e) });
      }
    }
    results.push({ collection: "hadiths", inserted: hInserted, skipped: hSkipped, errors: hErrors });

    // 3. Adhkar — dedup on category + order
    log.info({ count: ADHKAR.length }, "Seeding adhkar…");
    let aInserted = 0, aSkipped = 0, aErrors: unknown[] = [];
    const adhkar = collections("adhkar");
    for (const a of ADHKAR) {
      try {
        const r = await adhkar.upsert(
          { and: [
            { field: "category", op: "eq", value: a.category },
            { field: "order", op: "eq", value: a.order },
          ] },
          a,
        );
        if (r.created) aInserted++; else aSkipped++;
      } catch (e) {
        aErrors.push({ category: a.category, order: a.order, error: e instanceof Error ? e.message : String(e) });
      }
    }
    results.push({ collection: "adhkar", inserted: aInserted, skipped: aSkipped, errors: aErrors });

    // 4. Reminders — dedup on title
    log.info({ count: REMINDERS.length }, "Seeding reminders…");
    let rInserted = 0, rSkipped = 0, rErrors: unknown[] = [];
    const reminders = collections("reminders");
    for (const r of REMINDERS) {
      try {
        const res = await reminders.upsert(
          { field: "title", op: "eq", value: r.title },
          r,
        );
        if (res.created) rInserted++; else rSkipped++;
      } catch (e) {
        rErrors.push({ title: r.title, error: e instanceof Error ? e.message : String(e) });
      }
    }
    results.push({ collection: "reminders", inserted: rInserted, skipped: rSkipped, errors: rErrors });

    // 5. Quran pages — dedup on pageNumber
    log.info({ count: QURAN_PAGES.length }, "Seeding quran_pages…");
    let pInserted = 0, pSkipped = 0, pErrors: unknown[] = [];
    const pages = collections("quran_pages");
    for (const p of QURAN_PAGES) {
      try {
        const res = await pages.upsert(
          { field: "pageNumber", op: "eq", value: p.pageNumber },
          p,
        );
        if (res.created) pInserted++; else pSkipped++;
      } catch (e) {
        pErrors.push({ pageNumber: p.pageNumber, error: e instanceof Error ? e.message : String(e) });
      }
    }
    results.push({ collection: "quran_pages", inserted: pInserted, skipped: pSkipped, errors: pErrors });

    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const healthy = totalErrors === 0;

    log.info({ totalInserted, totalSkipped, totalErrors, healthy }, "Seed complete");

    return new Response(JSON.stringify({
      ok: healthy,
      totals: { inserted: totalInserted, skipped: totalSkipped, errors: totalErrors },
      results,
    }), {
      status: healthy ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error({ err: e }, "Seed failed");
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const GET: APIRoute = async (ctx) => POST(ctx);
