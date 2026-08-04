/**
 * DeeniyalIslam Auto — Centralized environment configuration.
 * Loads .env via dotenv and exposes typed, validated values.
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import "dotenv/config";

const env = process.env;

function required(key: string, fallback?: string): string {
  const v = env[key] ?? fallback;
  if (!v) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

function opt(key: string, fallback = ""): string {
  return env[key] ?? fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const v = env[key]?.toLowerCase().trim();
  if (!v) return fallback;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function int(key: string, fallback: number): number {
  const v = Number(env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Parsed admin credentials from ADMIN_CREDENTIALS env var */
export interface AdminCredential {
  email: string;
  /** Plaintext or hash; we accept both and detect at compare time */
  password: string;
}

function parseAdminCredentials(raw: string): AdminCredential[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) {
        throw new Error(
          `Invalid ADMIN_CREDENTIALS entry "${pair}". Expected format: email:password`,
        );
      }
      return {
        email: pair.slice(0, idx).trim().toLowerCase(),
        password: pair.slice(idx + 1).trim(),
      };
    });
}

/** Brand palette (default values match the spec) */
export const BRAND = {
  primary: opt("BRAND_PRIMARY", "#05B34D"),
  accent: opt("BRAND_ACCENT", "#F2B91C"),
  dark: opt("BRAND_DARK", "#181F25"),
  lightBg: opt("BRAND_LIGHT_BG", "#E9FBF1"),
  white: opt("BRAND_WHITE", "#FFFFFF"),
};

export const CONFIG = {
  appName: opt("APP_NAME", "DeeniyalIslam Auto"),
  appUrl: opt("APP_URL", "http://localhost:4321"),
  nodeEnv: opt("NODE_ENV", "development"),
  isProd: opt("NODE_ENV", "development") === "production",
  sessionSecret: required("SESSION_SECRET", "dev_insecure_secret_replace_in_prod"),
  trustedProxies: opt("TRUSTED_PROXIES", "127.0.0.1,::1")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  admins: parseAdminCredentials(opt("ADMIN_CREDENTIALS", "")),

  lightbase: {
    baseUrl: required(
      "LIGHTBASE_BASE_URL",
      "http://lightbase.80.225.189.74.sslip.io",
    ).replace(/\/$/, ""),
    apiKey: required("LIGHTBASE_API_KEY", ""),
    projectId: required("LIGHTBASE_PROJECT_ID", "deeniyalislam-auto"),
    tenant: opt("LIGHTBASE_TENANT", "default"),
    bucket: opt("LIGHTBASE_BUCKET", "deeniyalislam-media"),
  },

  whatsapp: {
    enabled: bool("WHATSAPP_ENABLED", false),
    sessionId: opt("WHATSAPP_SESSION_ID", "deeniyalislam-auto"),
  },

  telegram: {
    enabled: bool("TELEGRAM_ENABLED", false),
    token: opt("TELEGRAM_BOT_TOKEN", ""),
  },

  discord: {
    enabled: bool("DISCORD_ENABLED", false),
    token: opt("DISCORD_BOT_TOKEN", ""),
  },

  messenger: {
    enabled: bool("MESSENGER_ENABLED", false),
    appSecret: opt("MESSENGER_APP_SECRET", ""),
    accessToken: opt("MESSENGER_ACCESS_TOKEN", ""),
    verifyToken: opt("MESSENGER_VERIFY_TOKEN", ""),
  },

  scheduler: {
    enabled: bool("SCHEDULER_ENABLED", true),
    pollIntervalSec: int("SCHEDULER_POLL_INTERVAL_SEC", 30),
  },

  logLevel: opt("LOG_LEVEL", "info"),
} as const;

export type AppConfig = typeof CONFIG;
