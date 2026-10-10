# EduFarm — Detailed Implementation Plan

Source: `PRD/EduFarm.md` (342 lines, working PRD)
Repo state at planning time: `README.md` + `PRD/` only, `main` in sync with `origin/main`. No app code yet.
Principle: Every feature must make an academic task easier, improve trust, or support the community. If it adds complexity without clear value, leave it out of v1.

---

## 0. What we are building (PRD summary)

Trusted academic ecosystem for one university. Students find lecturer-confirmed materials, deadlines, announcements, live-session links, Q&A, assignments/tests/results, and AI help in one place. Lecturers share resources, manage course activity, and use AI with human review. Admins verify lecturers, moderate reports, publish devotionals, and monitor activity.

Landing is academic-first + prominent Word of God devotional (admin-written, no AI generation).

Out of scope for v1: private messaging, social feeds, gamification, recommendations, hosted video, proctoring, complex permissions/analytics, AI auto-publish, payments.

Acceptance anchors (§8): direct-to-dashboard login, role-choice-before-form, lecturer approval gate, review-before-add course extraction, lecturer-confirmed label only when confirmed+published, download only when permitted, sessions central+in-course, private-until-published grades, AI source transparency, devotional visibility gate, recorded moderation outcomes, minimal steps.

---

## Phase 0 — Decisions to confirm + project setup

Goal: remove ambiguity from PRD §10 before code.

### 0.1 Decisions checklist (need owner + date)
1. University email rule: exact domain(s), e.g. `@univ.edu`. Allowlist vs regex? What about alumni/forwarders?
2. Lecturer verification evidence: staff ID, appointment letter, department approval? Who approves, SLA?
3. Admin creation: seed super-admin via env, no public signup. Define admin invite flow.
4. AI provider + limits: provider (e.g. OpenAI-compatible), per-user daily caps, file size limits, retention window, privacy wording for consent.
5. File limits: material upload max (e.g. 25MB), assignment submission max, allowed MIME (PDF, DOCX, PPTX, images, TXT).
6. Session/academic-year model: single active session vs archive? Filter values for Library.
7. Handwritten blueprint order: locate that blueprint and freeze nav order. PRD §6 says preserve it.
8. Screenshot references: locate uploaded screenshots, extract tokens (spacing, radius, motion).

### 0.2 Repo / workflow setup
- Branching: `main` protected, feature branches `feat/*`, `fix/*`, PR with checklist (acceptance + screenshots mobile/desktop).
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- CI: lint + typecheck + unit tests + build on PR. Preview deploys per PR.
- Environments: `dev` / `staging` / `prod` with separate DB/storage buckets and env vars.
- Secrets: never commit. Use env provider (Vercel/Supabase secrets).

Exit criteria: checklist signed off, CI green on empty app shell.

---

## Phase 1 — Design system + UX foundation

Goal: PRD §6 visual principles as buildable tokens/components. Do this once, reuse everywhere.

### 1.1 Tokens
- Color: light/dark via CSS variables. Primary academic (e.g. deep green/navy for trust), accent for devotional (warm gold, restrained). Sufficient contrast AA. Focus ring visible.
- Typography: one sans stack, scale (12/14/16/20/24/32), line-height ≥1.5 body, readable on mobile.
- Spacing: 4pt base, clean generous whitespace per screenshots.
- Radius: rounded cards (12–16px), pills for status, 8px inputs/buttons.
- Motion: restrained — 150–200ms ease for state change only (accordion, dialog, toast). No decorative animation. `prefers-reduced-motion` respected.
- Elevation: subtle shadow for cards/dialogs only.

### 1.2 Core components (build in isolation with stories)
Layout: AppShell, TopNav, SideNav (desktop) / BottomNav (mobile), PageHeader, EmptyState, ErrorState, LoadingSkeleton.
Primitives: Button (primary/secondary/ghost/destructive), Input, Textarea, Select, Checkbox, Radio, FileDropzone, DateTimePicker, Badge/StatusPill, Card, Tabs, Accordion, Dialog, Toast, Avatar, Breadcrumbs, Pagination, SearchBar + FilterChips.
Domain: CourseCard, MaterialRow (with confirmed badge + lecturer name + download gate), AnnouncementCard, SessionCard (upcoming/past + Join), AssignmentRow (status pill), QAThread, DevotionalCard, VerificationQueueRow, ReportRow.
States for every component: loading / empty / success / error (PRD §6 requirement).

### 1.3 Navigation IA (freeze early, cross-check blueprint)
Public: `/`, `/login`, `/register` (role-choice first → `/register/student`, `/register/lecturer`), `/forgot-password`.
Student: `/dashboard` (activity first), `/courses`, `/courses/[id]`, `/library`, `/sessions`, `/assignments`, `/discussions`, `/ai`, `/results`.
Lecturer: `/lecturer/dashboard`, `/lecturer/courses`, `/lecturer/materials`, `/lecturer/sessions`, `/lecturer/assignments`, `/lecturer/marking`, `/lecturer/ai`.
Admin (`/admin`, protected, no public link): `/admin`, `/admin/users`, `/admin/verification`, `/admin/moderation`, `/admin/devotionals`, `/admin/analytics`, `/admin/settings`.
Rule: no duplicate destinations, one canonical route per task.

### 1.4 Responsive + accessibility
- Mobile-first, touch targets ≥44px, readable text, consistent page grid (max-w-6xl, 16–24px gutters).
- Labels for all inputs, focus states, keyboard nav for dialogs/menus, alt text, contrast check in CI (axe).
- Device test matrix: 360px Android, 768px tablet, 1280px desktop, slow 3G throttle for dashboard.

Exit criteria: component gallery page renders all states in light/dark, a11y lint passes, nav map approved against blueprint.

---

## Phase 2 — Architectural decisions

### 2.1 Recommended stack (low-ops, campus-friendly)
- **Frontend + BFF: Next.js 14+ (App Router, TypeScript) + Tailwind + shadcn/ui.** One deploy, SSR for landing/devotional SEO, RSC for dashboard speed. Alternative if team prefers MERN: React Vite + Express — heavier ops, not recommended for v1.
- **Backend services: Supabase (Postgres + Auth + Storage + Edge Functions).** Gives us: managed Postgres with RLS, email auth + verification, file buckets with signed URLs for download gating, cron for devotional scheduling. Alternative: Firebase — weaker relational modeling for courses/assessments; avoid.
- **Hosting: Vercel (app) + Supabase Cloud (data).** Preview envs, fast dashboard on campus connections via edge caching of public pages only (never cache private grades).
- **Email: Supabase Auth email + transactional provider (Resend/Postmark) for verification, password reset, lecturer decision notices.**
- **Doc extraction: client upload → Edge Function parses PDF/DOCX text (pdfjs / mammoth) → heuristic regex for code/title/lecturer/units → returns candidates for human review.** Never auto-save. Store raw file + extracted JSON for audit.
- **AI: provider-agnostic gateway (`/api/ai/*`) with adapter interface.** Start with one OpenAI-compatible provider. Enforce: per-role system prompts, course-scoped retrieval (see 2.4), usage caps, logging without storing grades/PII beyond retention window. Lecturer outputs always `draft` until explicit publish.
- **Analytics: minimal event table + server-aggregated charts (Recharts).** No heavy BI in v1.

Why this fits PRD §9: RLS enforces role privacy, signed URLs enforce download permission, Postgres models relations cleanly, Edge caching keeps dashboard fast, single codebase keeps it maintainable.

### 2.2 Data model (v1 tables)
```
users(id, role: student|lecturer|admin, email, email_verified_at, name, avatar_url, status, created_at)
student_profiles(user_id, matric_no, department, level)
lecturer_verifications(id, user_id, evidence_urls[], department, status: pending|approved|rejected, reviewer_id, decided_at, note)
courses(id, code, title, lecturer_name, unit_load, session, owner_lecturer_id?, created_by, is_official_verified=false)
enrollments(id, student_id, course_id, source: manual|document, created_at) unique(student,course)
materials(id, course_id, uploader_id, title, type: note|past-question|guide|other, session, file_path, allow_download bool, status: draft|confirmed|published, confirmed_by, confirmed_at)
announcements(id, course_id, author_id, body, published_at)
live_sessions(id, course_id, host_id, title, meeting_url, starts_at, ends_at, instructions, status derived upcoming/past)
assignments(id, course_id, author_id, title, instructions, due_at, allow_file bool, allow_text bool)
submissions(id, assignment_id, student_id, file_path?, body_text?, status: submitted|marking|published, score?, feedback?, feedback_draft?, published_at?) — student sees score/feedback only if status=published
tests(id, course_id, author_id, title, questions jsonb, duration_min, due_at) + test_attempts(id, test_id, student_id, answers jsonb, submitted_at, score?, status)
qa_threads(id, course_id, author_id, question, created_at) + qa_replies(id, thread_id, author_id, body)
reports(id, reporter_id, target_type: material|thread|reply, target_id, reason, status: open|dismissed|actioned, resolution_note, reviewer_id)
devotionals(id, title, verse_ref, body, cover_path?, status: draft|scheduled|published|hidden, publish_at?, show_on_landing bool, author_id, history jsonb)
settings(id singleton, site_name, support_email, maintenance_mode, default_session)
ai_usage(id, user_id, scope: general|course:{id}|lecturer-draft, tokens, created_at) for caps
audit_log(id, actor_id, action, entity, entity_id, at)
```

RLS sketch: students read only their enrollments/submissions/scores where published; lecturers manage only their courses/materials/sessions/assignments; admins full read + moderation/verification/devotional/settings write. Enforce download: `materials.allow_download` checked before issuing signed URL; viewer streams via signed URL with short TTL, no direct bucket public access.

### 2.3 API surface (Next Route Handlers → Supabase)
- Auth: `POST /api/auth/register/student|lecturer`, `POST /api/auth/verify-email`, `POST /api/auth/login` (Supabase Auth underneath), `POST /api/auth/forgot/reset`.
- Courses: `GET/POST /api/courses`, `POST /api/courses/extract` (parse upload → candidates), `POST /api/courses/confirm-add`, `GET /api/courses/[id]/overview` (materials+announcements+sessions+qa+assessments aggregated).
- Library: `GET /api/library?course=&lecturer=&type=&session=&q=` + `GET /api/materials/[id]/view|download` (permission-checked signed URL).
- Sessions: `GET/POST /api/sessions`, central + per-course.
- Announcements/Q&A: CRUD + `POST /api/reports`.
- Assessments: lecturer CRUD assignments/tests, student submit, lecturer draft-mark → publish. `GET /api/results` (published only for students).
- Devotional public: `GET /api/devotional/current` (only published + show_on_landing + publish_at<=now). Admin CRUD + schedule + preview token.
- Admin: verification queue, moderation queue, overview stats, settings.
- AI: `POST /api/ai/student` (general/course, returns answer + `source: course-material|general` + citations), `POST /api/ai/lecturer/draft` (returns draft id, never publishes directly).

### 2.4 AI retrieval design (transparency requirement)
- Ingest: on material confirm, chunk text, embed, store per-course vectors (pgvector). Student course-AI retrieves top-k chunks with course filter, cites material title + lecturer. If no chunks, label `general` explicitly.
- Lecturer-AI: no auto-publish; drafts saved with `ai_generated=true`, lecturer edits → publishes. Watermark drafts in UI.
- Guardrails: block grade/mark disclosure via AI; rate-limit; redact PII from prompts; retention auto-purge.

### 2.5 Security / privacy / reliability / performance
- Security: bcrypt via Supabase Auth, email verification tokens single-use, lecturer evidence in private bucket, role middleware on every route + RLS, audit log for verification/moderation/grade publish.
- Privacy: RLS + API checks ensure students see only own grades/feedback; no grade leakage in AI or activity feeds.
- Reliability: resumable uploads (tus), confirm dialogs for submissions, autosave text answers to localStorage + server draft, idempotency keys on submit.
- Performance: dashboard aggregates in one query, paginate Library (20/page), edge-cache landing + current devotional (60s ISR), lazy-load AI panel, compress images, budget <2.5s LCP on 3G for dashboard.

Exit criteria: ADR docs merged for stack/auth/storage/AI, ERD reviewed, RLS policies tested with role fixtures.

---

## Phase 3 — Foundation + landing + role auth (PRD §5.1, §5.2 + build step 12)

Tasks:
1. App shell, tokens, TopNav/Footer, light/dark toggle.
2. Landing sections in order: hero+Create/LogIn, key features, How It Works, featured courses/materials, devotional preview, CTA, footer. Academic-first hierarchy, devotional prominent but secondary.
3. Role-choice screen → role-specific forms. Student form (name, uni email, password, matric/dept/level). Lecturer form (+ department, evidence upload). Friendly errors + retry.
4. Email verification flow (link + resend + expired handling). Lecturer pending state (“under review”) with no lecturer nav until approved.
5. Separate admin login (`/admin/login`, no signup link, rate-limited, 2FA optional flag).
6. E2E: register student → verify → login lands on `/dashboard` directly (acceptance).

---

## Phase 4 — Access control + student/lecturer dashboards (build step 13)

1. Middleware: require auth, require role, require lecturer-approved, require admin.
2. Lecturer verification queue (admin): pending list, evidence viewer, approve/reject with note → email notice.
3. Student dashboard: activity-first — deadlines, action-required assignments, announcements, recent course activity. Cards with primary CTA (Submit / View / Join). No metric bloat.
4. Lecturer dashboard: my courses, pending marking count, upcoming sessions, recent Q&A, AI drafts.
5. Empty states (“No deadlines — you’re caught up”) + skeletons.

Acceptance: lecturer cannot access lecturer routes pre-approval; student login → dashboard, not welcome screen.

---

## Phase 5 — Courses + announcements + Library (build step 14)

1. Manual add course (code/title/lecturer/units/session) + document upload → extract → review/correct screen → confirm-add. Flag `is_official_verified=false` always in v1.
2. Enrollments + My Courses list + course overview page (tabs: Materials | Announcements | Sessions | Q&A | Assessments).
3. Announcements: lecturer composer + publish, student feed (course + global dashboard merge).
4. Library: unified search + filters (course primary, lecturer/type/session secondary), material detail with confirmed badge + confirming lecturer + viewer. Upload → draft → confirm → publish flow for lecturers. Download button only if `allow_download`; otherwise view-only with notice.
5. Storage policies + virus-scan hook placeholder + MIME/size validation.

Acceptance: extraction editable before add; only confirmed+published shows badge; download gated.

---

## Phase 6 — Live sessions + Q&A + reporting (build step 15)

1. Lecturer session form: course, title, meeting URL (validate https, allow Meet/Zoom), date/time + timezone label, instructions. Upcoming/past derived from now. Edit/cancel.
2. Central `/sessions` (grouped upcoming/past, filter by course) + in-course tab. Prominent Join button (external, `rel=noopener`).
3. Q&A: threads + replies per course, separate visual treatment from announcements. Report button on materials/threads/replies → `reports` open queue.
4. Moderation v0: report creates row; admin triage in later phase but report capture + user confirmation (“Thanks, we’ll review”) ships here.

Acceptance: session appears both places; Join easy to find.

---

## Phase 7 — Assignments, tests, marking, results (build step 16)

1. Lecturer builder: assignment (instructions, due date, allow file/text toggles) + simple test (MCQ/short-answer, duration, due). No proctoring.
2. Student: assignment detail with deadline countdown + status pill, file dropzone +/or rich textarea (autosave), submit confirmation receipt. Test runner: one question at a time, timer, submit → “Received” confirmation.
3. Marking: lecturer queue (Submitted → Marking), score + written feedback, Save draft vs Publish. Publish flips to `published` + timestamp, triggers student visibility + notification.
4. Results: student sees only published own scores/feedback; lecturer sees course table; admin sees counts only (no grade content unless moderating).
5. Late/missing logic: `Not started` (before due, no submit), `Submitted`, `Marking`, `Published`. Overdue label after due.

Acceptance: private-until-published verified by role-fixture tests.

---

## Phase 8 — AI assistants (build step 17)

1. Student AI: `/ai` general + in-course widget. Modes: explain, summarize, practice questions, exam prep. Response header shows `Based on: [Course material: Title — Lecturer]` vs `General knowledge`. Citations link to Library item.
2. Lecturer AI: outline drafter, material summarizer/adapter, assignment/test + marking-guide generator → saved as drafts with Approve/Edit/Discard. No direct publish from AI.
3. Caps + transparency: token meter, “AI can be wrong — confirm with lecturer material” notice, feedback thumbs.
4. Safety: prompt-injection strip, no grade/PII leakage, audit `ai_usage`.

Acceptance: user can distinguish sources in every answer; lecturer outputs require explicit publish.

---

## Phase 9 — Admin + devotional (build step 18)

1. Admin overview: active users, student/lecturer counts, registration trend (7/30d sparkline), academic activity (submissions, uploads), verification pending count. Simple cards + 2 charts max.
2. Users: search, profile drawer, status suspend/reactivate (audit-logged).
3. Verification queue: pending/approved/rejected tabs, evidence viewer, decision + note.
4. Moderation: reported queue with context preview, Dismiss / Remove / Action + resolution note (required). Outcome recorded + reporter notified (“Reviewed”).
5. Analytics: key figures + trend charts only.
6. Settings: site name, support email, default session, maintenance toggle, appearance default. Kept separate from verification/moderation/analytics/devotional.
7. Devotionals: list + history, composer (title/verse/body/cover), preview (public-styled), publish now / schedule / unpublish / hide, `show_on_landing` toggle. Public API returns only eligible row. Landing section hidden if none eligible.

Acceptance: only eligible devotional appears publicly; moderation always records outcome.

---

## Phase 10 — Hardening, testing, launch (build step 19)

1. Full journeys on desktop+mobile: student register→courses→library→submit→results; lecturer verify→upload→announce→session→mark→publish; admin verify→moderate→devotional.
2. Remove friction: step counts, duplicate links, confusing labels. Usability gate: core tasks ≤3 clicks from dashboard.
3. NFR pass: RLS penetration tests per role, download-gate tests, grade-privacy tests, 3G perf, axe a11y, backup/restore drill, upload-failure retry tests.
4. Launch checklist: seed admin, verify email deliverability, AI caps + privacy page, support email, status page, rollback plan (Vercel instant rollback + Supabase PITR).
5. Post-launch metrics (PRD §2): registrations, active students/lecturers, confirmed materials, submissions, moderation resolution time.

---

## Appendix A — File / folder proposal

```text
/app/(public)/page.tsx                    # landing
/app/(public)/devotional/[id]/page.tsx
/app/(auth)/register/page.tsx             # role choice
/app/(auth)/register/student|lecturer/page.tsx
/app/(auth)/login/page.tsx
/app/student/dashboard/page.tsx
/app/student/courses/... /library/... /sessions/... /assignments/... /ai/...
/app/lecturer/...  /app/admin/...
/components/ui/*  /components/domain/*
/lib/auth.ts /lib/rls.ts /lib/storage.ts /lib/ai-gateway.ts /lib/extract.ts
/supabase/migrations/*  /supabase/seed.sql
/docs/IMPLEMENTATION_PLAN.md  /docs/ADRs/  /docs/ERD.png
```

## Appendix B — Risks + mitigations
- Lecturer verification bottleneck → clear evidence guide + SLA + bulk-approve for known staff emails.
- Doc extraction inaccuracy → always human-reviewed, show confidence + raw text side-by-side.
- AI hallucination eroding trust → source labels + citations + lecturer-review gate.
- Campus bandwidth → paginate, compress, ISR public pages, skeleton-first dashboard.
- Scope creep (payments, messaging) → enforce §7 defer list in PR reviews.

## Appendix C — Rough sequencing (single small team)
- P0–P2: 1–2 weeks (decisions, design system, architecture)
- P3–P4: 2 weeks (landing, auth, dashboards, verification)
- P5–P6: 2 weeks (courses, library, sessions, Q&A)
- P7: 2 weeks (assessments + marking — highest complexity)
- P8: 1–2 weeks (AI + retrieval)
- P9: 1 week (admin + devotional)
- P10: 1 week (hardening + launch)
Total ~10–12 weeks to MVP with 2–3 builders. Cut scope, never quality gates (privacy, grade visibility, download gating).
