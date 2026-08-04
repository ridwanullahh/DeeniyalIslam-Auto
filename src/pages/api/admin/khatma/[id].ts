/**
 * GET   /api/admin/khatma/[id]   — get khatma details
 * PATCH /api/admin/khatma/[id]   — update khatma (status, name)
 * DELETE /api/admin/khatma/[id]  — abandon khatma
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, LightbaseError } from "@/lib/lightbase/client";
import { updateKhatmaStatus } from "@/lib/khatma/engine";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";

const khatmaSubs = collections("khatma_subscriptions");

const UpdateSchema = z.object({
  status: z.enum(["active", "paused", "abandoned"]).optional(),
  name: z.string().max(120).optional(),
});

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;
  const id = ctx.params.id;
  if (!id) return new Response("Not found", { status: 404 });
  try {
    const doc = await khatmaSubs.get(id);
    return new Response(JSON.stringify({ ok: true, khatma: doc }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof LightbaseError && (e.status === 404 || e.code === "not_found")) {
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;
  const id = ctx.params.id;
  if (!id) return new Response("Not found", { status: 404 });

  let body: unknown;
  try { body = await ctx.request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: "Validation failed" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const before = await khatmaSubs.get(id).catch(() => null);
    if (parsed.data.status) {
      const ok = await updateKhatmaStatus(id, parsed.data.status);
      if (!ok) return new Response(JSON.stringify({ ok: false, error: "Failed to update status" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
    if (parsed.data.name) {
      await khatmaSubs.update(id, { name: parsed.data.name, updatedAt: new Date().toISOString() });
    }
    const after = await khatmaSubs.get(id);
    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "khatma.update",
      target: id,
      before,
      after: parsed.data,
      ip: ctx.clientAddress || "unknown",
    });
    return new Response(JSON.stringify({ ok: true, khatma: after }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;
  const id = ctx.params.id;
  if (!id) return new Response("Not found", { status: 404 });
  try {
    const before = await khatmaSubs.get(id).catch(() => null);
    await updateKhatmaStatus(id, "abandoned");
    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "khatma.abandon",
      target: id,
      before,
      ip: ctx.clientAddress || "unknown",
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
