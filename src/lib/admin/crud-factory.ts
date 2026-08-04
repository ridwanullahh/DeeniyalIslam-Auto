/**
 * Generic content CRUD factory.
 * Used by hadith, adhkar, reminders (and any future simple content type)
 * to generate GET/POST/PATCH/DELETE handlers with shared audit + error handling.
 *
 * The Quran module has its own dedicated endpoints because its filters are
 * more complex (surah+ayah). For others this factory is sufficient.
 */
import type { APIRoute } from "astro";
import { collections, LightbaseError, type FilterExpr } from "@/lib/lightbase/client";
import { recordAudit } from "@/lib/admin/audit";
import { z, type ZodObject, type ZodRawShape } from "zod";

export interface CrudConfig<T extends ZodRawShape> {
  collection: string;
  auditPrefix: string;
  shape: T;
  searchableFields: string[];
  filterFields?: Record<string, (value: string) => FilterExpr>;
  sort?: string;
}

export function makeCrudHandlers<T extends ZodRawShape>(cfg: CrudConfig<T>) {
  const coll = collections(cfg.collection);
  const CreateSchema = z.object(cfg.shape);
  const UpdateSchema = z.object(cfg.shape).partial();

  const list: APIRoute = async ({ url }) => {
    const params = url.searchParams;
    const search = params.get("search")?.trim() || "";
    const limit = Math.min(Number(params.get("limit") ?? "25"), 100);
    const after = params.get("after") || undefined;

    const filters: FilterExpr[] = [];
    if (search && cfg.searchableFields.length > 0) {
      const orClauses: FilterExpr[] = cfg.searchableFields.map((f) => ({
        field: f,
        op: "search",
        value: search,
      }));
      filters.push({ or: orClauses });
    }
    if (cfg.filterFields) {
      for (const [key, builder] of Object.entries(cfg.filterFields)) {
        const v = params.get(key);
        if (v) filters.push(builder(v));
      }
    }
    const filter: FilterExpr | undefined = filters.length === 0 ? undefined
      : filters.length === 1 ? filters[0]
      : { and: filters };

    try {
      const result = await coll.list({
        filter,
        sort: cfg.sort,
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

  const create: APIRoute = async ({ request, locals, clientAddress }) => {
    let body: unknown;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    try {
      const doc = await coll.insert(parsed.data);
      await recordAudit({
        actor: locals.adminEmail ?? "admin",
        action: `${cfg.auditPrefix}.create`,
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

  const get: APIRoute = async ({ params }) => {
    const id = params.id;
    if (!id) return new Response("Not found", { status: 404 });
    try {
      const doc = await coll.get(id);
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

  const update: APIRoute = async ({ params, request, locals, clientAddress }) => {
    const id = params.id;
    if (!id) return new Response("Not found", { status: 404 });
    let body: unknown;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    try {
      const before = await coll.get(id).catch(() => null);
      const doc = await coll.update(id, parsed.data);
      await recordAudit({
        actor: locals.adminEmail ?? "admin",
        action: `${cfg.auditPrefix}.update`,
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

  const remove: APIRoute = async ({ params, request, locals, clientAddress }) => {
    const id = params.id;
    if (!id) return new Response("Not found", { status: 404 });
    try {
      const before = await coll.get(id).catch(() => null);
      await coll.delete(id);
      await recordAudit({
        actor: locals.adminEmail ?? "admin",
        action: `${cfg.auditPrefix}.delete`,
        target: id,
        before,
        ip: clientAddress || "unknown",
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return new Response(JSON.stringify({ ok: true }), {
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

  return { list, create, get, update, remove };
}
