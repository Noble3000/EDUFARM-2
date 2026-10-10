# EduFarm Design System — Locked from UI References

> Source images studied: (1) Green lecturer dashboard, (2) Minimal admin dashboard, (3) EduVerse student LMS.
> Rule: everything we build uses these tokens. No new colors, fonts, or radii without updating this file first.

## 1. What each reference teaches us

### Ref 1 — Green dashboard (primary style anchor)
- Dark green top bar in a rounded container, white text, active tab = white pill + green text.
- Page on soft mint wash, content in one large white rounded sheet (24px radius).
- Two-column: left feed (announcements with To:, comments), right stack (Timetable / Active Assignments / Resources).
- Rows: 32px avatar, 14px semibold title, 12px muted subtitle, time in light-green pill, actions in soft-tinted square icon buttons.
- Quick actions top-right: one dark (navy/black) + one green button, small, pill.
- Tabs: Today / This Week / Semester, active = subtle pill/underline.
- DNA to keep: green header, mint page wash, white sheet, tinted pills, square-tint action icons, restrained density.

### Ref 2 — Admin dashboard (density + table anchor)
- White sidebar, icon + label, active = light-gray rounded background, bold text.
- Section titles 16–18px bold, tables with 12px muted uppercase headers, 14px rows, hairline dividers.
- Status as tinted pills: Approved = green tint, Pending = amber tint, Flagged = red tint.
- Primary buttons small black rounded-md (Add User, Review Content, Export Report).
- Analytics = 3 equal white cards, 24px bold number, 12px delta, small icon.
- DNA to keep: table language, status pill system, card metrics, black admin actions (distinct from green academic actions).

### Ref 3 — EduVerse LMS (student dashboard anchor)
- White sidebar, active item = solid-color pill (purple in ref) + white text.
- Top search pill + bell + avatar. Welcome banner = solid-to-gradient banner, white text + white pill CTA on right.
- 4 stat cards: label 12 muted + icon, value 20 bold, sub-caption 12.
- Schedule / trending / pending lists in white 16px-radius cards, 16–20px gaps on #F5F6FA wash.
- Join links, Tomorrow red pill, progress bars.
- DNA to keep: sidebar pill nav, welcome banner pattern, 4-stat row, list-card rhythm — but recolored to EduFarm green (we do NOT adopt purple as primary).

## 2. Locked decisions (consistency contract)

1. Primary is **EduFarm Green**, not purple. Purple appears nowhere in v1 except code syntax (if any).
2. Admin uses same tokens but primary action = Ink (near-black) to signal authority, per Ref 2.
3. Devotional accent = warm gold, used ONLY in devotional section + its badges. Never for grades or CTAs.
4. One font pairing everywhere. One radius scale. One shadow scale. One pill system.
5. Every screen: page wash → white sheet/cards → one banner max → lists. No new layout inventions.

## 3. Color — perfect combination

Inspired by Ref 1 green + Ref 3 neutrals, tuned for academic contrast (AA).

```css
/* Primary — EduFarm Green */
--green-900: #0B4D2E;  /* header bar, footer */
--green-800: #0E6B3E;  /* primary buttons, active nav */
--green-700: #12805A;
--green-100: #DDF0E4;  /* time pills, confirmed badge bg */
--green-050: #EDF7F0;  /* tinted icon bg, hover wash */
--mint-wash: #CFE6D8;  /* page backdrop behind white sheet (Ref 1) */
--app-wash: #F2F5F3;   /* inner app bg when no mint moment (Ref 3 gray, greened) */

/* Ink + neutrals (Ref 2 + 3) */
--ink-900: #101828;    /* headings, table text */
--ink-600: #475467;    /* body secondary */
--ink-400: #98A2B3;    /* placeholders, table headers */
--line: #E5E9E4;       /* hairline dividers, card borders */
--card: #FFFFFF;

/* Admin authority */
--admin-ink: #111827;  /* Add User / Review / Export buttons */

/* Status pills (unified) */
--success-bg: #E6F4EC; --success-tx: #0E6B3E;
--warning-bg: #FEF3C7; --warning-tx: #92400E;
--danger-bg: #FEE2E2;  --danger-tx: #B42318;
--info-bg: #E0E7FF;    --info-tx: #3730A3; /* sparing: Join links */
--neutral-bg: #F2F4F7; --neutral-tx: #344054;

/* Devotional — isolated */
--gold-500: #C49A2E; --gold-bg: #FDF6E3; --gold-tx: #7A5B0E;

/* Welcome banner gradients — max 2 stops, 135deg only */
--banner-a-from: #0E6B3E; --banner-a-to: #083D24;   /* Option A: Deep Academic (default) */
--banner-b-from: #12805A; --banner-b-to: #0B4D2E;   /* Option B: Fresh Academic (lighter) */
```

Dark mode: keep green-800 as surface, cards #0F1F17, text #E6EDE8, washes darken 12%. Light is default; dark must pass same contrast.

Contrast rules: body text on white ≥ 7:1 using ink-900; secondary ≥ 4.5:1 using ink-600; pills use tx colors above on their bg (all ≥ 4.5:1). Never green text on mint without ink fallback.

## 4. Typography — academic excellence

Pairing (both Google Fonts, system fallback):
- Display / headings: **Plus Jakarta Sans**, 700/600, tracking -0.02em. Academic, confident, matches Ref 3 welcome + Ref 1 titles.
- Body / UI: **Inter**, 400/500/600. Best small-size legibility for timetables, tables, Q&A.

Scale (desktop, mobile -1px below 768px):
- Display: 32/40 (landing hero only)
- H1: 24/32 semibold — page titles (Dashboard, Library)
- H2: 18/26 semibold — card titles (Timetable, Active Assignments)
- H3: 16/24 semibold — section subheads
- Body: 14/20 regular — feed, announcements, Q&A
- Small: 13/18 — subtitles, table cells secondary
- Caption: 12/16 medium — table headers (uppercase, tracking +0.04em), pills, timestamps
- Numbers: tabular-nums for timetable, grades, analytics (1,234 / 789 / 456 style per Ref 2).

Rules:
- One H1 per page. Card titles always H2 18px, never larger.
- Announcements/Q&A body max 65ch, line-height 1.6.
- Timestamps + “To:” lines always 12px muted.
- Buttons 14px semibold. Pills 12px semibold.
- Never use serif, never italic for UI (verse text in devotional may use serif italic as sole exception).

## 5. Shape, space, elevation

- Page: mint/app wash full-bleed, centered white sheet `radius 24px`, padding 24 (desktop) / 16 (mobile).
- Cards: white, `radius 16px`, border 1px var(--line), shadow `0 1px 2px rgba(16,24,40,.06)`.
- Header bar: `radius 16px`, green-900 fill, height 56px, active tab white pill `radius 999px`.
- Sidebar (desktop ≥1024px): white, 248px, items 40px tall `radius 12px`, active = green-800 fill + white text + icon (student/lecturer) or neutral-100 + ink text (admin keeps Ref 2 minimal).
- Mobile: sidebar → bottom nav 64px, 4–5 items, active dot + label 11px.
- Rows: 12–16px padding, avatar 32px rounded-full, action icon buttons 32px `radius 10px` with tinted bg (green-050 / warning-bg / danger-bg per meaning).
- Gaps: page sections 24px, card stacks 16px, row dividers 1px.
- Motion: 150–200ms ease for tab, dialog, toast only. Respect reduced-motion. No float/slide-in decorations.

## 6. Component specs (match refs pixel-close)

- **TopBar**: green-900 rounded container, left nav tabs, right search/bell/avatar + Quick actions (dark + green pills). Sticky on scroll with same green.
- **WelcomeBanner**: green gradient, 20px bold white title, 13px sub, right white pill CTA (e.g. Start Learning / New Assignment). One per dashboard max.
- **StatCards (4)**: white 16px, label 12 muted + icon right, value 20 bold tabular, delta 12 success/danger.
- **ListCards (Timetable / Schedule / Resources)**: H2 + “All” ghost link right. Row: avatar → title/sub → time pill → tinted actions. Upcoming vs Past separated; Past dimmed 60%.
- **Tables (Admin)**: header 12 uppercase muted, row 56px, status pill, row actions ghost icons (view/edit). Pagination footer 14px.
- **Buttons**: Primary green-800 white text radius 12px h40; Admin primary ink; Destructive red-600; Ghost transparent + ink. Disabled 50% opacity.
- **Pills**: radius 999px, h24, 12px semibold. Mapping: Confirmed/Published/Active/Approved→success; Pending/Submitted/Marking/Tomorrow→warning (Tomorrow uses danger tint per Ref 3); Past/Inactive/Flagged→neutral/danger as in Ref 2.
- **Inputs**: h44 radius 12px border line, focus 2px green-700 ring. Search always pill (radius 999) with icon.
- **DevotionalCard**: gold-bg wash, gold left border 4px, verse ref 12 gold-tx uppercase, body 15/24 serif-allowed, cover rounded 12px.

## 7. Page patterns to reuse

- Lecturer dashboard = Ref 1 clone in our tokens (feed left, timetable/assignments/resources right).
- Student dashboard = Ref 3 clone in green (banner + 4 stats + schedule/trending/pending/progress).
- Admin = Ref 2 clone (sidebar + Users table + Moderation table + 3 analytics cards + growth).
- Course page: header (code + title + lecturer + units) → tabs Materials|Announcements|Sessions|Q&A|Assessments, each reusing list/table cards above.
- Library row: icon + title + course + lecturer + session + confirmed pill + View / Download (gated) actions.

## 8. Consistency enforcement

- No hex outside §3. No font outside §4. No radius outside {10,12,16,24,999}.
- PR checklist: screenshot desktop+mobile, token diff, a11y (focus, contrast, labels), empty/loading/error states.
- Storybook/Gallery route `/design` renders every component in light/dark before feature PRs merge.
- If refs conflict: Ref 1 wins for color/shape, Ref 2 wins for tables/status, Ref 3 wins for dashboard rhythm.
