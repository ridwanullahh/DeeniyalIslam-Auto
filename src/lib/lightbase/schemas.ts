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
    { name: "contentType", type: "string", required: true, indexed: true, enum: ["quran_verse", "quran_page", "hadith", "adhkar_morning", "adhkar_evening", "adhkar_sleep", "adhkar_after_prayer", "general_reminder"] },
    { name: "channel", type: "string", required: true, default: "whatsapp", enum: ["whatsapp", "telegram", "discord", "messenger", "email"] },
    { name: "scheduleCron", type: "string", required: true, description: "UTC cron expression (e.g. '0 5 * * *' = 05:00 UTC daily)" },
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
];

export const COLLECTION_NAMES = ALL_SCHEMAS.map((s) => s.name);
