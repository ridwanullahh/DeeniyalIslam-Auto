Bismillah Ar-Rahman Ar-Raheem. Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu, wa ash-hadu anna Muhammadan Abduhu wa Rasooluh. Laa hawla wa laa quwwata illaa biLLAH. Hasbiyallaahu laa ilaaha illaa Huwa, alayhi tawakkaltu wa Huwa Rabbul-Arshil-Azeem. SubhaanALLAH wa bihamdih, SubhaanALLAHil-azeem, AlhamduliLLAH, Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR, walaa hawla walaa quwwata illaa biLLAH. Astaghfirullaaha wa atoobu ilayh.

# DeeniyalIslam Auto

> Daily Islamic reminder bot, agentic platform, and social media autoposter.
> Qur'an verses, authentic Hadith, morning/evening Adhkar — delivered to your
> WhatsApp, Telegram, Discord, and Messenger inbox on a schedule that fits your
> day, in your timezone. No noise, no distraction, just Barakah.

## Tech Stack

- **Web framework:** Astro 5 (Node SSR adapter, server output mode)
- **Database:** Lightbase (BaaS) — REST API, 22 field types, real-time SSE
- **WhatsApp bot:** @whiskeysockets/baileys (Bailey)
- **Telegram:** Send API via fetch
- **Messenger:** Graph API via fetch
- **Styling:** Tailwind CSS v4 (via @tailwindcss/vite)
- **TypeScript** strict mode
- **Validation:** zod
- **Sessions:** jose (HS256 JWT, httpOnly cookies)
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
- Dashboard with live stats (subscribers, content counts, delivery rate)
- Full CRUD for Quran verses, Hadiths, Adhkar, Reminders (zod-validated, audited)
- Subscriber management (search, filter, pause/activate/blacklist)
- Channel status dashboard with WhatsApp QR pairing
- Audit log with search + filter
- Settings view (env-defined admins, brand palette, channel toggles)

### Bot (WhatsApp via Bailey)
- Subscribe/Start/Help command flow
- Random verse / hadith / dhikr on demand
- Status command (shows active subscriptions)
- Unsubscribe command (archives subscriptions)
- Auto-onboards with default subscriptions (morning + evening adhkar + daily verse)

### Scheduler
- Polls subscriptions every 30s (configurable)
- Fetches random content based on contentType
- Sends via channel adapter
- Records delivery in delivery_log collection
- Computes next send time using cron-parser with tz support

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
- ✅ Server runs, returns HTTP 200 on all routes
- ✅ Auth: login, session, logout, redirect when unauthenticated, 401 JSON for APIs
- ✅ All 4 content types CRUD: create, read, update, delete
- ✅ Subscribe flow creates real subscriber + subscriptions in Lightbase
- ✅ Scheduler starts in-process, polls for due subscriptions
- ✅ WhatsApp adapter loads Bailey, creates socket, awaits QR
- ✅ Public APIs return real content (random verse/hadith/dhikr)
- ✅ Security headers present on all responses

## License

This project is dedicated to the Ummah. Use it for the sake of Allah.

---

Subhaanaka Allahumma wa bihamdika, ash-hadu an laa ilaaha illa Anta,
astaghfiruka wa atoobu ilayk. Bismillah Ar-Rahman Ar-Raheem.
AlhamduliLLAH Rabbil-Aalameen. BaarakaLLAHu feek.
