/**
 * GET /api/admin/channels — channel statuses + scheduler status
 * POST /api/admin/channels/whatsapp/reconnect — reconnect WhatsApp bot
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listChannelStatuses } from "@/lib/channels/registry";
import { getSchedulerStatus } from "@/lib/scheduler/engine";
import { getWhatsAppStatus } from "@/lib/channels/whatsapp/bailey";

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  const channels = await listChannelStatuses();
  const scheduler = getSchedulerStatus();
  const whatsapp = getWhatsAppStatus();

  return new Response(JSON.stringify({
    ok: true,
    channels,
    scheduler,
    whatsapp,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  const action = new URL(ctx.request.url).searchParams.get("action");
  if (action === "reconnect-whatsapp") {
    try {
      const { connect } = await import("@/lib/channels/whatsapp/bailey");
      connect().catch(() => {});
      return new Response(JSON.stringify({ ok: true, message: "Reconnecting WhatsApp" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: false, error: "Unknown action" }), {
    status: 400, headers: { "Content-Type": "application/json" },
  });
};
