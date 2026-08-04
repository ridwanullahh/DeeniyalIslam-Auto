/**
 * WhatsApp incoming message handlers.
 *
 * Supported commands (case-insensitive, leading ! optional):
 *   - subscribe / start / begin — onboard via WhatsApp
 *   - unsubscribe / stop / cancel — opt out
 *   - help — list commands
 *   - verse — get a random Quran verse
 *   - hadith — get a random hadith
 *   - dhikr — get a random dhikr
 *   - status — show subscription status
 *
 * Unknown messages fall back to a help response.
 */
import { collections } from "@/lib/lightbase/client";
import type { ChannelAdapter } from "@/lib/channels/registry";
import { logger } from "@/lib/logger";

const log = logger("whatsapp:handlers");

const subscribers = collections("subscribers");
const subscriptions = collections("subscriptions");
const quran = collections("quran_verses");
const hadiths = collections("hadiths");
const adhkar = collections("adhkar");

// Default Africa/Lagos timezone for bot-originated subscribers
const DEFAULT_TZ = "Africa/Lagos";

export async function handleIncomingMessage(
  from: string,
  text: string,
  adapter: ChannelAdapter,
): Promise<void> {
  const jid = from;
  // Strip the @s.whatsapp.net suffix to use as the handle
  const handle = jid.split("@")[0];
  const cmd = text.toLowerCase().trim().replace(/^!/, "").split(/\s+/)[0] ?? "";

  log.info({ from: handle, cmd: text.slice(0, 60) }, "Incoming WhatsApp message");

  let reply = "";
  switch (cmd) {
    case "subscribe":
    case "start":
    case "begin":
    case "salam":
    case "salaam":
    case "assalam":
    case "assalamualaikum":
    case "as-salam": {
      // Onboard the subscriber with default subscriptions (morning + evening adhkar + daily verse)
      const now = new Date().toISOString();
      const sub = await subscribers.upsert(
        { and: [
          { field: "platform", op: "eq", value: "whatsapp" },
          { field: "handle", op: "eq", value: handle },
        ] },
        {
          platform: "whatsapp",
          handle,
          name: null,
          timezone: DEFAULT_TZ,
          language: "en",
          status: "active",
          joinedAt: now,
          lastSeenAt: now,
          meta: { source: "whatsapp_bot" },
        },
      );

      // Create default subscriptions if newly created
      if (sub.created) {
        const defaultSubs = [
          { contentType: "adhkar_morning", scheduleCron: "0 5 * * *" },
          { contentType: "adhkar_evening", scheduleCron: "0 15 * * *" },
          { contentType: "quran_verse", scheduleCron: "0 7 * * *" },
        ];
        for (const s of defaultSubs) {
          await subscriptions.insert({
            subscriberId: sub.document.id,
            contentType: s.contentType,
            channel: "whatsapp",
            scheduleCron: s.scheduleCron,
            hourLocal: Number(s.scheduleCron.split(" ")[1]),
            minuteLocal: Number(s.scheduleCron.split(" ")[0]),
            daysOfWeek: [],
            nextSendAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: "active",
            createdAt: now,
            updatedAt: now,
          });
        }
        reply = [
          "Assalamu alaikum wa rahmatullahi wa barakatuh!",
          "",
          "Welcome to DeeniyalIslam Auto. You're now subscribed to:",
          "- Morning Adhkar (daily after Fajr)",
          "- Evening Adhkar (daily after Asr)",
          "- Quran verse of the day",
          "",
          "Reply 'help' to see all commands.",
          "Reply 'unsubscribe' to stop.",
        ].join("\n");
      } else {
        reply = "Wa alaikum salam! You're already subscribed. Reply 'help' to see commands.";
      }
      break;
    }

    case "unsubscribe":
    case "stop":
    case "cancel":
    case "leave": {
      const list = await subscribers.list({
        filter: { and: [
          { field: "platform", op: "eq", value: "whatsapp" },
          { field: "handle", op: "eq", value: handle },
        ] },
        limit: 1,
      });
      if (list.data.length === 0) {
        reply = "You're not subscribed. Reply 'subscribe' to begin.";
      } else {
        const sub = list.data[0];
        await subscribers.update(sub.id, { status: "unsubscribed", lastSeenAt: new Date().toISOString() });
        await subscriptions.list({
          filter: { and: [
            { field: "subscriberId", op: "eq", value: sub.id },
            { field: "status", op: "eq", value: "active" },
          ] },
          limit: 100,
        }).then((r) => Promise.all(r.data.map((s) => subscriptions.update(s.id, { status: "archived" }))));
        reply = "You've been unsubscribed. May Allah reward you. Reply 'subscribe' if you change your mind.";
      }
      break;
    }

    case "verse":
    case "quran":
    case "ayah": {
      const list = await quran.list({ limit: 100 });
      if (list.data.length === 0) {
        reply = "No Quran verses available right now. Please try later.";
      } else {
        const v = list.data[Math.floor(Math.random() * list.data.length)];
        reply = [
          `*Surah ${v.surahNameEn} — ${v.surah}:${v.ayah}*`,
          "",
          v.arabic,
          "",
          v.translation,
          "",
          `— ${v.source ?? "Saheeh International"}`,
        ].join("\n");
      }
      break;
    }

    case "hadith":
    case "hadeeth": {
      const list = await hadiths.list({ limit: 100 });
      if (list.data.length === 0) {
        reply = "No hadiths available right now.";
      } else {
        const h = list.data[Math.floor(Math.random() * list.data.length)];
        reply = [
          `*${h.collection} #${h.hadithNumber}*${h.grade ? " [" + h.grade + "]" : ""}`,
          h.narratorEn ? `Narrated by ${h.narratorEn}` : "",
          "",
          h.textAr,
          "",
          h.textEn,
          "",
          h.source ? `— ${h.source}` : "",
        ].filter(Boolean).join("\n");
      }
      break;
    }

    case "dhikr":
    case "dhikr":
    case "azkar":
    case "adhkar": {
      const list = await adhkar.list({ limit: 100 });
      if (list.data.length === 0) {
        reply = "No adhkar available right now.";
      } else {
        const d = list.data[Math.floor(Math.random() * list.data.length)];
        reply = [
          `*${d.category} — repeat ×${d.repeatCount}*`,
          "",
          d.arabic,
          "",
          d.transliteration ?? "",
          "",
          d.translation,
          "",
          d.source ? `— ${d.source}` : "",
        ].filter(Boolean).join("\n");
      }
      break;
    }

    case "status": {
      const list = await subscribers.list({
        filter: { and: [
          { field: "platform", op: "eq", value: "whatsapp" },
          { field: "handle", op: "eq", value: handle },
        ] },
        limit: 1,
      });
      if (list.data.length === 0) {
        reply = "You're not subscribed. Reply 'subscribe' to begin.";
      } else {
        const sub = list.data[0];
        const subs = await subscriptions.list({
          filter: { and: [
            { field: "subscriberId", op: "eq", value: sub.id },
            { field: "status", op: "eq", value: "active" },
          ] },
          limit: 50,
        });
        reply = [
          `Status: ${sub.status}`,
          `Timezone: ${sub.timezone}`,
          `Active subscriptions: ${subs.data.length}`,
          ...subs.data.map((s, i) => `  ${i + 1}. ${s.contentType.replace(/_/g, " ")} — ${s.scheduleCron}`),
          "",
          "Reply 'help' for commands.",
        ].join("\n");
      }
      break;
    }

    case "help":
    case "commands":
    case "?": {
      reply = [
        "*DeeniyalIslam Auto — Commands*",
        "",
        "subscribe — Onboard with default reminders",
        "unsubscribe — Stop all reminders",
        "verse — Get a random Quran verse",
        "hadith — Get a random authentic hadith",
        "dhikr — Get a random dhikr",
        "status — View your subscription",
        "help — Show this message",
      ].join("\n");
      break;
    }

    default:
      reply = [
        "Assalamu alaikum!",
        "",
        "I'm the DeeniyalIslam Auto bot.",
        "Reply 'subscribe' to get daily reminders, or 'help' to see all commands.",
      ].join("\n");
  }

  // Update lastSeenAt
  await subscribers.list({
    filter: { and: [
      { field: "platform", op: "eq", value: "whatsapp" },
      { field: "handle", op: "eq", value: handle },
    ] },
    limit: 1,
  }).then(async (r) => {
    if (r.data.length > 0) {
      await subscribers.update(r.data[0].id, { lastSeenAt: new Date().toISOString() });
    }
  }).catch(() => {});

  // Send the reply
  await adapter.send(jid, reply);
}
