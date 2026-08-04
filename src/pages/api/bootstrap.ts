/**
 * POST /api/_bootstrap
 * Internal endpoint that creates all missing collections + the media bucket
 * in the configured Lightbase project. Idempotent — safe to call repeatedly.
 *
 * Security: only callable from localhost OR with a valid admin session.
 * Once auth is fully wired, callers should use the admin-protected
 * /api/admin/bootstrap endpoint instead.
 */
import type { APIRoute } from "astro";
import { bootstrap } from "@/lib/lightbase/bootstrap";
import { logger } from "@/lib/logger";

const log = logger("api:_bootstrap");

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || "unknown";
  // Allow only loopback or trusted proxies to call this unprotected endpoint.
  const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "unknown";
  if (!isLocal) {
    log.warn({ ip }, "Bootstrap attempt from non-local IP rejected");
    return new Response(
      JSON.stringify({ ok: false, error: "Forbidden: bootstrap is localhost-only" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const result = await bootstrap();
    log.info({ result }, "Bootstrap complete");
    return new Response(JSON.stringify({ ok: result.healthy, result }), {
      status: result.healthy ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error({ err: e }, "Bootstrap failed");
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const GET: APIRoute = async ({ clientAddress }) => {
  const ip = clientAddress || "unknown";
  const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "unknown";
  if (!isLocal) {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  // GET also triggers bootstrap (for easy curl testing)
  try {
    const result = await bootstrap();
    return new Response(JSON.stringify({ ok: result.healthy, result }), {
      status: result.healthy ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
