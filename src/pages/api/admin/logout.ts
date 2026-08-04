/**
 * POST /api/admin/logout
 * Clears the session cookie.
 */
import type { APIRoute } from "astro";
import { clearSessionCookie, readSessionFromRequest } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const session = await readSessionFromRequest(request);
  if (session) {
    await recordAudit({
      actor: session.email,
      action: "admin.logout",
      ip: clientAddress || "unknown",
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
};
