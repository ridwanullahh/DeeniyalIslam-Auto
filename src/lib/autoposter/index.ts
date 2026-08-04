/**
 * Autoposter — global broadcast to channels + public site + WhatsApp Status.
 *
 * Processes due posts (status=scheduled, scheduledFor <= now) and publishes
 * them to all configured channelTargets. Targets include:
 *   - whatsapp_status: post to the bot's WhatsApp Status (24h story)
 *   - telegram: post to the configured Telegram channel
 *   - discord: post to the configured Discord webhook/channel
 *   - messenger: post to the configured Facebook Page
 *   - site_home: render as the daily featured content on the public home
 *
 * Records each execution in autopost_log.
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import { collections } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";
import { recordChannelSend } from "@/lib/guardrails";
import { getWhatsAppSocket } from "@/lib/channels/whatsapp/bailey";
import { CONFIG } from "@/config";

const log = logger("autoposter");

const posts = collections("posts");
const autopostLog = collections("autopost_log");
const quran = collections("quran_verses");
const hadiths = collections("hadiths");
const adhkar = collections("adhkar");
const reminders = collections("reminders");

export interface AutopostBatch {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

export async function processDueAutoposts(): Promise<AutopostBatch> {
  const now = new Date().toISOString();
  const result: AutopostBatch = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  let due;
  try {
    due = await posts.list({
      filter: { and: [
        { field: "status", op: "eq", value: "scheduled" },
        { field: "scheduledFor", op: "lte", value: now },
      ] },
      limit: 20,
      sort: "scheduledFor:asc",
    });
  } catch (e) {
    log.error({ err: e }, "Failed to fetch due autoposts");
    return result;
  }

  for (const post of due.data) {
    result.processed++;
    try {
      await posts.update(post.id, { status: "publishing" });
      const r = await publishPost(post as any);
      if (r.anySent) {
        result.sent++;
        await posts.update(post.id, {
          status: "published",
          publishedAt: new Date().toISOString(),
          externalIds: r.externalIds,
        });
      } else {
        result.failed++;
        await posts.update(post.id, {
          status: "failed",
          error: r.errors.join("; ").slice(0, 1000),
        });
      }
    } catch (e) {
      result.failed++;
      log.error({ err: e, postId: post.id }, "Autopost failed");
      await posts.update(post.id, {
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      }).catch(() => {});
    }
  }
  return result;
}

interface PublishResult {
  anySent: boolean;
  externalIds: Record<string, string>;
  errors: string[];
}

async function publishPost(post: any): Promise<PublishResult> {
  const externalIds: Record<string, string> = {};
  const errors: string[] = [];
  const targets: string[] = post.channelTargets ?? [];

  const content = await fetchContent(post.contentType, post.refId);
  if (!content) {
    return { anySent: false, externalIds, errors: ["content_not_found"] };
  }
  const message = formatAutopost(post, content);

  for (const target of targets) {
    try {
      const r = await publishToTarget(target, post, message, content);
      if (r.ok) {
        externalIds[target] = r.externalId ?? "";
        await autopostLog.insert({
          postId: post.id,
          channel: target,
          status: "sent",
          externalId: r.externalId ?? null,
          attemptedAt: new Date().toISOString(),
        });
        recordChannelSend(target);
      } else {
        errors.push(`${target}: ${r.error}`);
        await autopostLog.insert({
          postId: post.id,
          channel: target,
          status: "failed",
          attemptedAt: new Date().toISOString(),
          error: r.error,
        });
      }
    } catch (e) {
      errors.push(`${target}: ${e instanceof Error ? e.message : String(e)}`);
      await autopostLog.insert({
        postId: post.id,
        channel: target,
        status: "failed",
        attemptedAt: new Date().toISOString(),
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    anySent: Object.keys(externalIds).length > 0,
    externalIds,
    errors,
  };
}

async function publishToTarget(
  target: string,
  post: any,
  message: string,
  content: any,
): Promise<{ ok: boolean; externalId?: string; error?: string }> {
  switch (target) {
    case "whatsapp_status": {
      return await sendWhatsAppStatus(message, content);
    }
    case "telegram": {
      if (!CONFIG.telegram.enabled) return { ok: false, error: "Telegram not enabled" };
      try {
        const res = await fetch(`https://api.telegram.org/bot${CONFIG.telegram.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: post.meta?.telegramChannel ?? "@deeniyalislam",
            text: message,
            parse_mode: "Markdown",
          }),
        });
        const data = await res.json() as any;
        if (!data.ok) return { ok: false, error: data.description };
        return { ok: true, externalId: String(data.result?.message_id ?? "") };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
    case "discord": {
      if (!CONFIG.discord.enabled) return { ok: false, error: "Discord not enabled" };
      const webhookUrl = post.meta?.discordWebhookUrl;
      if (!webhookUrl) return { ok: false, error: "No Discord webhook URL configured" };
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        });
        if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
    case "messenger": {
      if (!CONFIG.messenger.enabled) return { ok: false, error: "Messenger not enabled" };
      try {
        const pageId = post.meta?.messengerPageId;
        const res = await fetch(`https://graph.facebook.com/v18.0/${pageId ?? "me"}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            access_token: CONFIG.messenger.accessToken,
          }),
        });
        const data = await res.json() as any;
        if (data.error) return { ok: false, error: data.error.message };
        return { ok: true, externalId: data.id ?? "" };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
    case "site_home":
    case "site_widget": {
      return { ok: true, externalId: post.id };
    }
    default:
      return { ok: false, error: `Unknown target: ${target}` };
  }
}

/**
 * Post to WhatsApp Status (24-hour story). Bailey supports this via the
 * `status@broadcast` JID.
 *
 * WhatsApp Status has its own ToS considerations:
 *   - Status updates disappear after 24 hours
 *   - Contacts must have the bot's number saved to see the status
 *   - Don't post more than a few status updates per day
 */
async function sendWhatsAppStatus(message: string, content: any): Promise<{ ok: boolean; externalId?: string; error?: string }> {
  const sock = getWhatsAppSocket();
  if (!sock) return { ok: false, error: "WhatsApp not connected" };

  try {
    if (content.imageUrl || content.image_url) {
      const imageUrl = content.imageUrl || content.image_url;
      const caption = message;
      const sent = await sock.sendMessage("status@broadcast", {
        image: { url: imageUrl },
        caption,
      });
      return { ok: true, externalId: sent?.key?.id };
    }
    const sent = await sock.sendMessage("status@broadcast", {
      text: message,
    });
    return { ok: true, externalId: sent?.key?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function fetchContent(contentType: string, refId: string): Promise<any> {
  try {
    switch (contentType) {
      case "quran_verse": return await quran.get(refId);
      case "hadith": return await hadiths.get(refId);
      case "adhkar": return await adhkar.get(refId);
      case "reminder": return await reminders.get(refId);
      default: return null;
    }
  } catch {
    return null;
  }
}

function formatAutopost(post: any, content: any): string {
  const caption = post.caption?.trim();
  switch (post.contentType) {
    case "quran_verse":
      return [
        caption ? `*${caption}*\n` : "",
        `*Surah ${content.surahNameEn} — ${content.surah}:${content.ayah}*`,
        "",
        content.arabic,
        "",
        content.translation,
        content.transliteration ? `\n_${content.transliteration}_` : "",
        `\n— ${content.source ?? "Saheeh International"}`,
      ].filter(Boolean).join("\n");
    case "hadith":
      return [
        caption ? `*${caption}*\n` : "",
        `*${content.collection} #${content.hadithNumber}*${content.grade ? " [" + content.grade + "]" : ""}`,
        content.narratorEn ? `Narrated by ${content.narratorEn}\n` : "",
        content.textAr,
        "",
        content.textEn,
        content.source ? `\n— ${content.source}` : "",
      ].filter(Boolean).join("\n");
    case "adhkar":
      return [
        caption ? `*${caption}*\n` : "",
        `*${content.category} Dhikr — repeat ×${content.repeatCount}*`,
        "",
        content.arabic,
        "",
        content.transliteration ?? "",
        "",
        content.translation,
        content.source ? `\n— ${content.source}` : "",
      ].filter(Boolean).join("\n");
    case "reminder":
      return [
        caption ? `*${caption}*\n` : "",
        `*${content.title}*`,
        "",
        content.body,
        content.source ? `\n— ${content.source}` : "",
      ].filter(Boolean).join("\n");
    default:
      return caption ?? JSON.stringify(content);
  }
}
