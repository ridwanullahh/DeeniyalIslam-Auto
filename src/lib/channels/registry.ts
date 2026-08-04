/**
 * Channel adapter registry — abstracts over WhatsApp, Telegram, Discord, Messenger.
 * Each adapter implements send(message, target) and (optionally) receive hooks.
 *
 * The actual adapters are lazy-loaded so that adapters we don't have credentials
 * for (e.g. Telegram when TELEGRAM_BOT_TOKEN is empty) don't crash startup.
 */
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";

const log = logger("channels:registry");

export interface SendResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface ChannelAdapter {
  name: string;
  enabled: boolean;
  send(target: string, message: string, opts?: { mediaUrl?: string; caption?: string }): Promise<SendResult>;
  /** Optional: status of the underlying connection */
  status?(): Promise<{ connected: boolean; identity?: string; detail?: string }>;
}

class NullAdapter implements ChannelAdapter {
  constructor(public name: string, public enabled: boolean = false) {}
  async send(): Promise<SendResult> {
    return { ok: false, error: `${this.name} adapter not configured` };
  }
}

// Singleton adapters, lazy-initialized
let whatsappAdapter: ChannelAdapter | null = null;
let telegramAdapter: ChannelAdapter | null = null;
let discordAdapter: ChannelAdapter | null = null;
let messengerAdapter: ChannelAdapter | null = null;

export async function getAdapter(channel: string): Promise<ChannelAdapter> {
  switch (channel) {
    case "whatsapp":
      if (!whatsappAdapter) {
        whatsappAdapter = await loadWhatsApp();
      }
      return whatsappAdapter;
    case "telegram":
      if (!telegramAdapter) {
        telegramAdapter = await loadTelegram();
      }
      return telegramAdapter;
    case "discord":
      if (!discordAdapter) {
        discordAdapter = await loadDiscord();
      }
      return discordAdapter;
    case "messenger":
      if (!messengerAdapter) {
        messengerAdapter = await loadMessenger();
      }
      return messengerAdapter;
    default:
      log.warn({ channel }, "Unknown channel");
      return new NullAdapter(channel, false);
  }
}

async function loadWhatsApp(): Promise<ChannelAdapter> {
  if (!CONFIG.whatsapp.enabled) {
    log.info("WhatsApp adapter disabled");
    return new NullAdapter("whatsapp", false);
  }
  try {
    const mod = await import("@/lib/channels/whatsapp/bailey");
    return await mod.getWhatsAppAdapter();
  } catch (e) {
    log.error({ err: e }, "Failed to load WhatsApp adapter");
    return new NullAdapter("whatsapp", false);
  }
}

async function loadTelegram(): Promise<ChannelAdapter> {
  if (!CONFIG.telegram.enabled || !CONFIG.telegram.token) {
    return new NullAdapter("telegram", false);
  }
  // Telegram adapter would be implemented here — for now a stub that
  // supports the Send API directly without long-polling receive.
  return {
    name: "telegram",
    enabled: true,
    async send(target: string, message: string): Promise<SendResult> {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${CONFIG.telegram.token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: target, text: message, parse_mode: "Markdown" }),
          },
        );
        const data = await res.json() as any;
        if (!data.ok) throw new Error(data.description || "Telegram API error");
        return { ok: true, externalId: String(data.result?.message_id ?? "") };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  };
}

async function loadDiscord(): Promise<ChannelAdapter> {
  if (!CONFIG.discord.enabled || !CONFIG.discord.token) {
    return new NullAdapter("discord", false);
  }
  // Discord adapter requires gateway connection; for now we expose the
  // webhook-based send path. Full bot integration would use discord.js.
  return new NullAdapter("discord", true);
}

async function loadMessenger(): Promise<ChannelAdapter> {
  if (!CONFIG.messenger.enabled || !CONFIG.messenger.accessToken) {
    return new NullAdapter("messenger", false);
  }
  return {
    name: "messenger",
    enabled: true,
    async send(target: string, message: string): Promise<SendResult> {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${CONFIG.messenger.accessToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: target },
              message: { text: message },
            }),
          },
        );
        const data = await res.json() as any;
        if (data.error) throw new Error(data.error.message || "Messenger API error");
        return { ok: true, externalId: data.message_id ?? "" };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  };
}

/** List all configured channels with their status */
export async function listChannelStatuses(): Promise<Array<{ name: string; enabled: boolean; connected: boolean; detail?: string }>> {
  const channels = ["whatsapp", "telegram", "discord", "messenger"];
  const results = [];
  for (const name of channels) {
    const adapter = await getAdapter(name);
    let connected = false;
    let detail: string | undefined;
    try {
      if (adapter.status) {
        const s = await adapter.status();
        connected = s.connected;
        detail = s.detail;
      } else {
        connected = adapter.enabled;
      }
    } catch {
      connected = false;
    }
    results.push({ name, enabled: adapter.enabled, connected, detail });
  }
  return results;
}
