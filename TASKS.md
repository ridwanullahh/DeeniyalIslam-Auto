Bismillah Ar-Rahman Ar-Raheem. Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu, wa ash-hadu anna Muhammadan Abduhu wa Rasooluh. Laa hawla wa laa quwwata illaa biLLAH. Hasbiyallaahu laa ilaaha illaa Huwa, alayhi tawakkaltu wa Huwa Rabbul-Arshil-Azeem. SubhaanALLAH wa bihamdih, SubhaanALLAHil-azeem, AlhamduliLLAH, Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR, walaa hawla walaa quwwata illaa biLLAH. Astaghfirullaaha wa atoobu ilayh.

# TASKS.md — DeeniyalIslam Auto Build Tracker

> This file is the single source of truth for the build. Every task, sub-task,
> and sub-sub-task is tracked here with a checkbox. After completing each
> sub-sub-task, the agent updates its checkbox here, commits, and pushes.
> Statuses: `[ ]` pending, `[~]` in progress, `[x]` done, `[!]` blocked.

---

## Phase 0 — Foundation & Scaffolding

### Task 0.1 — Project Initialization
- [x] 0.1.1 — Clone the repository and verify clean state
- [x] 0.1.2 — Configure git credentials and commit identity
- [x] 0.1.3 — Read the Lightbase API Docs in full
- [x] 0.1.4 — Create `Core_Working_Protocol.md`
- [x] 0.1.5 — Create `TASKS.md` (this file)

### Task 0.2 — Astro.js Project Skeleton
- [ ] 0.2.1 — Initialize Astro project with TypeScript strict mode
- [ ] 0.2.2 — Configure `astro.config.mjs` (integrations, output mode, base path)
- [ ] 0.2.3 — Set up `tsconfig.json` with path aliases (`@/`, `@lib/`, `@components/`)
- [ ] 0.2.4 — Add Tailwind CSS with brand palette tokens
- [ ] 0.2.5 — Configure `package.json` scripts (dev, build, preview, seed, typecheck)
- [ ] 0.2.6 — Add `.gitignore` (node_modules, .env, dist, .astro, auth_state, etc.)
- [ ] 0.2.7 — Add `.env.example` (committed, with Lightbase creds placeholders + admin creds + bot tokens)
- [ ] 0.2.8 — Add `.env` (gitignored, with real creds)
- [ ] 0.2.9 — Run `astro build` to verify skeleton compiles
- [ ] 0.2.10 — Commit & push Phase 0.2

### Task 0.3 — Design System
- [ ] 0.3.1 — Define CSS custom properties for brand palette + light/dark variants
- [ ] 0.3.2 — Build `BaseLayout.astro` with mobile-first viewport + theme bootstrap
- [ ] 0.3.3 — Build `ThemeToggle.astro` (light/dark, localStorage, `prefers-color-scheme`)
- [ ] 0.3.4 — Build `Icon.astro` SVG icon system (no emoji)
- [ ] 0.3.5 — Build typography scale (Arabic-aware font stack: Amiri/Noto Naskh, body Inter)
- [ ] 0.3.6 — Build spacing/radius/shadow tokens
- [ ] 0.3.7 — Build `Button.astro`, `Input.astro`, `Card.astro`, `Sheet.astro`, `Toast.astro`
- [ ] 0.3.8 — Build `BottomNav.astro` (mobile-native tab bar pattern)
- [ ] 0.3.9 — Build `TopBar.astro` (with theme toggle + profile menu)
- [ ] 0.3.10 — Battle-test design system on a sandbox page
- [ ] 0.3.11 — Commit & push Phase 0.3

---

## Phase 1 — Lightbase Integration Layer

### Task 1.1 — Lightbase Client
- [ ] 1.1.1 — Build `lib/lightbase/client.ts` (fetch wrapper, headers, error envelope)
- [ ] 1.1.2 — Build typed collection helpers (`list`, `get`, `insert`, `update`, `delete`, `upsert`, `query`)
- [ ] 1.1.3 — Build `lib/lightbase/collections.ts` (collection schema registry + creator)
- [ ] 1.1.4 — Build `lib/lightbase/storage.ts` (bucket + upload + signed URL)
- [ ] 1.1.5 — Battle-test the client against the live instance (`GET /health`, list collections)
- [ ] 1.1.6 — Commit & push Phase 1.1

### Task 1.2 — Schema Bootstrapper
- [ ] 1.2.1 — Define collection schemas:
  - [ ] `subscribers` (id, phoneE164, platform, handle, name, timezone, language, status, createdAt)
  - [ ] `subscriptions` (id, subscriberId, contentType, channel, scheduleCron, lastSentAt, status)
  - [ ] `quran_verses` (id, surah, ayah, arabic, translation, transliteration, source, tags)
  - [ ] `quran_pages` (id, pageNumber, imageUrl, juz, hizb, surahs)
  - [ ] `hadiths` (id, collection, book, number, narratorAr, narratorEn, textAr, textEn, grade, tags)
  - [ ] `adhkar` (id, category, arabic, transliteration, translation, repeatCount, source, tags)
  - [ ] `reminders` (id, title, body, category, language, scheduledFor, status, source)
  - [ ] `posts` (id, contentType, refId, caption, channelTargets, status, scheduledFor, publishedAt, externalIds)
  - [ ] `delivery_log` (id, subscriptionId, subscriberId, postId, channel, status, attemptedAt, error)
  - [ ] `admin_audit` (id, actor, action, target, before, after, at, ip)
  - [ ] `bot_sessions` (id, channel, identity, status, lastSeen, meta)
  - [ ] `feedback` (id, subscriberId, postId, rating, comment, at)
- [ ] 1.2.2 — Build `lib/lightbase/bootstrap.ts` (idempotent collection creator)
- [ ] 1.2.3 — Run bootstrapper against live Lightbase
- [ ] 1.2.4 — Battle-test schema (insert + read + update + delete one doc per collection)
- [ ] 1.2.5 — Commit & push Phase 1.2

### Task 1.3 — Seed Data
- [ ] 1.3.1 — Quran: import a curated set of verses (>= 50 across multiple surahs)
- [ ] 1.3.2 — Quran: seed `quran_pages` metadata (604 pages of Mushaf Madinah reference)
- [ ] 1.3.3 — Hadith: import >= 50 hadiths across Bukhari, Muslim, Tirmidhi, Abu Dawud
- [ ] 1.3.4 — Adhkar: import morning/evening/sleep/after-prayer adhkar (>= 40 entries)
- [ ] 1.3.5 — Reminders: seed >= 30 general Islamic reminders
- [ ] 1.3.6 — Build `scripts/seed.ts` that calls the seed API with dedup
- [ ] 1.3.7 — Run seeder, verify counts in Lightbase
- [ ] 1.3.8 — Commit & push Phase 1.3

---

## Phase 2 — Authentication & Admin Session

### Task 2.1 — Env-Based Admin Auth
- [ ] 2.1.1 — Parse `ADMIN_CREDENTIALS` env var (`email:password,email2:password2`)
- [ ] 2.1.2 — Build `lib/auth/session.ts` (signed, httpOnly, SameSite=Strict session cookie)
- [ ] 2.1.3 — Build login API route (`POST /api/admin/login`) with rate limiting + audit
- [ ] 2.1.4 — Build logout API route (`POST /api/admin/logout`)
- [ ] 2.1.5 — Build `requireAdmin()` middleware for protected pages & APIs
- [ ] 2.1.6 — Battle-test: login, session check, logout, expired session, wrong creds
- [ ] 2.1.7 — Commit & push Phase 2.1

### Task 2.2 — Admin Login Page
- [ ] 2.2.1 — Build `/admin/login` page (mobile-native, brand-styled)
- [ ] 2.2.2 — Build form with email + password, client-side validation
- [ ] 2.2.3 — Build error toast + loading state
- [ ] 2.2.4 — Redirect to `/admin` on success
- [ ] 2.2.5 — Battle-test the full login flow
- [ ] 2.2.6 — Commit & push Phase 2.2

---

## Phase 3 — Admin Dashboard Shell

### Task 3.1 — Dashboard Layout
- [ ] 3.1.1 — Build `AdminLayout.astro` (auth-guarded, mobile-native shell)
- [ ] 3.1.2 — Build `Sidebar.astro` (collapsible on desktop, drawer on mobile)
- [ ] 3.1.3 — Build `AdminTopBar.astro` (theme toggle, admin menu, notifications bell)
- [ ] 3.1.4 — Build `AdminBottomNav.astro` (mobile tab bar: Home, Content, Subs, Posts, Settings)
- [ ] 3.1.5 — Wire navigation between all admin routes
- [ ] 3.1.6 — Battle-test navigation on mobile + desktop
- [ ] 3.1.7 — Commit & push Phase 3.1

### Task 3.2 — Dashboard Home
- [ ] 3.2.1 — Build stats cards (subscribers, posts today, delivery rate, pending schedules)
- [ ] 3.2.2 — Build recent activity feed (last 20 audit events)
- [ ] 3.2.3 — Build upcoming schedules list (next 10 scheduled posts)
- [ ] 3.2.4 — Build channel health indicators (WhatsApp connected, Telegram, etc.)
- [ ] 3.2.5 — Battle-test with live data
- [ ] 3.2.6 — Commit & push Phase 3.2

---

## Phase 4 — Content Management

### Task 4.1 — Quran Verses CRUD
- [ ] 4.1.1 — Build `/admin/quran` list page (search by surah/ayah/tag, paginated)
- [ ] 4.1.2 — Build `/admin/quran/new` create form
- [ ] 4.1.3 — Build `/admin/quran/[id]` edit form
- [ ] 4.1.4 — Build delete with confirm sheet
- [ ] 4.1.5 — Build API routes: `GET/POST /api/admin/quran`, `GET/PATCH/DELETE /api/admin/quran/[id]`
- [ ] 4.1.6 — Battle-test CRUD end-to-end
- [ ] 4.1.7 — Commit & push Phase 4.1

### Task 4.2 — Quran Pages (Mushaf)
- [ ] 4.2.1 — Build `/admin/quran/pages` management page (upload image, set page number)
- [ ] 4.2.2 — Build file upload to Lightbase storage bucket
- [ ] 4.2.3 — Build public mushaf reader `/quran/read` (page-by-page flip)
- [ ] 4.2.4 — Battle-test upload + read flow
- [ ] 4.2.5 — Commit & push Phase 4.2

### Task 4.3 — Hadith CRUD
- [ ] 4.3.1 — Build `/admin/hadith` list (filter by collection/grade/tag)
- [ ] 4.3.2 — Build create/edit forms
- [ ] 4.3.3 — Build API routes
- [ ] 4.3.4 — Battle-test CRUD
- [ ] 4.3.5 — Commit & push Phase 4.3

### Task 4.4 — Adhkar CRUD
- [ ] 4.4.1 — Build `/admin/adhkar` list (filter by category/morning/evening)
- [ ] 4.4.2 — Build create/edit forms with repeat counter
- [ ] 4.4.3 — Build API routes
- [ ] 4.4.4 — Battle-test CRUD
- [ ] 4.4.5 — Commit & push Phase 4.4

### Task 4.5 — Reminders CRUD
- [ ] 4.5.1 — Build `/admin/reminders` list
- [ ] 4.5.2 — Build create/edit forms
- [ ] 4.5.3 — Build API routes
- [ ] 4.5.4 — Battle-test CRUD
- [ ] 4.5.5 — Commit & push Phase 4.5

---

## Phase 5 — Subscriber & Subscription Management

### Task 5.1 — Subscriber Management
- [ ] 5.1.1 — Build `/admin/subscribers` list (search, filter by platform/status)
- [ ] 5.1.2 — Build subscriber detail view (with subscriptions + delivery history)
- [ ] 5.1.3 — Build subscriber actions: pause, resume, unsubscribe, blacklist
- [ ] 5.1.4 — Build API routes
- [ ] 5.1.5 — Battle-test
- [ ] 5.1.6 — Commit & push Phase 5.1

### Task 5.2 — Subscription Builder
- [ ] 5.2.1 — Build subscription form (content type, channel, schedule picker)
- [ ] 5.2.2 — Build timezone selector with search (full IANA database)
- [ ] 5.2.3 — Build schedule preview (shows next 5 delivery times in subscriber tz)
- [ ] 5.2.4 — Build API routes
- [ ] 5.2.5 — Battle-test
- [ ] 5.2.6 — Commit & push Phase 5.2

---

## Phase 6 — Public Website

### Task 6.1 — Public Home
- [ ] 6.1.1 — Build `/` (mobile-native hero, today's verse/hadith/dhikr)
- [ ] 6.1.2 — Build `PublicTopBar.astro` (theme toggle, subscribe CTA)
- [ ] 6.1.3 — Build `PublicBottomNav.astro` (Home, Quran, Adhkar, Subscribe)
- [ ] 6.1.4 — Battle-test
- [ ] 6.1.5 — Commit & push Phase 6.1

### Task 6.2 — Public Quran Reader
- [ ] 6.2.1 — Build `/quran` (surah list with ayah counts)
- [ ] 6.2.2 — Build `/quran/[surah]/[ayah]` verse detail
- [ ] 6.2.3 — Build `/quran/read` mushaf page flipper
- [ ] 6.2.4 — Battle-test
- [ ] 6.2.5 — Commit & push Phase 6.2

### Task 6.3 — Public Adhkar & Hadith
- [ ] 6.3.1 — Build `/adhkar` (categories: morning, evening, sleep, prayer)
- [ ] 6.3.2 — Build `/hadith` (browse by collection)
- [ ] 6.3.3 — Battle-test
- [ ] 6.3.4 — Commit & push Phase 6.3

### Task 6.4 — Subscribe Page (Public)
- [ ] 6.4.1 — Build `/subscribe` (phone E.164 input, channel picker, schedule picker)
- [ ] 6.4.2 — Build OTP-less WhatsApp onboarding flow via Bailey
- [ ] 6.4.3 — Build success page with next delivery preview
- [ ] 6.4.4 — Battle-test full onboarding
- [ ] 6.4.5 — Commit & push Phase 6.4

---

## Phase 7 — Channel Adapters

### Task 7.1 — Bailey (WhatsApp) Bot
- [ ] 7.1.1 — Build `lib/channels/whatsapp/bailey.ts` (connect, auth state, reconnect)
- [ ] 7.1.2 — Build QR pair flow (admin views QR at `/admin/channels/whatsapp`)
- [ ] 7.1.3 — Build message handlers (subscribe, unsubscribe, list, help, content fetch)
- [ ] 7.1.4 — Build outbound sender (text, image, template, list)
- [ ] 7.1.5 — Persist auth state to `bot_sessions`
- [ ] 7.1.6 — Battle-test: pair, send, receive, unsubscribe
- [ ] 7.1.7 — Commit & push Phase 7.1

### Task 7.2 — Telegram Bot
- [ ] 7.2.1 — Build `lib/channels/telegram/bot.ts` (long polling or webhook)
- [ ] 7.2.2 — Build command handlers (/start, /subscribe, /help, /verse, /hadith, /dhikr)
- [ ] 7.2.3 — Build outbound sender (text, media, inline keyboards)
- [ ] 7.2.4 — Battle-test
- [ ] 7.2.5 — Commit & push Phase 7.2

### Task 7.3 — Discord Bot
- [ ] 7.3.1 — Build `lib/channels/discord/bot.ts` (gateway connection)
- [ ] 7.3.2 — Build slash commands (subscribe, daily, verse, etc.)
- [ ] 7.3.3 — Build outbound sender (embeds, threads)
- [ ] 7.3.4 — Battle-test
- [ ] 7.3.5 — Commit & push Phase 7.3

### Task 7.4 — Facebook Messenger
- [ ] 7.4.1 — Build `lib/channels/messenger/bot.ts` (webhook receiver)
- [ ] 7.4.2 — Build webhook verifier
- [ ] 7.4.3 — Build outbound sender (Send API)
- [ ] 7.4.4 — Battle-test
- [ ] 7.4.5 — Commit & push Phase 7.4

---

## Phase 8 — Scheduler & Autoposter

### Task 8.1 — Scheduler Engine
- [ ] 8.1.1 — Build `lib/scheduler/engine.ts` (cron parser, due-job finder)
- [ ] 8.1.2 — Build worker loop (poll every 30s, claim jobs atomically, dispatch)
- [ ] 8.1.3 — Build delivery dispatcher (route to channel adapter, log to `delivery_log`)
- [ ] 8.1.4 — Build retry + backoff for failed deliveries
- [ ] 8.1.5 — Battle-test: schedule a job 2 min out, observe delivery
- [ ] 8.1.6 — Commit & push Phase 8.1

### Task 8.2 — Global Autoposter
- [ ] 8.2.1 — Build `/admin/posts` composer (pick content, write caption, schedule, pick targets)
- [ ] 8.2.2 — Build autoposter worker (publishes to all enabled channels + public site)
- [ ] 8.2.3 — Build platform-specific formatters (Twitter/X, FB Page, Instagram, Telegram channel)
- [ ] 8.2.4 — Build post status dashboard (per-channel success/failure)
- [ ] 8.2.5 — Battle-test
- [ ] 8.2.6 — Commit & push Phase 8.2

---

## Phase 9 — Admin Settings & Audit

### Task 9.1 — Settings
- [ ] 9.1.1 — Build `/admin/settings` (channels on/off, brand text, defaults)
- [ ] 9.1.2 — Build `/admin/settings/admins` (list env-defined admins, show only)
- [ ] 9.1.3 — Battle-test
- [ ] 9.1.4 — Commit & push Phase 9.1

### Task 9.2 — Audit Log
- [ ] 9.2.1 — Build `/admin/audit` (paginated, filter by actor/action/date)
- [ ] 9.2.2 — Build audit middleware that writes to `admin_audit` on every privileged API call
- [ ] 9.2.3 — Battle-test
- [ ] 9.2.4 — Commit & push Phase 9.2

---

## Phase 10 — Security Hardening & QA

### Task 10.1 — Security
- [ ] 10.1.1 — Add CSRF tokens on all state-changing forms
- [ ] 10.1.2 — Add rate limiter middleware (per-IP, per-route)
- [ ] 10.1.3 — Add security headers (CSP, HSTS, XFO, etc.) via middleware
- [ ] 10.1.4 — Audit all API routes for auth + scope
- [ ] 10.1.5 — Add input validation (zod) on every API route body
- [ ] 10.1.6 — Add output sanitization on user-generated content
- [ ] 10.1.7 — Battle-test: pentest own endpoints
- [ ] 10.1.8 — Commit & push Phase 10.1

### Task 10.2 — End-to-End QA
- [ ] 10.2.1 — Full admin CRUD pass on every content type
- [ ] 10.2.2 — Full subscriber onboarding on WhatsApp
- [ ] 10.2.3 — Full schedule + delivery cycle
- [ ] 10.2.4 — Full autopost cycle on at least 2 channels
- [ ] 10.2.5 — Light/dark toggle on every page
- [ ] 10.2.6 — Lighthouse mobile >= 90 on every public page
- [ ] 10.2.7 — Commit & push Phase 10.2

---

## Phase 11 — Finalize & Ship

- [ ] 11.1 — Update `README.md` with setup + env + run instructions
- [ ] 11.2 — Update `.env.example` to match all env vars actually consumed
- [ ] 11.3 — Final `astro build` passes
- [ ] 11.4 — Final commit & push, verify remote head hash

---

Subhaanaka Allahumma wa bihamdika, ash-hadu an laa ilaaha illa Anta,
astaghfiruka wa atoobu ilayk. Bismillah Ar-Rahman Ar-Raheem.
AlhamduliLLAH Rabbil-Aalameen. BaarakaLLAHu feek.
