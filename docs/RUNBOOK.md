# EduFarm Runbook — local self-host

> App: `web/` (Next.js 16 standalone) · DB: local Postgres 17 (`edufarm_dev`, `edufarm_prod`)
> Storage: Cloudflare R2 (private, presigned URLs) · Auth: Better Auth · AI: Gemini via OpenAI-compat gateway

## Daily start

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev --prefix "C:\Users\HomePC\Downloads\EDUFARM 2\web"
# open http://localhost:3000
```

## Env files (`web/`)

| File | Purpose | Committed? |
|---|---|---|
| `.env.example` | Template, no secrets | Yes |
| `.env` | Local defaults (Gemini model/base, bucket names) | **No** (git-ignored) |
| `.env.local` | **Wins over `.env`** — your real secrets live here | **No** (git-ignored) |

Required keys: `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ chars), `BETTER_AUTH_URL`.
Feature keys: `AI_API_KEY` + `AI_MODEL=gemini-3.5-flash` + `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai` (AI),
R2 `R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET/R2_ENDPOINT` (uploads),
`RESEND_API_KEY` (real emails; without it links log to the server console).
Restart the server after any env change.

## Database

```powershell
# migrate dev (default DATABASE_URL) / prod:
$env:DATABASE_URL = "<dev url>";  & "C:\Program Files\nodejs\npm.cmd" run db:migrate --prefix web; Remove-Item Env:\DATABASE_URL
$env:DATABASE_URL = "<prod url>"; & "C:\Program Files\nodejs\npm.cmd" run db:migrate --prefix web; Remove-Item Env:\DATABASE_URL

# first-time setup (role + DBs; safe to re-run):
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -f web\scripts\setup-db.sql
# NOTE: pgvector extension install is optional (only for future vector retrieval).

# backup (also via Task Scheduler nightly):
powershell -ExecutionPolicy Bypass -File web\scripts\backup.ps1
# dumps land in web\backups (git-ignored via /logs? no — keep; add if noisy)

# restore:
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U postgres -h localhost -d edufarm_dev -c "web\backups\<file>.dump"
```

Useful SQL (quote `"user"` — reserved word):
```sql
SELECT email, role, status, email_verified FROM "user";
UPDATE "user" SET role='admin', status='active' WHERE email='you@...';
UPDATE "user" SET email_verified=true WHERE email='you@...';
```

## Seed first admin (after migration)

```powershell
$env:DATABASE_URL="<url>"; $env:BETTER_AUTH_SECRET="<secret>"
& "C:\Program Files\nodejs\npm.cmd" --prefix web run seed:admin -- admin@university.edu "Admin Name" "StrongPass123!"
```

## Production mode (same machine)

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build --prefix web   # emits .next/standalone
$env:PORT="3100"; & "C:\Program Files\nodejs\node.exe" .next\standalone\server.js  # run from web\
```
Verified: `/api/health` 200 + landing 200 on standalone. For public access add
Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3000`) — no port-forward needed.

## E2E (36 checks, cleans up after itself)

```powershell
powershell -ExecutionPolicy Bypass -File web\scripts\e2e.ps1
# covers: signup→verify→login, courses, profile, assignments + draft/publish privacy,
# MCQ auto-marking, Q&A + reporting + moderation, verification approve,
# devotional publish→public, live AI answer, R2-missing 503.
```

## Deploy to Netlify (free `*.netlify.app` domain + auto-deploy)

Why Netlify fits: Next.js App Router runs there with zero code changes.
One hard rule: **Netlify cannot reach your PC's Postgres**, so production uses
a hosted Postgres (Neon free tier). Local dev keeps using local Postgres —
`DATABASE_URL` (dev, local) vs `DATABASE_URL_PROD` (Neon) already split this.

Repo is ready: `netlify.toml` (base `web`, build `npm run build`,
publish `.next`, Node 22). Auto-deploy = every push to `main` rebuilds.

1. **Neon** (neon.tech → sign up → New Project → Postgres 16):
   copy the **pooled** connection string
   (`postgres://user:pass@ep-xxx-pooler.../neondb?sslmode=require`).
   Paste it to your builder → migrations + seed run remotely.
2. **Netlify** (app.netlify.com → sign up → Add a new site → Import an
   existing project → GitHub → `Noble3000/EDUFARM-2`):
   base directory `web`, build command + publish auto-filled from `netlify.toml`.
3. **Site settings → Environment variables** — set all of these, then
   **Trigger deploy**:
   `DATABASE_URL` = Neon pooled string, `BETTER_AUTH_SECRET` (generate:
   any 48-char random), `BETTER_AUTH_URL` = `https://<your-site>.netlify.app`,
   `AI_API_KEY` / `AI_MODEL=gemini-3.5-flash` /
   `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`,
   `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` /
   `R2_BUCKET=edufarm-prod` (create it) / `R2_ENDPOINT`, `RESEND_API_KEY` +
   `EMAIL_FROM` (or leave email unset → links log to Function Logs).
4. First deploy gives you the URL → set it as `BETTER_AUTH_URL` → redeploy
   once (or set it before if you pre-named the site).
5. Register on the live site, promote yourself to admin via Neon SQL editor:
   `UPDATE "user" SET role='admin' WHERE email='you@...';`

Free-domain rename anytime: Site settings → Change site name → `edufarm.netlify.app`.

## Verify admin is working

1. `/login` → dashboard says “Welcome back!” (auth + DB ok).
2. `/admin` → sidebar + Overview (Total users ≥ 1, “All clear” when queues empty).
3. Users → your row (`admin`/`active`). Devotionals → draft → Publish → `/` shows it in gold.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| “Database not reachable” | Postgres service stopped → start `postgresql-x64-17`; or wrong `DATABASE_URL` |
| `/api/*` 401 | Not logged in (expected) — log in first |
| AI “not configured” | `.env.local` overrides `.env` — put keys in `.env.local`, restart |
| AI 404 model retired | List `/v1beta/openai/models`, set `AI_MODEL` to a live flash model |
| Upload 503 | R2 keys missing — expected until set; nothing else breaks |
| Emails never arrive | No `RESEND_API_KEY` — links print in server console (dev fallback) |
| Port 3000 busy | Old `node.exe` running — `Stop-Process` it or use prod on 3100 |
