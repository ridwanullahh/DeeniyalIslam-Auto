/**
 * requireAdmin — Astro middleware helper for admin-only routes.
 *
 * Usage in a page or API route:
 *   const admin = await requireAdmin(Astro);
 *   if (admin instanceof Response) return admin;
 *   // admin.email is now available
 */
import type { APIContext } from "astro";
import { readSessionFromRequest } from "@/lib/auth/session";
import { CONFIG } from "@/config";

export interface AdminUser {
  email: string;
}

/**
 * Returns the admin user if authenticated, or a Response (redirect for pages,
 * 401 JSON for APIs) if not. Callers MUST check `instanceof Response`.
 */
export async function requireAdmin(
  ctx: APIContext,
  opts: { api?: boolean; redirect?: string } = {},
): Promise<AdminUser | Response> {
  const session = await readSessionFromRequest(ctx.request);
  if (!session) {
    if (opts.api) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const redirectTo = opts.redirect ?? "/admin/login";
    return ctx.redirect(redirectTo, 302);
  }
  return { email: session.email };
}

/** Convenience: returns true if the request is from an authenticated admin */
export async function isAdmin(ctx: APIContext): Promise<boolean> {
  const session = await readSessionFromRequest(ctx.request);
  return session !== null;
}

/** List configured admins (env-defined; read-only) */
export function listConfiguredAdmins(): string[] {
  return CONFIG.admins.map((a) => a.email);
}
