/**
 * WhatsApp incoming message handlers — interactive, multi-step agent flows.
 *
 * Top-level commands:
 *   subscribe / start / salam         → onboards with default subscriptions
 *   unsubscribe / stop                → opts out
 *   verse / quran / ayah              → random Quran verse
 *   hadith                            → random hadith
 *   dhikr / adhkar                    → random dhikr
 *   status                             → shows active subscriptions + khatma
 *   help                               → lists all commands
 *
 * Khatma flow (interactive):
 *   khatma                            → starts khatma setup wizard
 *   khatma status                     → shows current khatma progress
 *   khatma pause / khatma resume      → pauses / resumes khatma
 *   khatma abandon                    → abandons khatma (with confirm)
 *
 * Subscription management:
 *   manage                            → shows subscription management menu
 *   set location <city, country>      → sets the user's location for salah times
 *   set timezone <tz>                → manually set timezone
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import { collections } from "@/lib/lightbase/client";
import type { ChannelAdapter } from "@/lib/channels/registry";
import { logger } from "@/lib/logger";
import {
  getConversation, startConversation, advanceConversation, endConversation,
} from "@/lib/conversations";
import { createKhatma, getActiveKhatma, updateKhatmaStatus } from "@/lib/khatma/engine";
import { fetchSalahTimesByCity } from "@/lib/salah/client";

const log = logger("whatsapp:handlers");

const subscribers = collections("subscribers");
const subscriptions = collections("subscriptions");
const quran = collections("quran_verses");
const hadiths = collections("hadiths");
const adhkar = collections("adhkar");

const DEFAULT_TZ = "Africa/Lagos";

export async function handleIncomingMessage(
  from: string,
  text: string,
  adapter: ChannelAdapter,
): Promise<void> {
  const jid = from;
  const handle = jid.split("@")[0];
  const trimmed = text.trim();
  const cmd = trimmed.toLowerCase().replace(/^!/, "");
  const firstWord = cmd.split(/\s+/)[0] ?? "";

  log.info({ from: handle, cmd: trimmed.slice(0, 60) }, "Incoming WhatsApp message");

  // 1. Check for an active conversation — if so, route to the flow handler
  const conv = await getConversation("whatsapp", handle);
  if (conv) {
    // Allow escape hatches
    if (["cancel", "exit", "quit", "stop"].includes(firstWord)) {
      await endConversation(conv.id);
      await adapter.send(jid, "Cancelled. Reply 'help' for commands.");
      return;
    }
    // Route to the appropriate flow
    if (conv.flow === "khatma_setup") {
      await handleKhatmaSetupStep(jid, handle, conv, trimmed, adapter);
      return;
    }
    if (conv.flow === "manage_subs") {
      await handleManageSubsStep(jid, handle, conv, trimmed, adapter);
      return;
    }
    if (conv.flow === "set_location") {
      await handleSetLocationStep(jid, handle, conv, trimmed, adapter);
      return;
    }
  }

  // 2. Top-level command dispatch
  switch (firstWord) {
    case "subscribe":
    case "start":
    case "begin":
    case "salam":
    case "salaam":
    case "assalam":
    case "assalamualaikum":
    case "as-salam":
      await cmdSubscribe(jid, handle, adapter);
      return;

    case "unsubscribe":
    case "stop":
    case "cancel":
    case "leave":
      await cmdUnsubscribe(jid, handle, adapter);
      return;

    case "verse":
    case "quran":
    case "ayah":
      await cmdVerse(jid, adapter);
      return;

    case "hadith":
    case "hadeeth":
      await cmdHadith(jid, adapter);
      return;

    case "dhikr":
    case "azkar":
    case "adhkar":
      await cmdDhikr(jid, adapter);
      return;

    case "status":
      await cmdStatus(jid, handle, adapter);
      return;

    case "khatma":
    case "khatma":
      await cmdKhatma(jid, handle, trimmed, adapter);
      return;

    case "manage":
      await cmdManage(jid, handle, adapter);
      return;

    case "set":
      await cmdSet(jid, handle, trimmed, adapter);
      return;

    case "help":
    case "commands":
    case "?":
      await cmdHelp(jid, adapter);
      return;

    default:
      await cmdDefault(jid, adapter);
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdSubscribe(jid: string, handle: string, adapter: ChannelAdapter): Promise<void> {
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
    await adapter.send(jid, [
      "Assalamu alaikum wa rahmatullahi wa barakatuh!",
      "",
      "Welcome to DeeniyalIslam Auto. You're now subscribed to:",
      "- Morning Adhkar (daily after Fajr)",
      "- Evening Adhkar (daily after Asr)",
      "- Quran verse of the day",
      "",
      "To get the most out of the platform, set your location:",
      "  set location Lagos, Nigeria",
      "",
      "This lets us compute salah times for you and enable salah-anchored reminders.",
      "",
      "Reply 'help' to see all commands.",
      "Reply 'khatma' to start a Qur'an reading plan.",
    ].join("\n"));
  } else {
    await adapter.send(jid, "Wa alaikum salam! You're already subscribed. Reply 'help' to see commands, or 'manage' to customize.");
  }
}

async function cmdUnsubscribe(jid: string, handle: string, adapter: ChannelAdapter): Promise<void> {
  const list = await subscribers.list({
    filter: { and: [
      { field: "platform", op: "eq", value: "whatsapp" },
      { field: "handle", op: "eq", value: handle },
    ] },
    limit: 1,
  });
  if (list.data.length === 0) {
    await adapter.send(jid, "You're not subscribed. Reply 'subscribe' to begin.");
    return;
  }
  const sub = list.data[0];
  await subscribers.update(sub.id, { status: "unsubscribed", lastSeenAt: new Date().toISOString() });
  const subs = await subscriptions.list({
    filter: { and: [
      { field: "subscriberId", op: "eq", value: sub.id },
      { field: "status", op: "eq", value: "active" },
    ] },
    limit: 100,
  });
  await Promise.all(subs.data.map((s) => subscriptions.update(s.id, { status: "archived" })));
  await adapter.send(jid, "You've been unsubscribed. May Allah reward you. Reply 'subscribe' if you change your mind.");
}

async function cmdVerse(jid: string, adapter: ChannelAdapter): Promise<void> {
  const list = await quran.list({ limit: 100 });
  if (list.data.length === 0) {
    await adapter.send(jid, "No Quran verses available right now. Please try later.");
    return;
  }
  const v = list.data[Math.floor(Math.random() * list.data.length)];
  await adapter.send(jid, [
    `*Surah ${v.surahNameEn} — ${v.surah}:${v.ayah}*`,
    "",
    v.arabic,
    "",
    v.translation,
    "",
    v.transliteration ? `_${v.transliteration}_\n` : "",
    `— ${v.source ?? "Saheeh International"}`,
  ].filter(Boolean).join("\n"));
}

async function cmdHadith(jid: string, adapter: ChannelAdapter): Promise<void> {
  const list = await hadiths.list({ limit: 100 });
  if (list.data.length === 0) {
    await adapter.send(jid, "No hadiths available right now.");
    return;
  }
  const h = list.data[Math.floor(Math.random() * list.data.length)];
  await adapter.send(jid, [
    `*${h.collection} #${h.hadithNumber}*${h.grade ? " [" + h.grade + "]" : ""}`,
    h.narratorEn ? `Narrated by ${h.narratorEn}\n` : "",
    h.textAr,
    "",
    h.textEn,
    "",
    h.source ? `— ${h.source}` : "",
  ].filter(Boolean).join("\n"));
}

async function cmdDhikr(jid: string, adapter: ChannelAdapter): Promise<void> {
  const list = await adhkar.list({ limit: 100 });
  if (list.data.length === 0) {
    await adapter.send(jid, "No adhkar available right now.");
    return;
  }
  const d = list.data[Math.floor(Math.random() * list.data.length)];
  await adapter.send(jid, [
    `*${d.category} — repeat ×${d.repeatCount}*`,
    "",
    d.arabic,
    "",
    d.transliteration ?? "",
    "",
    d.translation,
    "",
    d.source ? `— ${d.source}` : "",
  ].filter(Boolean).join("\n"));
}

async function cmdStatus(jid: string, handle: string, adapter: ChannelAdapter): Promise<void> {
  const list = await subscribers.list({
    filter: { and: [
      { field: "platform", op: "eq", value: "whatsapp" },
      { field: "handle", op: "eq", value: handle },
    ] },
    limit: 1,
  });
  if (list.data.length === 0) {
    await adapter.send(jid, "You're not subscribed. Reply 'subscribe' to begin.");
    return;
  }
  const sub = list.data[0];
  const subs = await subscriptions.list({
    filter: { and: [
      { field: "subscriberId", op: "eq", value: sub.id },
      { field: "status", op: "eq", value: "active" },
    ] },
    limit: 50,
  });
  const khatma = await getActiveKhatma(sub.id);
  const progressPct = khatma ? Math.round(((khatma.currentPage - khatma.startPage) / (khatma.endPage - khatma.startPage)) * 100) : 0;

  const lines = [
    "*Your DeeniyalIslam Auto status*",
    "",
    `Status: ${sub.status}`,
    `Timezone: ${sub.timezone}`,
    `Active subscriptions: ${subs.data.length}`,
  ];
  if (subs.data.length > 0) {
    lines.push("");
    subs.data.forEach((s: any, i: number) => {
      lines.push(`  ${i + 1}. ${s.contentType.replace(/_/g, " ")} — ${s.scheduleCron}`);
    });
  }
  if (khatma) {
    lines.push("");
    lines.push(`*Khatma:* page ${khatma.currentPage}/${khatma.endPage} (${progressPct}%)`);
    lines.push(`  Pace: ${khatma.pace.replace(/_/g, " ")} (${khatma.pagesPerStep} pages/step)`);
    if (khatma.targetEndAt) {
      lines.push(`  Target end: ${new Date(khatma.targetEndAt).toLocaleDateString()}`);
    }
  } else {
    lines.push("");
    lines.push("No active khatma. Reply 'khatma' to start one.");
  }
  lines.push("");
  lines.push("Reply 'help' for all commands.");
  await adapter.send(jid, lines.join("\n"));
}

async function cmdKhatma(jid: string, handle: string, trimmed: string, adapter: ChannelAdapter): Promise<void> {
  const subWord = trimmed.toLowerCase().split(/\s+/)[1] ?? "";

  // Need an active subscriber
  const sub = await getSubscriber(handle);
  if (!sub) {
    await adapter.send(jid, "Please reply 'subscribe' first to set up your account.");
    return;
  }

  if (subWord === "status") {
    const k = await getActiveKhatma(sub.id);
    if (!k) {
      await adapter.send(jid, "You don't have an active khatma. Reply 'khatma' to start one.");
      return;
    }
    const progressPct = Math.round(((k.currentPage - k.startPage) / (k.endPage - k.startPage)) * 100);
    await adapter.send(jid, [
      "*Your Khatma*",
      "",
      `Page: ${k.currentPage} of ${k.endPage} (${progressPct}%)`,
      `Pace: ${k.pace.replace(/_/g, " ")} (${k.pagesPerStep} pages/step)`,
      `Delivered: ${k.deliveredCount} pages`,
      k.targetEndAt ? `Target end: ${new Date(k.targetEndAt).toLocaleDateString()}` : "",
      "",
      "Reply 'khatma pause' or 'khatma resume' or 'khatma abandon'.",
    ].filter(Boolean).join("\n"));
    return;
  }

  if (subWord === "pause") {
    const k = await getActiveKhatma(sub.id);
    if (!k) {
      await adapter.send(jid, "No active khatma to pause.");
      return;
    }
    await updateKhatmaStatus(k.id, "paused");
    await adapter.send(jid, "Khatma paused. Reply 'khatma resume' to continue.");
    return;
  }

  if (subWord === "resume") {
    const list = await collections("khatma_subscriptions").list({
      filter: { and: [
        { field: "subscriberId", op: "eq", value: sub.id },
        { field: "status", op: "eq", value: "paused" },
      ] },
      limit: 1,
    });
    if (list.data.length === 0) {
      await adapter.send(jid, "No paused khatma to resume.");
      return;
    }
    await updateKhatmaStatus(list.data[0].id, "active");
    await adapter.send(jid, "Khatma resumed! Your next page will arrive at the scheduled time, in shaa Allah.");
    return;
  }

  if (subWord === "abandon") {
    const k = await getActiveKhatma(sub.id);
    if (!k) {
      await adapter.send(jid, "No active khatma to abandon.");
      return;
    }
    await updateKhatmaStatus(k.id, "abandoned");
    await adapter.send(jid, "Khatma abandoned. May Allah make it easy for you to start again. Reply 'khatma' to begin a new one.");
    return;
  }

  // No subcommand — start the khatma setup wizard
  const existing = await getActiveKhatma(sub.id);
  if (existing) {
    await adapter.send(jid, [
      "You already have an active khatma.",
      `Page: ${existing.currentPage}/${existing.endPage}`,
      "",
      "Reply 'khatma status' for details, or 'khatma abandon' to start a new one.",
    ].join("\n"));
    return;
  }

  // Start the khatma_setup flow
  await startConversation("whatsapp", handle, "khatma_setup", "pace", {});
  await adapter.send(jid, [
    "*Qur'an Khatma Setup*",
    "",
    "Bismillah! Let's set up your Qur'an reading plan.",
    "",
    "Choose your pace — reply with the number:",
    "",
    "1. 1 page per day (finish in ~20 months)",
    "2. 1 page after every salah (finish in ~4 months)",
    "3. 2 pages per day (finish in ~10 months)",
    "4. 5 pages per day (finish in ~4 months)",
    "5. 1 juz per week (finish in ~7 months)",
    "6. Finish in 30 days (Ramadan pace — 20 pages/day)",
    "7. Custom — I'll specify days",
    "",
    "Reply 'cancel' to exit this wizard.",
  ].join("\n"));
}

async function cmdManage(jid: string, handle: string, adapter: ChannelAdapter): Promise<void> {
  const sub = await getSubscriber(handle);
  if (!sub) {
    await adapter.send(jid, "Please reply 'subscribe' first to set up your account.");
    return;
  }
  // Start the manage_subs flow
  await startConversation("whatsapp", handle, "manage_subs", "menu", {});
  await adapter.send(jid, [
    "*Manage your subscriptions*",
    "",
    "Reply with the number:",
    "",
    "1. Toggle morning adhkar",
    "2. Toggle evening adhkar",
    "3. Toggle daily Quran verse",
    "4. Toggle daily hadith",
    "5. Toggle sleep adhkar",
    "6. Toggle after-prayer adhkar",
    "7. Set my location (for salah times)",
    "8. Set my timezone",
    "",
    "Reply 'cancel' to exit.",
  ].join("\n"));
}

async function cmdSet(jid: string, handle: string, trimmed: string, adapter: ChannelAdapter): Promise<void> {
  // set location Lagos, Nigeria
  // set timezone Africa/Lagos
  const parts = trimmed.split(/\s+/);
  if (parts[1] === "location") {
    const rest = parts.slice(2).join(" ");
    if (!rest) {
      await adapter.send(jid, "Please send: set location City, Country\nExample: set location Lagos, Nigeria");
      return;
    }
    await setLocation(jid, handle, rest, adapter);
    return;
  }
  if (parts[1] === "timezone") {
    const tz = parts[2];
    if (!tz) {
      await adapter.send(jid, "Please send: set timezone <IANA tz>\nExample: set timezone Africa/Lagos");
      return;
    }
    await setTimezone(jid, handle, tz, adapter);
    return;
  }
  await adapter.send(jid, "Usage: 'set location City, Country' or 'set timezone Africa/Lagos'");
}

async function cmdHelp(jid: string, adapter: ChannelAdapter): Promise<void> {
  await adapter.send(jid, [
    "*DeeniyalIslam Auto — Commands*",
    "",
    "*Account*",
    "subscribe — Onboard with default reminders",
    "unsubscribe — Stop all reminders",
    "status — View your subscriptions + khatma",
    "manage — Customize subscriptions",
    "",
    "*Content (on demand)*",
    "verse — Random Quran verse",
    "hadith — Random authentic hadith",
    "dhikr — Random dhikr",
    "",
    "*Qur'an Khatma*",
    "khatma — Start a reading plan",
    "khatma status — View progress",
    "khatma pause / resume / abandon",
    "",
    "*Settings*",
    "set location Lagos, Nigeria",
    "set timezone Africa/Lagos",
    "",
    "help — Show this message",
  ].join("\n"));
}

async function cmdDefault(jid: string, adapter: ChannelAdapter): Promise<void> {
  await adapter.send(jid, [
    "Assalamu alaikum!",
    "",
    "I'm the DeeniyalIslam Auto bot.",
    "Reply 'subscribe' to get daily reminders, 'khatma' to start a Qur'an reading plan, or 'help' to see all commands.",
  ].join("\n"));
}

// ---------------------------------------------------------------------------
// Flow handlers
// ---------------------------------------------------------------------------

async function handleKhatmaSetupStep(jid: string, handle: string, conv: any, text: string, adapter: ChannelAdapter): Promise<void> {
  const step = conv.step;
  const data = conv.data ?? {};
  const sub = await getSubscriber(handle);
  if (!sub) {
    await endConversation(conv.id);
    await adapter.send(jid, "Please reply 'subscribe' first.");
    return;
  }

  if (step === "pace") {
    const paceMap: Record<string, { pace: string; pagesPerStep?: number; targetDays?: number }> = {
      "1": { pace: "pages_per_day", pagesPerStep: 1 },
      "2": { pace: "pages_per_salah", pagesPerStep: 1 },
      "3": { pace: "pages_per_day", pagesPerStep: 2 },
      "4": { pace: "pages_per_day", pagesPerStep: 5 },
      "5": { pace: "juz_per_week" },
      "6": { pace: "complete_in_days", targetDays: 30 },
      "7": { pace: "custom" },
    };
    const choice = paceMap[text.trim()];
    if (!choice) {
      await adapter.send(jid, "Please reply with a number 1-7, or 'cancel'.");
      return;
    }
    if (choice.pace === "custom") {
      await advanceConversation(conv.id, "custom_days", { ...data, pace: "complete_in_days" });
      await adapter.send(jid, "How many days to finish? (1-365)");
      return;
    }
    // Ask for the schedule type next
    await advanceConversation(conv.id, "schedule", { ...data, ...choice });
    await adapter.send(jid, [
      "When should I deliver each reading?",
      "",
      "1. After Fajr (recommended)",
      "2. After every salah (5x/day, only valid for pace #2)",
      "3. Every morning at 7am",
      "4. Every evening at 8pm",
      "",
      "Reply with the number.",
    ].join("\n"));
    return;
  }

  if (step === "custom_days") {
    const days = Number(text.trim());
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      await adapter.send(jid, "Please send a number between 1 and 365.");
      return;
    }
    await advanceConversation(conv.id, "schedule", { ...data, targetDays: days });
    await adapter.send(jid, [
      "When should I deliver each reading?",
      "",
      "1. After Fajr (recommended)",
      "2. After every salah (5x/day)",
      "3. Every morning at 7am",
      "4. Every evening at 8pm",
      "",
      "Reply with the number.",
    ].join("\n"));
    return;
  }

  if (step === "schedule") {
    const schedMap: Record<string, { scheduleType: string; salahKey?: string; scheduleCron?: string; intervalMinutes?: number; salahOffsetMinutes?: number }> = {
      "1": { scheduleType: "salah_relative", salahKey: "fajr", salahOffsetMinutes: 10 },
      "2": { scheduleType: "salah_relative", salahOffsetMinutes: 10 },
      "3": { scheduleType: "cron", scheduleCron: "0 7 * * *" },
      "4": { scheduleType: "cron", scheduleCron: "0 20 * * *" },
    };
    const choice = schedMap[text.trim()];
    if (!choice) {
      await adapter.send(jid, "Please reply with a number 1-4, or 'cancel'.");
      return;
    }
    // If salah_relative and the subscriber has no location, ask for it first
    if (choice.scheduleType === "salah_relative") {
      const hasLoc = sub.meta?.latitude || (sub.meta?.city && sub.meta?.country);
      if (!hasLoc) {
        await advanceConversation(conv.id, "ask_location", { ...data, schedule: choice });
        await adapter.send(jid, [
          "Salah-anchored reminders need your location.",
          "",
          "Please send: City, Country",
          "Example: Lagos, Nigeria",
          "",
          "(I need this to compute Fajr / Dhuhr / Asr / Maghrib / Isha times for your timezone.)",
        ].join("\n"));
        return;
      }
    }
    // Create the khatma
    await createKhatmaFromConversation(jid, sub, { ...data, schedule: choice }, conv, adapter);
    return;
  }

  if (step === "ask_location") {
    await setLocation(jid, handle, text, adapter, async () => {
      // After location is set, create the khatma
      const refreshed = await getSubscriber(handle);
      if (refreshed) {
        await createKhatmaFromConversation(jid, refreshed, data, conv, adapter);
      }
    });
    return;
  }
}

async function createKhatmaFromConversation(jid: string, sub: any, data: any, conv: any, adapter: ChannelAdapter): Promise<void> {
  const schedule = data.schedule;
  const result = await createKhatma({
    subscriberId: sub.id,
    pace: data.pace,
    pagesPerStep: data.pagesPerStep,
    targetDays: data.targetDays,
    scheduleType: schedule.scheduleType,
    scheduleCron: schedule.scheduleCron,
    salahKey: schedule.salahKey,
    salahOffsetMinutes: schedule.salahOffsetMinutes,
    intervalMinutes: schedule.intervalMinutes,
    channel: "whatsapp",
  });
  await endConversation(conv.id);
  if (!result.ok) {
    await adapter.send(jid, `Failed to create khatma: ${result.error}`);
    return;
  }
  const k = result.khatma;
  const total = k.endPage - k.startPage + 1;
  const steps = Math.ceil(total / k.pagesPerStep);
  await adapter.send(jid, [
    "*Bismillah! Khatma started!*",
    "",
    `Pace: ${k.pace.replace(/_/g, " ")}`,
    `Pages per step: ${k.pagesPerStep}`,
    `Total pages: ${total}`,
    `Estimated steps: ${steps}`,
    k.targetEndAt ? `Target end: ${new Date(k.targetEndAt).toLocaleDateString()}` : "",
    "",
    "Your first reading will arrive at the scheduled time, in shaa Allah.",
    "",
    "Reply 'khatma status' anytime to see your progress.",
    "Reply 'khatma pause' to pause, or 'khatma abandon' to stop.",
  ].filter(Boolean).join("\n"));
}

async function handleManageSubsStep(jid: string, handle: string, conv: any, text: string, adapter: ChannelAdapter): Promise<void> {
  const step = conv.step;
  if (step === "menu") {
    const sub = await getSubscriber(handle);
    if (!sub) {
      await endConversation(conv.id);
      await adapter.send(jid, "Please reply 'subscribe' first.");
      return;
    }
    const choice = text.trim();
    const toggleMap: Record<string, { contentType: string; scheduleCron: string }> = {
      "1": { contentType: "adhkar_morning", scheduleCron: "0 5 * * *" },
      "2": { contentType: "adhkar_evening", scheduleCron: "0 15 * * *" },
      "3": { contentType: "quran_verse", scheduleCron: "0 7 * * *" },
      "4": { contentType: "hadith", scheduleCron: "0 12 * * *" },
      "5": { contentType: "adhkar_sleep", scheduleCron: "0 22 * * *" },
      "6": { contentType: "adhkar_after_prayer", scheduleCron: "0 */1 * * *" }, // placeholder — would need salah_relative
    };
    if (choice === "7") {
      await advanceConversation(conv.id, "ask_location", {});
      await adapter.send(jid, "Please send: City, Country\nExample: Lagos, Nigeria");
      return;
    }
    if (choice === "8") {
      await advanceConversation(conv.id, "ask_timezone", {});
      await adapter.send(jid, "Please send your IANA timezone (e.g. Africa/Lagos, Europe/London, America/New_York):");
      return;
    }
    const target = toggleMap[choice];
    if (!target) {
      await adapter.send(jid, "Please reply with a number 1-8, or 'cancel'.");
      return;
    }
    // Check if already subscribed
    const existing = await subscriptions.list({
      filter: { and: [
        { field: "subscriberId", op: "eq", value: sub.id },
        { field: "contentType", op: "eq", value: target.contentType },
        { field: "status", op: "in", value: ["active", "paused"] },
      ] },
      limit: 1,
    });
    if (existing.data.length > 0) {
      await subscriptions.update(existing.data[0].id, { status: "archived", updatedAt: new Date().toISOString() });
      await adapter.send(jid, `✓ ${target.contentType.replace(/_/g, " ")} unsubscribed.`);
    } else {
      const now = new Date().toISOString();
      await subscriptions.insert({
        subscriberId: sub.id,
        contentType: target.contentType,
        channel: "whatsapp",
        scheduleCron: target.scheduleCron,
        hourLocal: Number(target.scheduleCron.split(" ")[1]),
        minuteLocal: Number(target.scheduleCron.split(" ")[0]),
        daysOfWeek: [],
        nextSendAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      await adapter.send(jid, `✓ ${target.contentType.replace(/_/g, " ")} subscribed.`);
    }
    await endConversation(conv.id);
    return;
  }
  if (step === "ask_location") {
    await setLocation(jid, handle, text, adapter, async () => {
      await endConversation(conv.id);
    });
    return;
  }
  if (step === "ask_timezone") {
    await setTimezone(jid, handle, text.trim(), adapter, async () => {
      await endConversation(conv.id);
    });
    return;
  }
}

async function handleSetLocationStep(jid: string, handle: string, conv: any, text: string, adapter: ChannelAdapter): Promise<void> {
  await setLocation(jid, handle, text, adapter, async () => {
    await endConversation(conv.id);
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSubscriber(handle: string): Promise<any | null> {
  const list = await subscribers.list({
    filter: { and: [
      { field: "platform", op: "eq", value: "whatsapp" },
      { field: "handle", op: "eq", value: handle },
    ] },
    limit: 1,
  });
  return list.data[0] ?? null;
}

async function setLocation(jid: string, handle: string, input: string, adapter: ChannelAdapter, onDone?: () => Promise<void>): Promise<void> {
  const sub = await getSubscriber(handle);
  if (!sub) {
    await adapter.send(jid, "Please reply 'subscribe' first.");
    if (onDone) await onDone();
    return;
  }
  // Parse "City, Country"
  const parts = input.split(",").map((s) => s.trim());
  if (parts.length < 2) {
    await adapter.send(jid, "Please send in the format: City, Country\nExample: Lagos, Nigeria");
    if (onDone) await onDone();
    return;
  }
  const [city, country] = parts;
  // Fetch salah times to verify + cache lat/lng
  const dateLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone: sub.timezone || "UTC",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const times = await fetchSalahTimesByCity(city, country, dateLocal);
  if (!times) {
    await adapter.send(jid, `Couldn't find salah times for "${city}, ${country}". Please check the spelling or try a nearby city.`);
    if (onDone) await onDone();
    return;
  }
  // Save location + timezone (use the tz returned by Aladhan)
  await subscribers.update(sub.id, {
    timezone: times.timezone,
    lastSeenAt: new Date().toISOString(),
    meta: {
      ...(sub.meta ?? {}),
      city,
      country,
      latitude: times.latitude,
      longitude: times.longitude,
      method: times.method,
    },
  });
  await adapter.send(jid, [
    `✓ Location set: ${city}, ${country}`,
    `✓ Timezone: ${times.timezone}`,
    "",
    "Today's salah times (your local time):",
    `  Fajr:    ${new Date(times.fajr).toLocaleTimeString("en-US", { timeZone: times.timezone, hour: "2-digit", minute: "2-digit" })}`,
    `  Dhuhr:   ${new Date(times.dhuhr).toLocaleTimeString("en-US", { timeZone: times.timezone, hour: "2-digit", minute: "2-digit" })}`,
    `  Asr:     ${new Date(times.asr).toLocaleTimeString("en-US", { timeZone: times.timezone, hour: "2-digit", minute: "2-digit" })}`,
    `  Maghrib: ${new Date(times.maghrib).toLocaleTimeString("en-US", { timeZone: times.timezone, hour: "2-digit", minute: "2-digit" })}`,
    `  Isha:    ${new Date(times.isha).toLocaleTimeString("en-US", { timeZone: times.timezone, hour: "2-digit", minute: "2-digit" })}`,
    "",
    "You can now subscribe to salah-anchored reminders and khatma plans.",
  ].join("\n"));
  if (onDone) await onDone();
}

async function setTimezone(jid: string, handle: string, tz: string, adapter: ChannelAdapter, onDone?: () => Promise<void>): Promise<void> {
  const sub = await getSubscriber(handle);
  if (!sub) {
    await adapter.send(jid, "Please reply 'subscribe' first.");
    if (onDone) await onDone();
    return;
  }
  // Validate tz by trying to format with it
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
  } catch {
    await adapter.send(jid, `"${tz}" is not a valid IANA timezone. Example: Africa/Lagos, Europe/London, America/New_York.`);
    if (onDone) await onDone();
    return;
  }
  await subscribers.update(sub.id, { timezone: tz, lastSeenAt: new Date().toISOString() });
  await adapter.send(jid, `✓ Timezone set: ${tz}`);
  if (onDone) await onDone();
}
