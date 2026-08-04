/**
 * DELETE /api/admin/posts/[id]  — delete a scheduled post (if not yet published)
 * PATCH  /api/admin/posts/[id]  — update (only if status=draft or scheduled)
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections, LightbaseError } from "@/lib/lightbase/client";
import { recordAudit } from "@/lib/admin/audit";
import { z } from "zod";

const posts = collections("posts");

const UpdateSchema = z.object({
  caption: z.string().max(5000).optional(),
  channelTargets: z.array(z.string()).optional(),
  scheduledFor: z.string().optional(),
  status: z.enum(["draft", "scheduled", "archived"]).optional(),
});

export const DELETE: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;
  const id = ctx.params.id;
  if (!id) return new Response("Not found", { status: 404 });
  try {
    const before = await posts.get(id).catch(() => null);
    if (before && (before as any).status === "published") {
      return new Response(JSON.stringify({ ok: false, error: "Cannot delete a published post (archive instead)" }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }
    await posts.delete(id);
    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "post.delete",
      target: id,
      before,
      ip: ctx.clientAddress || "unknown",
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
    const before = await posts.get(id).catch(() => null);
    if (before && (before as any).status === "published" && parsed.data.status !== "archived") {
      return new Response(JSON.stringify({ ok: false, error: "Cannot modify a published post" }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }
    const doc = await posts.update(id, parsed.data);
    await recordAudit({
      actor: ctx.locals.adminEmail ?? "admin",
      action: "post.update",
      target: id,
      before,
      after: parsed.data,
      ip: ctx.clientAddress || "unknown",
    });
    return new Response(JSON.stringify({ ok: true, post: doc }), {
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
