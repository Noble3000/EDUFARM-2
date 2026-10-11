# EduFarm

[![Netlify Status](https://api.netlify.com/api/v1/badges/4881bbf1-3740-45f7-8393-90fd97a8c554/deploy-status)](https://app.netlify.com/projects/edufarm-app/deploys)

*A trusted academic ecosystem for students and lecturers*

EduFarm connects students and lecturers through course activity, lecturer-confirmed learning materials, assessments, live-session information, course announcements and Q&A, and AI learning support. It is not a PDF marketplace — it helps students find reliable academic information and gives lecturers a central place to guide learning.

> Status: Working PRD — ready for design and build planning
> Initial launch: One university first
> Guiding principle: Simple, seamless, and useful; avoid unnecessary complexity

## Vision

Make trusted academic resources and lecturer-to-student communication easier to access, understand, and act on.

Problems addressed:
- Students preparing from inaccurate, outdated, or unconfirmed files circulating among classmates
- Lecturer updates, deadlines, resources, and class links scattered across channels
- No single place to find course resources, submit work, and view published feedback
- Lecturers needing simple tools for sharing resources, managing course activity, and using AI while retaining control

The landing page introduces EduFarm's academic purpose first, with a Word of God devotional as a prominent complementary section, written and managed by administrators.

## Users

**Students**
- Register with university email + verification
- Sign in with email/password → goes directly to Student dashboard (no extra welcome screen)
- Add courses manually or via registration-document upload with review/correct step
- Access courses, Library, live sessions, announcements, Q&A, AI help, assignments, tests, published results

**Lecturers**
- Register via Lecturer path + additional verification before privileges are enabled
- Manage courses/students, upload and confirm learning materials, publish announcements, post live-session links, manage assessments
- Use AI to draft teaching resources/assessments, with review/approve before sharing

**Administrators**
- Review lecturer verification and user status
- Manage devotional content + landing-page visibility
- Review reported materials/discussions and record moderation outcomes
- Monitor active users, registrations, academic activity, uploads, pending verification
- Manage essential platform settings and appearance (light/dark)

## Core Features (MVP)

1. **Landing page** — headline + explanation, hero + account actions, key features, How It Works, featured courses/materials, devotional section, CTA, footer. Clear Create Account / Log In with Student-or-Lecturer choice first.
2. **Auth** — role-based registration/login, student email verification, lecturer verification, separate protected admin access, friendly errors + retry.
3. **Student dashboard** — academic activity first: deadlines, assignments requiring action, announcements, recent course activity. Simple nav to My Courses, Live Sessions, Assignments, Discussion and Feedback, Library, AI.
4. **Courses** — manual entry + document extraction (code, title, lecturer, unit load), student review/correct before adding. Course pages bundle materials, announcements, live sessions, Q&A, assessments.
5. **Live Sessions** — central page + in-course details. External links (Meet/Zoom) with course, date/time, instructions. Clear upcoming/past states, easy Join. No hosted video in v1.
6. **Assignments, Tests & Results** — lecturers create assignments/online tests with instructions, deadlines, submission methods. Students upload file (PDF/Word) or type answer where allowed. Statuses: Not started, Submitted, Marking, Published. Marks/feedback visible only after publication.
7. **Library** — unified for notes, materials, past questions, guides. Organized by course, with search + filters (lecturer, type, session). Only lecturer-confirmed published material gets lecturer-confirmed label. Download only when lecturer permits.
8. **Announcements & Q&A** — lecturer-controlled announcements kept separate from course Q&A. Ask/respond, report inappropriate/incorrect content. No private messaging in v1.
9. **AI assistants** — student AI (general + per-course) for explanations, summaries, practice questions, exam prep with clear course-material vs general-knowledge cues. Lecturer AI for outlines, summaries, assignment/test drafts, marking guides — all require review/approve.
10. **Devotional** — landing-page Word of God section. Admins manually create/edit/preview/publish/schedule/unpublish/hide. Only published content configured for display appears publicly. No AI generation.
11. **Admin dashboard** — overview (active users, student/lecturer counts, trends, activity, uploads, verification), users + verification queue (pending/approved/rejected), moderation queue (review/dismiss/remove + recorded outcome), simple analytics, essential settings.

Out of scope for v1: private messaging, social feeds, gamification, recommendations, built-in video, proctoring, complex question types, complex permissions, heavy customization, detailed analytics, AI auto-publishing, paid materials/points.

## Repo Structure

```text
EDUFARM-2/
├── PRD/
│   └── EduFarm.md      # Product Requirements Document (source of truth)
└── README.md
```

App code has not started yet. Build sequence from PRD:

1. Visual foundation, landing page, role-based registration/login
2. Student/lecturer access, lecturer verification, Student dashboard
3. Course setup, course pages, announcements, Library with confirmation
4. Live Sessions, course Q&A, reporting
5. Assignments, submissions, online tests, marking, feedback, results
6. Student + lecturer AI assistants with source cues and review controls
7. Admin overview, verification, moderation, analytics, settings, devotional management
8. E2E test of student + lecturer journeys on desktop/mobile, remove friction

## Acceptance Highlights

- Valid student login opens Student dashboard directly
- Role choice precedes role-specific registration form
- Lecturer privileges require verification approval
- Extracted course details are reviewable/correctable before adding
- Only lecturer-confirmed published material carries the label
- Downloads only when permitted; marks/feedback private until published
- AI answers distinguish course-material vs general; devotional shows only admin-published visible content; moderation records outcomes

## Product Principle

> Every feature must make an academic task easier, improve trust, or support the community. If it adds complexity without clear value, leave it out of the first release.

## Docs

- Full spec: [`PRD/EduFarm.md`](PRD/EduFarm.md)
