Bismillah Ar-Rahman Ar-Raheem. Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu, wa ash-hadu anna Muhammadan Abduhu wa Rasooluh. Laa hawla wa laa quwwata illaa biLLAH. Hasbiyallaahu laa ilaaha illaa Huwa, alayhi tawakkaltu wa Huwa Rabbul-Arshil-Azeem. SubhaanALLAH wa bihamdih, SubhaanALLAHil-azeem, AlhamduliLLAH, Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR, walaa hawla walaa quwwata illaa biLLAH. Astaghfirullaaha wa atoobu ilayh.

# DeeniyalIslam Auto

> Daily Islamic reminder bot, agentic platform, and social media autoposter.
> Qur'an verses, authentic Hadith, morning/evening Adhkar — delivered to your
> WhatsApp, Telegram, Discord, and Messenger inbox on a schedule that fits your
> day, in your timezone. No noise, no distraction, just Barakah.

## Tech Stack

- **Web framework:** Astro 5 (Node SSR adapter, server output mode)
- **Database:** Lightbase (BaaS) — REST API, 22 field types, real-time SSE
- **WhatsApp bot:** @whiskeysockets/baileys (Bailey) — includes WhatsApp Status posting
- **Telegram:** Send API via fetch
- **Messenger:** Graph API via fetch
- **Solah times:** Aladhan API (free, no key required)
- **Media (Mushaf):** Cloudinary (optional, falls back to Lightbase storage)
- **Styling:** Tailwind CSS v4 (via @tailwindcss/vite)
- **TypeScript** strict mode
- **Validation:** zod
- **Sessions:** jose (HS256 JWT, httpOnly cookies)
- **Scheduling:** cron-parser v5 (CronExpressionParser) + custom salah-relative + interval engines
- **Logging:** pino

## Brand Palette

| Token | Hex |
|---|---|
| Primary Green | `#05B34D` |
| Accent Gold | `#F2B91C` |
| Dark (Midnight Slate) | `#181F25` |
| Light Background (Minted Glow) | `#E9FBF1` |
| White | `#FFFFFF` |

Light mode is the default. Dark mode is supported with a toggle in every header.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in real values
cp .env.example .env
# Edit .env with your Lightbase credentials and admin password

# 3. Run the dev server
npm run dev

# 4. Bootstrap the database (creates all collections + media bucket)
curl http://localhost:4321/api/bootstrap

# 5. Seed authentic Islamic content (125 documents: Quran, Hadith, Adhkar, Reminders)
curl http://localhost:4321/api/seed

# 6. Visit the site
#    Public:        http://localhost:4321/
#    Admin login:   http://localhost:4321/admin/login
#    Admin default: admin@deeniyalislam.auto (set in .env)
```

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key vars:

- `ADMIN_CREDENTIALS` — comma-separated `email:password` list (env-based, multi-admin)
- `LIGHTBASE_BASE_URL` — your Lightbase instance URL
- `LIGHTBASE_API_KEY` — root API key for the project
- `LIGHTBASE_PROJECT_ID` — the project to use
- `WHATSAPP_ENABLED` — `true` to start the Bailey bot on app boot
- `SCHEDULER_ENABLED` — `true` to run the scheduler in-process
- `SESSION_SECRET` — 32-byte hex secret for JWT signing

## Architecture

```
src/
├── components/        # Reusable Astro components
│   ├── ContentEditPage.astro  # Generic create/edit form
│   ├── ContentListPage.astro  # Generic list with search/filter/pagination
│   ├── Icon.astro             # 40+ inline SVG icons (no emoji)
│   └── ThemeToggle.astro      # Light/dark with localStorage
├── layouts/
│   ├── BaseLayout.astro       # Public layout (mobile-native, theme toggle)
│   └── AdminLayout.astro      # Admin shell (sidebar + bottom nav + drawer)
├── lib/
│   ├── admin/audit.ts         # Audit log writer
│   ├── admin/crud-factory.ts  # Generic CRUD handler factory
│   ├── auth/                  # JWT session, requireAdmin helper
│   ├── channels/              # Channel adapters
│   │   ├── registry.ts        # Lazy adapter loading
│   │   └── whatsapp/          # Bailey bot + message handlers
│   ├── content/seed-data.ts   # 125 authentic Islamic content entries
│   ├── lightbase/             # Lightbase client + schemas + bootstrap
│   ├── scheduler/engine.ts    # Polls for due subscriptions, dispatches
│   └── lifecycle.ts           # Background worker startup
├── middleware.ts              # Auth + security headers + worker startup
├── pages/
│   ├── admin/                 # Admin pages (auth-guarded)
│   │   ├── index.astro        # Dashboard home
│   │   ├── login.astro        # Login page
│   │   ├── quran/             # Quran CRUD
│   │   ├── hadith/            # Hadith CRUD
│   │   ├── adhkar/            # Adhkar CRUD
│   │   ├── reminders/         # Reminders CRUD
│   │   ├── subscribers/       # Subscriber management
│   │   ├── channels.astro     # Channel status + WhatsApp QR
│   │   ├── audit.astro        # Audit log
│   │   └── settings.astro     # Platform settings
│   ├── api/
│   │   ├── admin/             # Admin-only API routes
│   │   ├── public/            # Public read-only APIs
│   │   ├── subscribers/       # Public subscribe endpoint
│   │   ├── bootstrap.ts       # Collection bootstrapper
│   │   └── seed.ts            # Content seeder
│   ├── quran/                 # Public Quran browser
│   ├── hadith/                # Public Hadith browser
│   ├── adhkar/                # Public Adhkar browser
│   ├── subscribe.astro        # Public subscribe flow
│   └── index.astro            # Public home (daily verse/hadith/dhikr)
└── styles/global.css          # Brand palette, light/dark tokens
```

## Features

### Public
- Daily verse, daily hadith, daily dhikr (random selection, refreshable)
- Quran browser with search + surah filter
- Hadith browser with search + collection filter
- Adhkar browser by category (morning, evening, sleep, after-prayer, etc.)
- Subscribe flow with channel picker, content selection, timezone + schedule

### Admin
- Dashboard with live stats (subscribers, content counts, delivery rate, khatma + autopost counters)
- Full CRUD for Quran verses, Hadiths, Adhkar, Reminders (zod-validated, audited)
- Subscriber management (search, filter, pause/activate/blacklist)
- Channel status dashboard with WhatsApp QR pairing
- Khatma management (list with progress bars, create with 5 pace options + 3 schedule types)
- Autopost composer (WhatsApp Status + Telegram + Discord + Messenger + site_home)
- Mushaf Library (upload page images to Cloudinary or Lightbase, grid view with thumbnails)
- Audit log with search + filter
- Settings view (env-defined admins, guardrails, Cloudinary, Aladhan, brand palette)

### Bot (WhatsApp via Bailey) — Interactive Agent
- Multi-step conversation flows with auto-expire (10min)
- `subscribe` — onboards with default subscriptions
- `khatma` — 7-step setup wizard (pace → schedule → location → confirm)
- `khatma status/pause/resume/abandon`
- `manage` — toggle individual content types, set location, set timezone
- `set location City, Country` — auto-detects timezone from Aladhan, returns today's 5 salah times
- `set timezone Africa/Lagos` — validates IANA tz, saves
- `verse / hadith / dhikr` — random content on demand
- `status` — shows subscriptions + khatma progress
- `help` — full command list
- `unsubscribe` — archives all subscriptions

### Scheduler (3 schedule types, channel-agnostic)
- **cron**: standard UTC cron (e.g. `0 5 * * *` = 05:00 UTC daily)
- **salah_relative**: anchored to subscriber's salah time + offset (e.g. Fajr+15min, after every salah)
- **interval_minutes**: every N minutes from now
- Polls every 30s for due subscriptions + khatma pages + autoposts
- Fetches random content based on contentType
- Sends via channel adapter (respecting guardrails)
- Records delivery in delivery_log collection
- Computes next send time using the scheduling library (tz-aware for salah_relative)

### Khatma (Qur'an Reading Plans)
- 5 pace options: pages_per_day, pages_per_salah, pages_per_week, juz_per_week, complete_in_days
- Auto-computes pagesPerStep from targetDays
- Progress tracking (currentPage, deliveredCount, targetEndAt)
- Auto-completion with congratulations message
- 3 schedule types: salah_relative (recommended), cron, interval_minutes

### Autoposter (Global Broadcast)
- Targets: WhatsApp Status, Telegram, Discord (webhook), Messenger (Graph API), site_home, site_widget
- WhatsApp Status posts via Bailey's `status@broadcast` JID (image + caption or text)
- Compose + schedule from admin UI
- Per-channel execution log in autopost_log collection

### ToS Guardrails (Anti-Ban)
- Per-subscriber: 12/hour + 60/day hard caps (configurable via GUARD_* env vars)
- Min 60s delay between sends to the same subscriber
- Per-channel: 30/min global rate limit
- Honor opt-out: unsubscribed/blacklisted subscribers never receive messages
- Fail-open on errors (transient DB hiccups don't break delivery)

### Solah Times (Aladhan API)
- Free API, no key required
- Fetches by city/country or lat/lng
- Cached per subscriber per day in salah_schedules collection
- Auto-detects timezone from the API response
- Returns UTC instants for Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha

## Security

- httpOnly, SameSite=Strict, Secure-when-HTTPS session cookies
- HS256 JWT sessions with 12-hour expiry
- Per-IP rate limiting on login (5 attempts per 5 minutes)
- Per-IP rate limiting on subscribe (3 per 10 minutes)
- Security headers on every response (X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, COOP, CORP, Permissions-Policy, HSTS in prod)
- Astro 5 CSRF protection (Origin header check on state-changing requests)
- All API inputs validated with zod
- All admin actions recorded in audit log

## Battle-Tested

- ✅ Build passes (`astro build`)
- ✅ All 46 routes return HTTP 200/302 (public + admin + API)
- ✅ Auth: login, session, logout, redirect when unauthenticated, 401 JSON for APIs
- ✅ All 4 content types CRUD: create, read, update, delete
- ✅ Subscribe flow creates real subscriber + subscriptions in Lightbase
- ✅ Khatma subscribe flow: subscriber created → location set (Lagos → Africa/Lagos
  tz auto-detected from Aladhan) → khatma created with nextSendAt anchored to Fajr+15min
- ✅ Salah times conversion verified: Fajr in Lagos = 04:28 UTC = 05:28 Lagos local
- ✅ salah_reminder subscription correctly computes nextSendAt = tomorrow Fajr+15min
- ✅ Schema migration: existing subscriptions collection updated with 5 new schedule fields
- ✅ Scheduler starts in-process, runs 3 parallel workloads (subscriptions + khatma + autopost)
- ✅ WhatsApp adapter loads Bailey, creates socket, awaits QR
- ✅ WhatsApp Status posting via `status@broadcast` JID
- ✅ Guardrails: per-subscriber hourly/daily caps + min delay + channel rate limit + opt-out honor
- ✅ Cloudinary integration (falls back to Lightbase storage when disabled)
- ✅ Public APIs return real content (random verse/hadith/dhikr + Mushaf page metadata)
- ✅ Security headers present on all responses
- ✅ ToS-compliant rate limits prevent platform bans

## License

This project is dedicated to the Ummah. Use it for the sake of Allah.

---

Subhaanaka Allahumma wa bihamdika, ash-hadu an laa ilaaha illa Anta,
astaghfiruka wa atoobu ilayk. Bismillah Ar-Rahman Ar-Raheem.
AlhamduliLLAH Rabbil-Aalameen. BaarakaLLAHu feek.
