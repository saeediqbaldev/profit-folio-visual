
# Migration Plan: Supabase → Self-Hosted PostgreSQL

## Scope confirmation

You picked:
- **Single Docker container** with frontend + Node/Express backend + PostgreSQL
- **Hardcoded frontend-only auth** (`Saeeddev` / `Saeed@@2026&&`) — I'll note this is insecure but build it as requested
- **Fresh DB** (no data migration)
- **Local filesystem** for screenshot uploads

This is a large refactor. Every page currently talks to Supabase directly. I will rewrite all data access to hit a new REST API instead.

---

## 1. New backend (`/server` folder in repo)

Node.js + Express + `pg` (node-postgres), bundled into the same Docker image as the frontend.

**Endpoints (single admin, no user_id scoping needed):**

```
POST /api/auth/login              → validates hardcoded creds, returns { ok: true }
GET    /api/trades                → list forex trades
POST   /api/trades                → create
PUT    /api/trades/:id            → update
DELETE /api/trades/:id            → delete (also supports bulk via body)
GET    /api/psx-trades            → list PSX trades
POST   /api/psx-trades            → create
PUT    /api/psx-trades/:id
DELETE /api/psx-trades/:id
GET    /api/strategies            → list strategies
POST   /api/strategies
DELETE /api/strategies/:id
GET    /api/profile               → admin profile (display name, avatar)
PUT    /api/profile
GET    /api/activity-logs
POST   /api/uploads               → multipart, saves to /data/uploads, returns URL
GET    /uploads/:filename         → static file serve
GET    /api/public/trades         → for PublicSharePage (no auth)
GET    /api/public/profile
```

CORS allows same-origin only. Backend serves the built React app from `/` and the API from `/api`.

## 2. Database schema (init.sql)

Tables: `profile` (single row), `trades`, `psx_trades`, `strategies`, `activity_logs`, `share_settings`.
Drops all `user_id`, RLS, and auth tables. Auto-seeds the admin profile + default strategies (Strategy 1/2/3) on first boot.

## 3. Frontend changes

- **Delete:** `src/components/auth/AuthPage.tsx` signup flow, `src/hooks/useUserRole.tsx`, `supabase/` folder, `src/integrations/supabase/*`
- **New:** `src/lib/api.ts` — thin fetch wrapper for the REST API
- **New:** `src/hooks/useAuth.tsx` — replaces Supabase auth, checks `localStorage.adminLoggedIn` against hardcoded creds
- **Rewrite hooks:** `useTrades`, `usePsxTrades`, `useStrategies` to call `/api/*` instead of `supabase.from(...)`
- **AuthPage:** single login form only (username + password), no signup, no forgot password, no email verification
- **AdminPage:** remove user-management section (no users to manage), keep system info
- **ProfilePage:** edit single admin profile (display name + avatar)
- **PublicSharePage:** fetch from `/api/public/*`
- **Keep unchanged:** all UI components, styling, charts, calendar, filters, layouts, animations, candle loader, progress toasts, lightbox, theming

## 4. Docker setup (single container)

```
Dockerfile        → multi-stage: build React → install server deps → install Postgres → supervisord runs postgres + node
docker-compose.yml → for local testing
init.sql          → schema + seed
/data             → volume mount for Postgres data + uploads
```

Container exposes port `3000`. Postgres runs internally on `127.0.0.1:5432`, not exposed.

## 5. Coolify deployment guide (delivered as `DEPLOY_COOLIFY.md`)

Step-by-step:
1. Push repo to GitHub
2. In Coolify: New Resource → Application → Dockerfile-based
3. Connect GitHub repo, set build pack = Dockerfile
4. Add persistent volume: `/data` → `/data`
5. Set domain + enable Let's Encrypt SSL
6. Deploy, verify login works
7. Backup strategy (cron `pg_dump` to volume)

---

## Files I will create / modify

**Create:**
- `server/index.js`, `server/db.js`, `server/routes/*.js`
- `server/package.json`
- `init.sql`
- `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `supervisord.conf`
- `src/lib/api.ts`
- `DEPLOY_COOLIFY.md`

**Rewrite:**
- `src/hooks/useAuth.tsx`, `useTrades.tsx`, `usePsxTrades.tsx`, `useStrategies.tsx`
- `src/components/auth/AuthPage.tsx`
- `src/pages/PublicSharePage.tsx`, `ProfilePage.tsx`, `AdminPage.tsx`
- All components currently importing `@/integrations/supabase/client`

**Delete:**
- `src/integrations/supabase/`, `supabase/` folder, `REPLIT_CLONE_PROMPT.md` references to Supabase

---

## ⚠️ Important warnings

1. **Frontend-only auth is insecure.** Anyone who opens browser devtools can bypass it and call your API directly (the API will have no auth either, since you said hardcoded frontend check). If this app is ever exposed on the public internet as SaaS, anyone who knows your domain can hit `/api/trades` and read/modify everything. I strongly recommend at least adding the same password check on the backend (Basic Auth header). **Want me to add backend Basic Auth using the same credentials?** It's ~10 lines and keeps your data safe.

2. **"SaaS" with a single hardcoded user** means only you can log in. If you meant multiple customers each with their own account, this plan won't support that — let me know.

3. **Lovable Cloud is currently enabled** on this project. After this migration, the Lovable preview won't be able to run the backend (no Node server in preview). You'll only be able to test locally via Docker or after deploying to Coolify. The preview will show the frontend with login screen, but API calls will fail.

Confirm and I'll execute, or tell me what to adjust (especially items #1 and #2).
