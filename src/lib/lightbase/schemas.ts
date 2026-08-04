/**
 * Collection schemas for DeeniyalIslam Auto.
 * Each entry is the request body sent to POST /collections.
 * Field types and validation per Lightbase API Docs section 4.
 */

export interface FieldDef {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: unknown;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: string[];
  precision?: number;
  currency?: string;
  dimensions?: number;
  refCollection?: string;
  cascade?: boolean;
  maxBytes?: number;
  searchable?: boolean;
  defaultRegion?: string;
  description?: string;
  encrypted?: boolean;
}

export interface IndexDef {
  name: string;
  fields: string[];
  unique?: boolean;
}

export interface CollectionSchema {
  name: string;
  fields: FieldDef[];
  indexes?: IndexDef[];
  description?: string;
}

// ---------------------------------------------------------------------------
// Subscribers
// ---------------------------------------------------------------------------

export const subscribersSchema: CollectionSchema = {
  name: "subscribers",
  description: "End users who opted in to receive reminders via a channel.",
  fields: [
    { name: "platform", type: "string", required: true, indexed: true, enum: ["whatsapp", "telegram", "discord", "messenger"] },
    { name: "handle", type: "string", required: true, indexed: true, description: "Phone E.164, TG chat id, Discord channel/user id, PSID" },
    { name: "name", type: "string", maxLength: 120 },
    { name: "timezone", type: "string", required: true, default: "Africa/Lagos", description: "IANA tz key" },
    { name: "language", type: "string", default: "en", enum: ["en", "ar", "fr", "ha", "yo", "sw"] },
    { name: "status", type: "string", required: true, indexed: true, default: "active", enum: ["active", "paused", "unsubscribed", "blacklisted"] },
    { name: "joinedAt", type: "datetime", required: true },
    { name: "lastSeenAt", type: "datetime" },
    { name: "meta", type: "json", description: "Free-form platform-specific metadata" },
  ],
  indexes: [
    { name: "subscribers_handle_unique", fields: ["platform", "handle"], unique: true },
    { name: "subscribers_status_idx", fields: ["status"] },
  ],
};

// ---------------------------------------------------------------------------
// Subscriptions — one subscriber can have many subscriptions
// ---------------------------------------------------------------------------

export const subscriptionsSchema: CollectionSchema = {
  name: "subscriptions",
  description: "Per-subscriber content subscriptions with schedule.",
  fields: [
    { name: "subscriberId", type: "string", required: true, indexed: true, refCollection: "subscribers" },
    { name: "contentType", type: "string", required: true, indexed: true, enum: ["quran_verse", "quran_page", "hadith", "adhkar_morning", "adhkar_evening", "adhkar_sleep", "adhkar_after_prayer", "general_reminder", "khatma_page", "salah_reminder"] },
    { name: "channel", type: "string", required: true, default: "whatsapp", enum: ["whatsapp", "telegram", "discord", "messenger", "email"] },
    { name: "scheduleType", type: "string", default: "cron", enum: ["cron", "salah_relative", "interval_minutes"] },
    { name: "scheduleCron", type: "string", description: "UTC cron expression (e.g. '0 5 * * *' = 05:00 UTC daily). Required when scheduleType=cron" },
    { name: "salahKey", type: "string", enum: ["fajr", "dhuhr", "asr", "maghrib", "isha"], description: "Salah to anchor to (when scheduleType=salah_relative). Empty = after every salah" },
    { name: "salahOffsetMinutes", type: "integer", minimum: -180, maximum: 180, default: 0, description: "Minutes offset from salah time" },
    { name: "intervalMinutes", type: "integer", minimum: 1, maximum: 1440, description: "Repeat every N minutes (when scheduleType=interval_minutes)" },
    { name: "hourLocal", type: "integer", minimum: 0, maximum: 23, description: "Hour in subscriber tz, kept for fast filtering" },
    { name: "minuteLocal", type: "integer", minimum: 0, maximum: 59 },
    { name: "daysOfWeek", type: "array", of: "integer", description: "0=Sun .. 6=Sat. Empty = every day" },
    { name: "lastSentAt", type: "datetime" },
    { name: "nextSendAt", type: "datetime", indexed: true },
    { name: "status", type: "string", required: true, default: "active", indexed: true, enum: ["active", "paused", "archived"] },
    { name: "createdAt", type: "datetime", required: true },
    { name: "updatedAt", type: "datetime" },
  ],
  indexes: [
    { name: "subscriptions_status_next_idx", fields: ["status", "nextSendAt"] },
    { name: "subscriptions_subscriber_idx", fields: ["subscriberId"] },
  ],
};

// ---------------------------------------------------------------------------
// Quran verses
// ---------------------------------------------------------------------------

export const quranVersesSchema: CollectionSchema = {
  name: "quran_verses",
  description: "Individual Quran verses with Arabic + translation + transliteration.",
  fields: [
    { name: "surah", type: "integer", required: true, indexed: true, minimum: 1, maximum: 114 },
    { name: "ayah", type: "integer", required: true, indexed: true, minimum: 1 },
    { name: "surahNameAr", type: "string", required: true },
    { name: "surahNameEn", type: "string", required: true },
    { name: "surahNameTranslit", type: "string" },
    { name: "arabic", type: "text", required: true, searchable: true, maxLength: 5000 },
    { name: "translation", type: "text", required: true, searchable: true, maxLength: 5000 },
    { name: "transliteration", type: "text", maxLength: 5000 },
    { name: "source", type: "string", required: true, default: "Saheeh International" },
    { name: "tags", type: "array", of: "string" },
    { name: "juz", type: "integer", minimum: 1, maximum: 30, indexed: true },
    { name: "page", type: "integer", minimum: 1, maximum: 604, indexed: true, description: "Mushaf Madinah page number" },
    { name: "isFavorite", type: "boolean", default: false },
  ],
  indexes: [
    { name: "quran_verses_surah_ayah_unique", fields: ["surah", "ayah"], unique: true },
    { name: "quran_verses_juz_idx", fields: ["juz"] },
  ],
};

// ---------------------------------------------------------------------------
// Quran pages (Mushaf Madinah reference)
// ---------------------------------------------------------------------------

export const quranPagesSchema: CollectionSchema = {
  name: "quran_pages",
  description: "Mushaf Madinah page metadata + image URL.",
  fields: [
    { name: "pageNumber", type: "integer", required: true, indexed: true, minimum: 1, maximum: 604 },
    { name: "juz", type: "integer", minimum: 1, maximum: 30, indexed: true },
    { name: "hizb", type: "integer", minimum: 1, maximum: 60 },
    { name: "rubElHizb", type: "integer", minimum: 1, maximum: 240 },
    { name: "surahs", type: "array", of: "json", description: "[{surah, startAyah, endAyah}]" },
    { name: "imageUrl", type: "url", required: true },
    { name: "width", type: "integer" },
    { name: "height", type: "integer" },
  ],
  indexes: [
    { name: "quran_pages_pagenum_unique", fields: ["pageNumber"], unique: true },
  ],
};

// ---------------------------------------------------------------------------
// Hadiths
// ---------------------------------------------------------------------------

export const hadithsSchema: CollectionSchema = {
  name: "hadiths",
  description: "Hadith narrations from major collections.",
  fields: [
    { name: "collection", type: "string", required: true, indexed: true, enum: ["bukhari", "muslim", "tirmidhi", "abudawud", "nasai", "ibnmajah", "malik", "ahmad"] },
    { name: "book", type: "string", indexed: true, description: "Book number / name within collection" },
    { name: "hadithNumber", type: "string", required: true, indexed: true, description: "Original hadith number (string for collections like '123a')" },
    { name: "narratorAr", type: "text" },
    { name: "narratorEn", type: "text" },
    { name: "textAr", type: "text", required: true, searchable: true, maxLength: 10000 },
    { name: "textEn", type: "text", required: true, searchable: true, maxLength: 10000 },
    { name: "grade", type: "string", enum: ["sahih", "hasan", "daif", "sahih-bukhari", "sahih-muslim"], indexed: true },
    { name: "source", type: "string", description: "Translator / edition, e.g. 'Muhsin Khan'" },
    { name: "tags", type: "array", of: "string" },
  ],
  indexes: [
    { name: "hadiths_coll_num_unique", fields: ["collection", "hadithNumber"], unique: true },
  ],
};

// ---------------------------------------------------------------------------
// Adhkar
// ---------------------------------------------------------------------------

export const adhkarSchema: CollectionSchema = {
  name: "adhkar",
  description: "Supplications / remembrances. Categories: morning, evening, sleep, after-prayer, after-wudu, etc.",
  fields: [
    { name: "category", type: "string", required: true, indexed: true, enum: ["morning", "evening", "sleep", "after_prayer", "after_wudu", "travel", "food", "distress", "protection", "tahleel"] },
    { name: "arabic", type: "text", required: true, searchable: true, maxLength: 3000 },
    { name: "transliteration", type: "text", maxLength: 3000 },
    { name: "translation", type: "text", required: true, searchable: true, maxLength: 3000 },
    { name: "repeatCount", type: "integer", default: 1, minimum: 1, maximum: 1000 },
    { name: "source", type: "string", description: "Source hadith collection / narrator / grade" },
    { name: "tags", type: "array", of: "string" },
    { name: "order", type: "integer", default: 0, description: "Display order within category" },
  ],
  indexes: [
    { name: "adhkar_category_order_idx", fields: ["category", "order"] },
  ],
};

// ---------------------------------------------------------------------------
// General reminders
// ---------------------------------------------------------------------------

export const remindersSchema: CollectionSchema = {
  name: "reminders",
  description: "General Islamic reminders (not Quran/Hadith/Adhkar).",
  fields: [
    { name: "title", type: "string", required: true, maxLength: 200 },
    { name: "body", type: "text", required: true, searchable: true, maxLength: 5000 },
    { name: "category", type: "string", required: true, indexed: true, enum: ["general", "warning", "encouragement", "character", "worship", "character_building", "ethics"] },
    { name: "language", type: "string", default: "en", enum: ["en", "ar", "fr", "ha", "yo", "sw"] },
    { name: "source", type: "string" },
    { name: "tags", type: "array", of: "string" },
    { name: "isPublished", type: "boolean", default: true, indexed: true },
  ],
  indexes: [
    { name: "reminders_category_lang_idx", fields: ["category", "language"] },
  ],
};

// ---------------------------------------------------------------------------
// Posts (scheduled/autopublished)
// ---------------------------------------------------------------------------

export const postsSchema: CollectionSchema = {
  name: "posts",
  description: "Composed posts scheduled for autopublish to channels + public site.",
  fields: [
    { name: "contentType", type: "string", required: true, indexed: true, enum: ["quran_verse", "hadith", "adhkar", "reminder"] },
    { name: "refId", type: "string", description: "Document id in the content collection" },
    { name: "caption", type: "text", maxLength: 5000 },
    { name: "channelTargets", type: "array", of: "string", description: "e.g. ['whatsapp', 'telegram', 'site_home']" },
    { name: "status", type: "string", required: true, indexed: true, default: "draft", enum: ["draft", "scheduled", "publishing", "published", "failed", "archived"] },
    { name: "scheduledFor", type: "datetime", indexed: true },
    { name: "publishedAt", type: "datetime" },
    { name: "externalIds", type: "json", description: "Per-channel external post ids (TG message id, etc.)" },
    { name: "error", type: "text" },
    { name: "createdBy", type: "string", description: "Admin email" },
    { name: "createdAt", type: "datetime", required: true },
  ],
  indexes: [
    { name: "posts_status_scheduled_idx", fields: ["status", "scheduledFor"] },
  ],
};

// ---------------------------------------------------------------------------
// Delivery log (per-subscriber deliveries)
// ---------------------------------------------------------------------------

export const deliveryLogSchema: CollectionSchema = {
  name: "delivery_log",
  description: "One row per delivery attempt to a subscriber.",
  fields: [
    { name: "subscriptionId", type: "string", required: true, indexed: true },
    { name: "subscriberId", type: "string", required: true, indexed: true },
    { name: "postId", type: "string", indexed: true },
    { name: "contentType", type: "string", indexed: true },
    { name: "channel", type: "string", required: true, indexed: true },
    { name: "status", type: "string", required: true, indexed: true, default: "sent", enum: ["sent", "failed", "retrying", "skipped"] },
    { name: "attemptedAt", type: "datetime", required: true },
    { name: "error", type: "text" },
  ],
  indexes: [
    { name: "delivery_log_subscriber_idx", fields: ["subscriberId", "attemptedAt"] },
  ],
};

// ---------------------------------------------------------------------------
// Admin audit log
// ---------------------------------------------------------------------------

export const adminAuditSchema: CollectionSchema = {
  name: "admin_audit",
  description: "Audit trail of admin actions.",
  fields: [
    { name: "actor", type: "string", required: true, indexed: true, description: "Admin email or 'system'" },
    { name: "action", type: "string", required: true, indexed: true, description: "e.g. 'quran.create', 'subscriber.pause'" },
    { name: "target", type: "string", description: "Document id or handle affected" },
    { name: "before", type: "json" },
    { name: "after", type: "json" },
    { name: "at", type: "datetime", required: true, indexed: true },
    { name: "ip", type: "string" },
    { name: "userAgent", type: "string" },
  ],
  indexes: [
    { name: "admin_audit_at_idx", fields: ["at"] },
  ],
};

// ---------------------------------------------------------------------------
// Bot sessions
// ---------------------------------------------------------------------------

export const botSessionsSchema: CollectionSchema = {
  name: "bot_sessions",
  description: "Bot connection state per channel.",
  fields: [
    { name: "channel", type: "string", required: true, indexed: true, enum: ["whatsapp", "telegram", "discord", "messenger"] },
    { name: "identity", type: "string", description: "Bot's own handle/id on the channel" },
    { name: "status", type: "string", required: true, indexed: true, enum: ["connected", "disconnected", "pairing", "error"] },
    { name: "lastSeenAt", type: "datetime" },
    { name: "meta", type: "json", description: "Free-form: QR code, retry count, etc." },
  ],
  indexes: [
    { name: "bot_sessions_channel_unique", fields: ["channel"], unique: true },
  ],
};

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const feedbackSchema: CollectionSchema = {
  name: "feedback",
  description: "Subscriber feedback / ratings on content.",
  fields: [
    { name: "subscriberId", type: "string", indexed: true },
    { name: "postId", type: "string", indexed: true },
    { name: "rating", type: "integer", minimum: 1, maximum: 5 },
    { name: "comment", type: "text", maxLength: 1000 },
    { name: "at", type: "datetime", required: true, indexed: true },
  ],
  indexes: [
    { name: "feedback_at_idx", fields: ["at"] },
  ],
};

// ---------------------------------------------------------------------------
// Content schedules — robust per-content-type, per-channel scheduling config
// Used by the admin to define default schedules that subscribers can opt into,
// AND by the autoposter for global broadcasts. Channel-agnostic.
// ---------------------------------------------------------------------------

export const contentSchedulesSchema: CollectionSchema = {
  name: "content_schedules",
  description: "Reusable schedule templates per content type + channel. Channel-agnostic — used by both per-subscriber delivery and global autopost.",
  fields: [
    { name: "name", type: "string", required: true, maxLength: 120, description: "Human-readable name (e.g. 'Morning Adhkar — Fajr+15min')" },
    { name: "contentType", type: "string", required: true, indexed: true, enum: ["quran_verse", "quran_page", "hadith", "adhkar_morning", "adhkar_evening", "adhkar_sleep", "adhkar_after_prayer", "general_reminder", "khatma_page", "salah_reminder"] },
    { name: "scheduleType", type: "string", required: true, enum: ["cron", "salah_relative", "interval_minutes"], default: "cron", description: "cron=UTC cron, salah_relative=offset from a salah, interval_minutes=every N minutes" },
    { name: "scheduleCron", type: "string", description: "UTC cron expression (when scheduleType=cron)" },
    { name: "salahKey", type: "string", enum: ["fajr", "dhuhr", "asr", "maghrib", "isha"], description: "Salah to anchor to (when scheduleType=salah_relative)" },
    { name: "salahOffsetMinutes", type: "integer", minimum: -180, maximum: 180, default: 0, description: "Minutes offset from salah time (negative=before, positive=after)" },
    { name: "intervalMinutes", type: "integer", minimum: 1, maximum: 1440, description: "Repeat every N minutes (when scheduleType=interval_minutes)" },
    { name: "channels", type: "array", of: "string", description: "Target channels: ['whatsapp','telegram','discord','messenger','site_home','site_widget','whatsapp_status']" },
    { name: "isDefault", type: "boolean", default: false, indexed: true, description: "Default template for this content type" },
    { name: "isActive", type: "boolean", default: true, indexed: true },
    { name: "createdBy", type: "string" },
    { name: "createdAt", type: "datetime", required: true },
    { name: "updatedAt", type: "datetime" },
  ],
  indexes: [
    { name: "content_schedules_type_active_idx", fields: ["contentType", "isActive"] },
  ],
};

// ---------------------------------------------------------------------------
// Khatma subscriptions — Qur'an reading plan per subscriber.
// A subscriber can have one active khatma at a time (enforced at app layer).
// ---------------------------------------------------------------------------

export const khatmaSubscriptionsSchema: CollectionSchema = {
  name: "khatma_subscriptions",
  description: "Per-subscriber Qur'an Khatma (complete reading) plan. Tracks progress, pace, and delivery schedule.",
  fields: [
    { name: "subscriberId", type: "string", required: true, indexed: true, refCollection: "subscribers" },
    { name: "name", type: "string", maxLength: 120, description: "Optional name (e.g. 'Ramadan Khatma')" },
    // Plan config
    { name: "pace", type: "string", required: true, enum: ["pages_per_day", "pages_per_salah", "pages_per_week", "juz_per_week", "complete_in_days"], default: "pages_per_day" },
    { name: "pagesPerStep", type: "integer", minimum: 1, maximum: 604, default: 1, description: "Pages to deliver each step" },
    { name: "targetDays", type: "integer", minimum: 1, maximum: 365, description: "Complete in N days (used when pace=complete_in_days)" },
    // Schedule config
    { name: "scheduleType", type: "string", required: true, enum: ["cron", "salah_relative", "interval_minutes"], default: "salah_relative" },
    { name: "scheduleCron", type: "string", description: "UTC cron (when scheduleType=cron)" },
    { name: "salahKey", type: "string", enum: ["fajr", "dhuhr", "asr", "maghrib", "isha"], description: "Salah to anchor to (when scheduleType=salah_relative). Empty = after every salah" },
    { name: "salahOffsetMinutes", type: "integer", minimum: -180, maximum: 180, default: 5 },
    { name: "intervalMinutes", type: "integer", minimum: 30, maximum: 1440, default: 360 },
    { name: "channel", type: "string", required: true, default: "whatsapp", enum: ["whatsapp", "telegram", "discord", "messenger"] },
    // Progress tracking
    { name: "startPage", type: "integer", minimum: 1, maximum: 604, default: 1 },
    { name: "currentPage", type: "integer", minimum: 1, maximum: 604, default: 1, indexed: true, description: "Next page to deliver" },
    { name: "endPage", type: "integer", minimum: 1, maximum: 604, default: 604 },
    { name: "deliveredCount", type: "integer", default: 0, description: "Total pages delivered so far" },
    { name: "startedAt", type: "datetime", required: true },
    { name: "targetEndAt", type: "datetime", description: "Computed target completion date" },
    { name: "completedAt", type: "datetime" },
    { name: "lastDeliveredAt", type: "datetime" },
    { name: "nextSendAt", type: "datetime", indexed: true },
    { name: "status", type: "string", required: true, default: "active", indexed: true, enum: ["active", "paused", "completed", "abandoned"] },
    { name: "createdAt", type: "datetime", required: true },
    { name: "updatedAt", type: "datetime" },
  ],
  indexes: [
    { name: "khatma_subscriber_active_idx", fields: ["subscriberId", "status"] },
    { name: "khatma_status_next_idx", fields: ["status", "nextSendAt"] },
  ],
};

// ---------------------------------------------------------------------------
// Salah schedules — cached salah times per subscriber per day.
// Refreshed daily by the scheduler from the Aladhan API.
// ---------------------------------------------------------------------------

export const salahSchedulesSchema: CollectionSchema = {
  name: "salah_schedules",
  description: "Daily salah times per subscriber. Refreshed from Aladhan API once per day per subscriber.",
  fields: [
    { name: "subscriberId", type: "string", required: true, indexed: true, refCollection: "subscribers" },
    { name: "date", type: "date", required: true, indexed: true, description: "Local date YYYY-MM-DD" },
    { name: "timezone", type: "string", required: true },
    // Aladhan returns lat/lng + method-based times
    { name: "latitude", type: "number" },
    { name: "longitude", type: "number" },
    { name: "method", type: "integer", description: "Aladhan calculation method (e.g. 3 = Muslim World League)" },
    { name: "fajr", type: "datetime", description: "UTC datetime of Fajr adhan" },
    { name: "sunrise", type: "datetime" },
    { name: "dhuhr", type: "datetime" },
    { name: "asr", type: "datetime" },
    { name: "maghrib", type: "datetime" },
    { name: "isha", type: "datetime" },
    { name: "fetchedAt", type: "datetime", required: true },
  ],
  indexes: [
    { name: "salah_schedules_sub_date_unique", fields: ["subscriberId", "date"], unique: true },
  ],
};

// ---------------------------------------------------------------------------
// Bot conversation state — for interactive multi-step bot flows
// (e.g. setting up a khatma via WhatsApp step-by-step)
// ---------------------------------------------------------------------------

export const botConversationsSchema: CollectionSchema = {
  name: "bot_conversations",
  description: "Per-user bot conversation state. Used for multi-step flows (subscribe, khatma setup, etc.).",
  fields: [
    { name: "channel", type: "string", required: true, indexed: true, enum: ["whatsapp", "telegram", "discord", "messenger"] },
    { name: "handle", type: "string", required: true, indexed: true },
    { name: "flow", type: "string", required: true, indexed: true, description: "e.g. 'subscribe', 'khatma_setup', 'manage_subs'" },
    { name: "step", type: "string", required: true, default: "start" },
    { name: "data", type: "json", description: "Flow-specific data accumulated across steps" },
    { name: "startedAt", type: "datetime", required: true },
    { name: "updatedAt", type: "datetime" },
    { name: "expiresAt", type: "datetime", required: true, indexed: true },
  ],
  indexes: [
    { name: "bot_conv_channel_handle_idx", fields: ["channel", "handle"] },
    { name: "bot_conv_expires_idx", fields: ["expiresAt"] },
  ],
};

// ---------------------------------------------------------------------------
// Autopost log — track each global autopost execution
// ---------------------------------------------------------------------------

export const autopostLogSchema: CollectionSchema = {
  name: "autopost_log",
  description: "Tracks each global autopost execution per channel + the external post id.",
  fields: [
    { name: "postId", type: "string", required: true, indexed: true, refCollection: "posts" },
    { name: "channel", type: "string", required: true, indexed: true },
    { name: "status", type: "string", required: true, indexed: true, enum: ["sent", "failed", "skipped"] },
    { name: "externalId", type: "string", description: "External post/message id on the channel" },
    { name: "attemptedAt", type: "datetime", required: true },
    { name: "error", type: "text" },
  ],
  indexes: [
    { name: "autopost_log_post_idx", fields: ["postId"] },
  ],
};

// ---------------------------------------------------------------------------
// Schedule — registry of all schemas for the bootstrapper
// ---------------------------------------------------------------------------

export const ALL_SCHEMAS: CollectionSchema[] = [
  subscribersSchema,
  subscriptionsSchema,
  quranVersesSchema,
  quranPagesSchema,
  hadithsSchema,
  adhkarSchema,
  remindersSchema,
  postsSchema,
  deliveryLogSchema,
  adminAuditSchema,
  botSessionsSchema,
  feedbackSchema,
  contentSchedulesSchema,
  khatmaSubscriptionsSchema,
  salahSchedulesSchema,
  botConversationsSchema,
  autopostLogSchema,
];

export const COLLECTION_NAMES = ALL_SCHEMAS.map((s) => s.name);
