# EduFarm — Locked Local Stack (replaces Supabase/Vercel)

> Decision: no Supabase, no Vercel. Local Postgres + Better Auth + Cloudflare R2 + self-host on local device.
> This file supersedes Phase 2.1/2.3/2.5 hosting parts of `IMPLEMENTATION_PLAN.md`.

## 1. Database — local Postgres (what to use on your drive)

Use **Postgres 16 via Docker Compose** (recommended) so data lives on your local drive in a Docker volume you control:

```yaml
# docker-compose.yml (app + db)
services:
  db:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_USER: edufarm
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: edufarm_prod
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data   # <-- lives on your local drive
      - ./backups:/backups
volumes:
  pgdata:
```

- Why this image: `pgvector/pgvector:pg16` = stock Postgres 16 + `pgvector` extension for Phase 8 course-material AI retrieval. No Supabase needed.
- No Docker? Alternative: install Postgres 16 directly (EDB installer) + `CREATE EXTENSION vector;`, data dir e.g. `C:\PostgresData\EDUFARM`.
- ORM: **Drizzle ORM + drizzle-kit migrations** (`/drizzle/*.sql`). Better Auth has a Drizzle adapter. Alternative Prisma also works, but Drizzle is lighter for Next.js.
- GUI: **DBeaver Community** or **pgAdmin 4** pointed at `localhost:5432`. Connection string: `postgres://edufarm:***@localhost:5432/edufarm_prod`.
- Envs: `DATABASE_URL`, `DATABASE_URL_DEV=postgres://.../edufarm_dev`. Two DBs on same server keep dev/prod isolated.
- Backups (local-first): nightly `pg_dump -Fc edufarm_prod > ./backups/edufarm-$(date +%F).dump` via Task Scheduler + weekly `rclone`/script copy of latest dump to R2 `backups/` prefix. Restore drill in Phase 10: `pg_restore -d edufarm_prod`.
- No RLS like Supabase — enforce access in app layer (Better Auth session + role + ownership checks in every query) + least-privilege Postgres role for app (`GRANT SELECT/INSERT/UPDATE/DELETE`, no DDL).

Better Auth tables (auto via CLI) + EduFarm tables live side-by-side:
`user, session, account, verification` (Better Auth) + `student_profiles, lecturer_verifications, courses, enrollments, materials, announcements, live_sessions, assignments, submissions, tests, test_attempts, qa_threads, qa_replies, reports, devotionals, settings, ai_usage, audit_log` (per plan §2.2, `user.id` = FK).

## 2. Auth — Better Auth

- Lib: `better-auth` (Next.js App Router plugin) with Drizzle adapter + Postgres.
- Methods v1: email+password, email verification link (required for students), password reset. Lecturer extra step = `lecturer_verifications` row + `user.role` stays `lecturer_pending` until admin approves → flips to `lecturer`.
- Roles: `student | lecturer_pending | lecturer | admin`. Middleware (`middleware.ts`) checks session cookie + role per route group: `/dashboard/*` student+lecturer, `/lecturer/*` lecturer only, `/admin/*` admin only. Admin has no public signup — seed via `npm run seed:admin`.
- Email sending: Better Auth SMTP via Resend/Postmark (or local Mailpit in dev). Templates: verify, reset, lecturer approved/rejected.
- Sessions: database sessions (Better Auth default), 7-day expiry, revoke on password change + admin suspend.
- Env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000` (dev) / `https://<your-tunnel-domain>` (prod).

## 3. Storage — Cloudflare R2

- Buckets: `edufarm-dev`, `edufarm-prod` (or one bucket with `dev/`/`prod/` prefixes). Private, no public access.
- Structure: `materials/{courseId}/{id}-orig.pdf`, `submissions/{assignmentId}/{studentId}-...`, `evidence/{userId}-...`, `devotional-covers/...`, `backups/...`.
- SDK: AWS S3-compatible (`@aws-sdk/client-s3` pointed at `https://<accountid>.r2.cloudflarestorage.com`, keys `R2_ACCESS_KEY_ID/SECRET`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL` unused — all private).
- Download gating (PRD rule): NEVER expose R2 URLs. App issues short-lived presigned URLs only after checking `materials.allow_download` (or owner/lecturer/admin bypass for view): `GET /api/materials/[id]/view|download` → `getSignedUrl(s3, GetObjectCommand, {expiresIn: 120})`. View streams inline, download sets attachment header.
- Uploads: direct-to-R2 via presigned PUT (≤25MB materials, ≤10MB submissions/evidence, MIME allowlist PDF/DOCX/PPTX/PNG/JPG/TXT) or proxied multipart for simplicity in v1. Virus-scan hook placeholder (ClamAV container later).
- Doc extraction for course setup stays server-side: download bytes from R2 temp key → `pdfjs/mammoth` parse → regex candidates → discard temp file, keep only confirmed enrollments.

## 4. Hosting — local device (no Vercel)

- App: **Next.js standalone** (`output: 'standalone'` in `next.config`), run `npm run build && npm start` or Docker:
```dockerfile
FROM node:20-alpine AS runner
COPY .next/standalone ./\nCOPY .next/static ./.next/static\nCMD ["node","server.js"]
```
Compose adds `app` service (port 3000) depending on `db`, env file `.env.prod`.
- Process: PM2 (`pm2 start npm -- start`) or Docker restart policy. Logs to `./logs`.
- Reverse proxy: **Caddy** (`:80/:443`, auto-HTTPS) `reverse_proxy localhost:3000`. Caddyfile committed as `Caddyfile`.
- Public access options (pick one): (a) **Cloudflare Tunnel** (`cloudflared tunnel --url http://localhost:3000`) — no port-forward, free TLS, recommended for campus; (b) port-forward 80/443 + DynDNS; (c) LAN-only + Tailscale for pilot.
- Caching: no edge. Use Next ISR/file cache for landing + current devotional (60s), `fetch` cache for dashboard aggregates server-side, paginate Library 20/page. Budget <2.5s LCP on typical campus link; test throttled.
- Cron on host: devotional scheduler (publish when `publish_at<=now` via `node-cron` or pg_cron), backup job, AI retention purge.
- Rollback: keep last 3 Docker images / `.next` builds + `pg_dump` before migrate. Rollback = stop, retag previous, restore dump if migration broke data.

## 5. Env template (.env.example)

```env
DATABASE_URL=postgres://edufarm:change-me@localhost:5432/edufarm_prod
BETTER_AUTH_SECRET=change-me-32-chars
BETTER_AUTH_URL=http://localhost:3000
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=edufarm-prod
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
AI_PROVIDER=openai-compatible
AI_API_KEY=xxx
AI_MODEL=xxx
RESEND_API_KEY=xxx
```

## 6. What changes vs old Supabase plan

| Old | New |
|---|---|
| Supabase Auth | Better Auth (sessions in local Postgres) |
| Supabase Storage buckets | R2 private buckets + presigned URLs |
| Supabase RLS policies | App-layer checks (session+role+owner) + tests per role |
| Supabase Edge Functions | Next Route Handlers (`/api/*`) on local Node |
| Supabase pgvector managed | `pgvector/pgvector:pg16` local |
| Vercel previews/rollback | `docker compose up --build`, image tags, `pg_restore` |
| Vercel/Supabase secrets | `.env` on device only |

Docs to update next (once `IMPLEMENTATION_PLAN.md` is closed in editor): patch §2.1/2.3/2.5, Appendix A (`/drizzle/`, `docker-compose.yml`, `Caddyfile`), Phase 10 checklist (seed admin, tunnel URL, backup verify).
