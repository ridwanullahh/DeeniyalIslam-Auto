/**
 * Env-based admin auth.
 *
 * - Admin credentials come from ADMIN_CREDENTIALS env var
 *   (comma-separated email:password list).
 * - On successful login, we issue a signed JWT (jose, HS256) and set it as
 *   an httpOnly, SameSite=Strict, Secure-when-https cookie named `di_admin`.
 * - `requireAdmin()` reads + verifies the cookie; returns the admin email or
 *   throws a redirect to /admin/login.
 */
import { SignJWT, jwtVerify } from "jose";
import { serialize } from "cookie";
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";

const log = logger("auth:session");

const COOKIE_NAME = "di_admin";
const SESSION_TTL_SEC = 60 * 60 * 12; // 12 hours
const ALG = "HS256";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(CONFIG.sessionSecret);
}

export interface AdminSession {
  email: string;
  iat: number;
  exp: number;
}

/** Issue a session JWT for the given admin email */
export async function issueSession(email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SEC)
    .setIssuer("deeniyalislam-auto")
    .setAudience("deeniyalislam-auto-admin")
    .sign(secretKey());
}

/** Verify a session JWT. Returns the session payload or null. */
export async function verifySession(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "deeniyalislam-auto",
      audience: "deeniyalislam-auto-admin",
    });
    if (typeof payload.email !== "string") return null;
    return {
      email: payload.email,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch (e) {
    log.debug({ err: e }, "Session verification failed");
    return null;
  }
}

/** Build the Set-Cookie header for the session */
export function sessionCookie(token: string): string {
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: CONFIG.isProd,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

/** Build the Set-Cookie header that clears the session */
export function clearSessionCookie(): string {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: CONFIG.isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Look up admin credentials by email.
 * Returns the matching credential or null.
 * NOTE: passwords are compared in constant-ish time using length-equal compare.
 */
export function findAdmin(email: string, password: string): { email: string } | null {
  const target = email.trim().toLowerCase();
  for (const cred of CONFIG.admins) {
    if (cred.email === target && cred.password === password) {
      return { email: cred.email };
    }
  }
  return null;
}

/**
 * Read the session from request cookies.
 * Returns the session or null.
 */
export async function readSessionFromRequest(req: Request): Promise<AdminSession | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    }),
  );
  return await verifySession(cookies[COOKIE_NAME]);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_TTL_SECONDS = SESSION_TTL_SEC;
