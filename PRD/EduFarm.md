**EduFarm**

Product Requirements  
 Document

*A trusted academic ecosystem for students and lecturers*

| Status | Working PRD — ready for design and build planning |
| :---- | :---- |
| **Initial launch** | One university first |
| **Primary users** | Students, lecturers, administrators |
| **Guiding principle** | Simple, seamless, and useful; avoid unnecessary complexity |

 

# **1\. Product Summary**

EduFarm is a trusted academic ecosystem connecting students and lecturers through course activity, lecturer-confirmed learning materials, assessments, live-session information, course announcements and Q\&A, and AI learning support. It is not simply a PDF marketplace. It helps students find reliable academic information and gives lecturers a central place to guide learning.

The landing page introduces EduFarm’s academic purpose first and features a Word of God devotional prominently as a complementary part of the experience. The devotional is written and managed by administrators.

# **2\. Vision, Problem, and Goals**

Vision: Make trusted academic resources and lecturer-to-student communication easier to access, understand, and act on.

·       Students may prepare for exams using inaccurate, outdated, or unconfirmed files circulating among classmates.

·       Important lecturer updates, deadlines, resources, and class links can be scattered across different channels.

·       Students need one place to find course resources, submit work, and view published feedback.

·       Lecturers need straightforward tools for sharing resources, managing course activity, and using AI to support teaching while retaining control.

·       Success means students can register, add courses, find their next academic task, and access trusted materials without unnecessary steps.

·       Track early indicators such as successful registrations, active students and lecturers, confirmed materials, assignment submissions, and moderation resolution.

# **3\. Users and Access**

## **Students**

·       Register with a university email and verify it.

·       Sign in with email and password; after successful verification, go directly to the Student dashboard without an extra welcome screen.

·       Add courses manually or upload a course-registration document and review/correct extracted details.

·       Access courses, the Library, live sessions, announcements, Q\&A, AI assistance, assignments, tests, and published results.

## **Lecturers**

·       Register through the Lecturer path and complete additional verification before lecturer privileges are enabled.

·       Manage relevant courses and students; upload learning materials, publish announcements, post live-session links, and manage assessments.

·       Use AI to prepare teaching resources and assessment drafts, reviewing and approving output before sharing it.

## **Administrators**

·       Review lecturer verification applications and user status.

·       Manage devotional content and landing-page visibility.

·       Review user-reported materials and discussions and record moderation outcomes.

·       Monitor active users, registrations, academic activity, material uploads, and pending verification.

·       Manage essential platform settings and appearance preferences.

# **4\. Core User Journeys**

## **Student**

1\.       Choose Student during account creation and complete registration/email verification.

2\.       Log in with email and password; successful authentication opens the dashboard directly.

3\.       Add courses manually or upload a registration document, then review and correct extracted details.

4\.       Use the dashboard to act on deadlines, assignments, announcements, and recent course activity.

## **Lecturer**

5\.       Choose Lecturer during account creation and register.

6\.       Complete additional lecturer verification.

7\.       After approval, manage courses, confirmed learning materials, announcements, live sessions, assessments, and AI-assisted teaching tasks.

## **Admin**

8\.       Enter the protected admin area.

9\.       Review lecturer verification and reported content.

10\.   Create, edit, preview, publish, schedule, unpublish, or hide devotional content.

11\.   Use the dashboard overview to identify outstanding tasks and monitor platform activity.

# **5\. Feature Requirements**

## **5.1 Landing page**

·       Introduce EduFarm as a trusted academic ecosystem with a clear headline and short explanation.

·       Use a balanced academic and devotional experience: academic value first, with a prominent dedicated Word of God devotional section.

·       Recommended content flow: hero and account actions; key academic features; brief How It Works section; featured courses/materials or platform highlights; devotional section; final call to action; footer.

·       Use uploaded screenshots as visual references for clean spacing, rounded cards, hierarchy, restrained motion, and navigation patterns. Adapt them to EduFarm; do not copy their feature content literally.

·       Offer clear Create Account and Log In actions. Account creation begins by choosing Student or Lecturer.

## **5.2 Registration and login**

·       Visitors choose Student or Lecturer before seeing the relevant form.

·       Students verify their university email.

·       Lecturers require additional verification before lecturer privileges are granted.

·       Admin access is separate and protected, not a public account-creation choice.

·       Show clear, friendly error messages and a simple retry path.

## **5.3 Student dashboard and navigation**

·       Academic activity is the first and most prominent dashboard area: upcoming deadlines, assignments requiring action, lecturer announcements, and recent course activity.

·       Keep My Courses, Live Sessions, Assignments, Discussion and Feedback, Library, and AI easy to reach through simple navigation.

·       Use restrained cards, clear labels, responsive layouts, and obvious primary actions; avoid excessive metrics and duplicate destinations.

## **5.4 Course setup and course pages**

·       Offer manual course entry and registration-document upload.

·       Where possible, extract course code, title, lecturer, and unit load from uploaded documents.

·       Students must review and correct extracted details before adding courses.

·       Manually entered or extracted details are not automatically officially verified.

·       Course pages bring together relevant materials, announcements, live sessions, discussions/Q\&A, and assessments.

## **5.5 Live Sessions**

·       Provide both a central Live Sessions page and session details within each relevant course.

·       Lecturers post an external meeting link (e.g. Google Meet or Zoom), course, date, time, and joining instructions.

·       Show upcoming/past states clearly and make Join easy to find. EduFarm links to external calls; it does not need to host video calls in the initial release.

## **5.6 Assignments, tests, marking, and results**

·       Lecturers create assignments and online tests, provide instructions and deadlines, and specify accepted submission methods.

·       Students can upload a file (e.g. PDF or Word document) or type a written answer when permitted.

·       Students see deadlines and submission status; lecturers review work, mark it, provide written feedback, save drafts, and publish when ready.

·       Marks and feedback are visible to the student only after publication.

·       Use a small, consistent set of statuses such as Not started, Submitted, Marking, and Published.

·       Keep online test-taking straightforward and confirm when a submission is received.

## **5.7 Library and lecturer-confirmed materials**

·       One unified Library for notes, course materials, past questions, study guides, and other resources.

·       Organise primarily by course, with search and simple filters for lecturer, material type, and academic session.

·       Lecturers upload materials and confirm them before they are labelled lecturer-confirmed and published.

·       Display confirmation status and the confirming lecturer clearly.

·       Students can view published materials; downloading is available only when the lecturer permits it.

·       Do not add complex per-student or group-based material access restrictions in the first release.

## **5.8 Announcements and course Q\&A**

·       Keep lecturer-controlled course announcements separate from course discussions and Q\&A.

·       Students and lecturers can ask and respond to course-related questions.

·       Private messaging is not required in the initial release.

·       Allow users to report inappropriate or incorrect content.

## **5.9 AI assistants**

·       Students get a dedicated AI assistant for general academic help and AI access within each course for course-specific questions.

·       Student AI supports explanations, summaries, practice questions, and exam preparation.

·       Make clear when an answer uses uploaded course materials versus general knowledge.

·       Lecturer AI helps draft lesson outlines, summarise/adapt teaching materials, prepare assignments and practice/test questions, and create marking guides.

·       Lecturers review and approve AI-generated content before sharing it. AI supports learning and teaching; it does not replace lecturer judgement.

## **5.10 Word of God devotional**

·       Feature a dedicated devotional section on the landing page without overshadowing the academic purpose.

·       Admins write content manually; AI auto-generation is out of scope.

·       Admins can create, edit, preview, publish, schedule, unpublish, replace, and maintain devotional history.

·       Admins can toggle landing-page visibility; only published content configured for display appears publicly.

## **5.11 Admin dashboard**

·       Keep the interface simple and consistent with the uploaded dashboard references.

·       Overview: total active users, student/lecturer counts, registration trends, academic activity, material uploads, and verification status.

·       Users: profiles and status; lecturer verification queue with pending, approved, and rejected outcomes.

·       Content Moderation: queue of reported materials/discussions; review, dismiss, remove or take action, and record the outcome.

·       Analytics: key figures and simple trend charts rather than a crowded reporting suite.

·       Settings: essential platform information, admin preferences, basic controls, and light/dark appearance. Keep verification, moderation, analytics, and devotional management separate.

# **6\. UX and Visual Principles**

·       Preserve the feature order in the handwritten blueprint when arranging the product structure.

·       Use uploaded screenshots as visual references, not literal feature specifications.

·       Keep navigation predictable, page layouts consistent, and language plain.

·       Use subtle motion only when it clarifies state changes; avoid decorative animation that slows the experience.

·       Provide useful loading, empty, success, and error states.

·       Design for desktop and mobile, with readable text, sufficient contrast, and touch-friendly controls.

# **7\. MVP Scope**

## **Include in first release**

·       Role-based student/lecturer registration and login; student email verification and lecturer verification.

·       Student dashboard with academic activity first.

·       Manual course setup and reviewed document extraction.

·       Course pages, announcements, Q\&A, and central/in-course live-session links.

·       Unified Library with lecturer confirmation, search, basic filters, and lecturer-controlled downloads.

·       Assignments, file/written submissions, simple online tests, marking, feedback, and results.

·       Student and lecturer AI assistants with clear source cues and human review of lecturer-facing outputs.

·       Admin overview, verification queue, user-reported moderation, essential settings, and devotional publishing.

·       Balanced landing page with a prominent devotional section.

## **Defer unless explicitly prioritised**

·       Private messaging, social feeds, complex gamification, and advanced recommendation systems.

·       Built-in video conferencing, advanced exam proctoring, or elaborate test question types.

·       Complex resource permissions, extensive customisation, or highly detailed analytics.

·       AI auto-publishing, AI-generated devotionals, and automatic official verification of course details.

·       Payments, paid-material workflows, or point systems until they are explicitly defined and prioritised.

# **8\. Acceptance Criteria**

| Area | What must be true |
| :---- | :---- |
| **Login** | Valid student credentials open the Student dashboard directly. |
| **Registration** | The visitor chooses Student or Lecturer before seeing a role-specific form. |
| **Lecturer access** | Lecturer privileges require approval of additional verification. |
| **Course upload** | Extracted details can be reviewed and corrected before adding. |
| **Material trust** | Only lecturer-confirmed, published material is labelled lecturer-confirmed. |
| **Downloads** | Download is available only when permitted by the lecturer. |
| **Live sessions** | Sessions appear centrally and within the relevant course. |
| **Results** | Marks and feedback remain private until published. |
| **AI transparency** | Students can distinguish course-material-based answers from general answers. |
| **Devotional** | Only admin-published content configured for landing-page display appears publicly. |
| **Moderation** | Reported content can be reviewed and resolved with an outcome recorded. |
| **Usability** | Core tasks are reachable without unnecessary steps. |

# **9\. Non-Functional Requirements**

·       Security: protect accounts, verification information, submissions, and grades; restrict access by role.

·       Privacy: students see only their own grades and private feedback.

·       Reliability: confirm successful uploads/submissions and avoid lost work.

·       Performance: prioritise fast dashboard loading and usable performance on typical campus connections.

·       Accessibility: readable text, clear focus states, sufficient contrast, and meaningful labels.

·       Maintainability: keep feature areas understandable so later improvements do not require a complete rebuild.

# **10\. Assumptions and Decisions to Confirm Before Build**

·       Initial launch serves one university; multi-university support can follow after validation.

·       Confirm exact university email rules and evidence required for lecturer verification.

·       Keep the first assessment experience reliable and simple rather than building advanced proctoring.

·       Payments and paid-material rules are outside this initial scope to protect simplicity.

·       Choose the AI provider, usage limits, file limits, data retention, and privacy wording before launch.

·       During UI design, cross-check final navigation and feature order against the handwritten blueprint.

# **11\. Suggested Build Sequence**

12\.   Build the visual foundation, landing page, and role-based registration/login.

13\.   Build student/lecturer access, lecturer verification, and the Student dashboard.

14\.   Add course setup, course pages, announcements, and the unified Library with lecturer confirmation.

15\.   Add Live Sessions, course Q\&A, and reporting.

16\.   Add assignments, submissions, online tests, marking, feedback, and results.

17\.   Add student and lecturer AI assistants with clear source cues and review controls.

18\.   Build the admin overview, verification, moderation, analytics, settings, and devotional management.

19\.   Test full student and lecturer journeys on desktop and mobile; remove any repetitive or confusing step.

# **12\. Product Principle**

**Every feature must make an academic task easier, improve trust, or support the community. If it adds complexity without clear value, leave it out of the first release.**

