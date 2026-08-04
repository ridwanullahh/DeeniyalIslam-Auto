/**
 * Astro middleware — runs before every request.
 *
 * - Protects all /admin/* routes (except /admin/login) with session auth.
 * - Adds security headers to every response.
 * - Resolves the client IP from X-Forwarded-For when behind a trusted proxy.
 */
import { defineMiddleware } from "astro:middleware";
import { verifySession } from "@/lib/auth/session";
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";

const log = logger("middleware");

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/bootstrap",
  "/api/seed",
]);

const SESSION_COOKIE = "di_admin";

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { url, request } = ctx;
  const path = url.pathname;

  // 1. Admin route protection
  const isAdminRoute = path.startsWith("/admin") || path.startsWith("/api/admin");
  if (isAdminRoute && !PUBLIC_ADMIN_PATHS.has(path)) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      }),
    );
    const session = await verifySession(cookies[SESSION_COOKIE]);
    if (!session) {
      // For API routes, return 401 JSON; for pages, redirect to login
      if (path.startsWith("/api/")) {
        return new Response(
          JSON.stringify({ ok: false, error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      return ctx.redirect("/admin/login", 302);
    }
    // Attach session to locals for downstream use
    ctx.locals.adminEmail = session.email;
  }

  // 2. Call the next handler
  const response = await next();

  // 3. Security headers — added to every response
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (CONFIG.isProd) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  // Cache-control for static assets is handled by the adapter; here we just
  // ensure API responses are never cached.
  if (path.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-transform");
  }

  return response;
});

declare global {
  namespace App {
    interface Locals {
      adminEmail?: string;
    }
  }
}
