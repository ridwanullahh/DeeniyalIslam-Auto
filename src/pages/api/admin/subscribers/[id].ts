/**
 * PATCH /api/admin/subscribers/[id]
 * Update subscriber status (active, paused, unsubscribed, blacklisted)
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, LightbaseError } from "@/lib/lightbase/client";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";

const subscribers = collections("subscribers");
const subscriptions = collections("subscriptions");

const UpdateSchema = z.object({
  status: z.enum(["active", "paused", "unsubscribed", "blacklisted"]).optional(),
  name: z.string().max(120).optional(),
  timezone: z.string().optional(),
  language: z.enum(["en", "ar", "fr", "ha", "yo", "sw"]).optional(),
});

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
    const before = await subscribers.get(id).catch(() => null);
    const doc = await subscribers.update(id, parsed.data);
    // If status changed to unsubscribed/blacklisted, archive subscriptions
    if (parsed.data.status && parsed.data.status !== "active") {
      const subs = await subscriptions.list({
        filter: { and: [
          { field: "subscriberId", op: "eq", value: id },
          { field: "status", op: "eq", value: "active" },
        ] },
        limit: 100,
      });
      await Promise.all(subs.data.map((s) => subscriptions.update(s.id, { status: "archived" })));
    }
    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "subscriber.update",
      target: id,
      before,
      after: parsed.data,
      ip: ctx.clientAddress || "unknown",
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
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
