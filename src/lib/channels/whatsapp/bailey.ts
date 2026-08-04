/**
 * Bailey (WhatsApp) adapter.
 *
 * Connects to WhatsApp Web via @whiskeysockets/baileys. Persists auth state to
 * disk so reconnections don't require re-pairing. Exposes a send() method and
 * handles incoming messages (subscribe / unsubscribe / help / verse / etc.).
 *
 * On first run, emits a QR code that the admin scans via /admin/channels/whatsapp.
 */
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
  type BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { promises as fs } from "node:fs";
import path from "node:path";
import pino from "pino";
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";
import { collections } from "@/lib/lightbase/client";
import type { ChannelAdapter, SendResult } from "@/lib/channels/registry";
import { handleIncomingMessage } from "@/lib/channels/whatsapp/handlers";

const log = logger("channels:whatsapp");

let sock: WASocket | null = null;
let currentQr: string | null = null;
let lastConnectionState: { connected: boolean; identity?: string; detail?: string } = {
  connected: false,
};

const AUTH_DIR = path.join(process.cwd(), `.auth_state-${CONFIG.whatsapp.sessionId}`);

export async function getWhatsAppAdapter(): Promise<ChannelAdapter> {
  if (!sock) {
    await connect();
  }
  return {
    name: "whatsapp",
    enabled: true,
    async send(target: string, message: string): Promise<SendResult> {
      if (!sock) {
        return { ok: false, error: "WhatsApp not connected" };
      }
      try {
        const jid = target.replace(/[^\d]/g, "");
        const recipient = jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
        const sent = await sock.sendMessage(recipient, { text: message });
        return { ok: true, externalId: sent?.key?.id };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    async status() {
      return lastConnectionState;
    },
  };
}

export function getCurrentQr(): string | null {
  return currentQr;
}

export async function connect(): Promise<void> {
  try {
    await fs.mkdir(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    log.info({ version, isLatest }, "Starting WhatsApp socket");

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      // Use a minimal pino logger — baileys expects one
      logger: pino({ level: "warn", name: "baileys" }),
      browser: ["DeeniyalIslam Auto", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: BaileysEventMap["connection.update"]) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        currentQr = qr;
        lastConnectionState = { connected: false, detail: "Awaiting QR scan" };
        log.info("QR code generated — admin must scan at /admin/channels/whatsapp");
      }
      if (connection === "close") {
        currentQr = null;
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        lastConnectionState = { connected: false, detail: `Closed (code ${code})` };
        log.warn({ code, shouldReconnect }, "Connection closed");
        if (shouldReconnect) {
          sock = null;
          setTimeout(() => connect().catch((e) => log.error({ err: e }, "Reconnect failed")), 3000);
        }
      } else if (connection === "open") {
        currentQr = null;
        const identity = sock?.user?.id ?? "unknown";
        lastConnectionState = { connected: true, identity, detail: `Connected as ${identity}` };
        log.info({ identity }, "WhatsApp connected");
        try {
          await collections("bot_sessions").upsert(
            { field: "channel", op: "eq", value: "whatsapp" },
            {
              channel: "whatsapp",
              identity,
              status: "connected",
              lastSeenAt: new Date().toISOString(),
              meta: { version },
            },
          );
        } catch (e) {
          log.error({ err: e }, "Failed to persist bot session");
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const from = msg.key.remoteJid ?? "";
        if (from.endsWith("@g.us")) continue;
        const text = msg.message.conversation
          ?? msg.message.extendedTextMessage?.text
          ?? msg.message.imageMessage?.caption
          ?? "";
        if (typeof text !== "string" || !text.trim()) continue;
        try {
          await handleIncomingMessage(from, text.trim(), await getWhatsAppAdapter());
        } catch (e) {
          log.error({ err: e, from }, "Handler failed for incoming message");
        }
      }
    });
  } catch (e) {
    log.error({ err: e }, "WhatsApp connect failed");
    lastConnectionState = { connected: false, detail: `Error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export function isWhatsAppConnected(): boolean {
  return lastConnectionState.connected;
}

export function getWhatsAppStatus() {
  return lastConnectionState;
}
