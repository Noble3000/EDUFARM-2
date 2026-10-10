import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

/* ---------- Better Auth core tables (required names/shape) ---------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // EduFarm extensions
  role: text("role")
    .notNull()
    .default("student"), // student | lecturer_pending | lecturer | admin
  status: text("status").notNull().default("active"), // active | suspended
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* ---------- EduFarm domain (PRD §5, plan §2.2) ---------- */

export const studentProfiles = pgTable("student_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  matricNo: text("matric_no"),
  department: text("department"),
  level: text("level"),
});

export const lecturerVerifications = pgTable("lecturer_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  evidencePaths: jsonb("evidence_paths").$type<string[]>().notNull().default([]),
  department: text("department"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewerId: text("reviewer_id").references(() => user.id),
  decidedAt: timestamp("decided_at"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  lecturerName: text("lecturer_name"),
  unitLoad: integer("unit_load"),
  session: text("session"),
  ownerLecturerId: text("owner_lecturer_id").references(() => user.id),
  createdBy: text("created_by").references(() => user.id),
  isOfficialVerified: boolean("is_official_verified")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("manual"), // manual | document
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("enrollments_student_course").on(t.studentId, t.courseId)],
);

export const materials = pgTable("materials", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => user.id),
  title: text("title").notNull(),
  type: text("type").notNull().default("note"), // note | past-question | guide | other
  session: text("session"),
  filePath: text("file_path").notNull(), // R2 key, never public
  allowDownload: boolean("allow_download").notNull().default(false),
  status: text("status").notNull().default("draft"), // draft | confirmed | published
  confirmedBy: text("confirmed_by").references(() => user.id),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
});

export const liveSessions = pgTable("live_sessions", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  hostId: text("host_id")
    .notNull()
    .references(() => user.id),
  title: text("title").notNull(),
  meetingUrl: text("meeting_url").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  dueAt: timestamp("due_at"),
  allowFile: boolean("allow_file").notNull().default(true),
  allowText: boolean("allow_text").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  filePath: text("file_path"), // R2 key
  bodyText: text("body_text"),
  status: text("status").notNull().default("submitted"), // submitted | marking | published
  score: integer("score"),
  feedback: text("feedback"), // visible only when published
  feedbackDraft: text("feedback_draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const qaThreads = pgTable("qa_threads", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  question: text("question").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const qaReplies = pgTable("qa_replies", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => qaThreads.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => user.id),
  targetType: text("target_type").notNull(), // material | thread | reply
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"), // open | dismissed | actioned
  resolutionNote: text("resolution_note"),
  reviewerId: text("reviewer_id").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devotionals = pgTable("devotionals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  verseRef: text("verse_ref"),
  body: text("body").notNull(),
  coverPath: text("cover_path"), // R2 key
  status: text("status").notNull().default("draft"), // draft | scheduled | published | hidden
  publishAt: timestamp("publish_at"),
  showOnLanding: boolean("show_on_landing").notNull().default(false),
  authorId: text("author_id").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("site"),
  siteName: text("site_name").notNull().default("EduFarm"),
  supportEmail: text("support_email"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  defaultSession: text("default_session"),
});
export const aiUsage = pgTable("ai_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(), // general | course:<id> | lecturer-draft
  tokens: integer("tokens").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => user.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- Online tests (PRD §5.6: simple, no proctoring) ---------- */

export const tests = pgTable("tests", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  title: text("title").notNull(),
  instructions: text("instructions"),
  durationMin: integer("duration_min"),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const testQuestions = pgTable("test_questions", {
  id: text("id").primaryKey(),
  testId: text("test_id")
    .notNull()
    .references(() => tests.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("mcq"), // mcq | short
  prompt: text("prompt").notNull(),
  options: jsonb("options").$type<string[]>().default([]),
  answerIndex: integer("answer_index"), // mcq correct option (hidden from students)
  answerText: text("answer_text"), // short-answer guide (hidden from students)
  marks: integer("marks").notNull().default(1),
  position: integer("position").notNull().default(0),
});

export const testAttempts = pgTable("test_attempts", {
  id: text("id").primaryKey(),
  testId: text("test_id")
    .notNull()
    .references(() => tests.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // answers: { [questionId]: { selected?: number; text?: string } }
  answers: jsonb("answers").$type<Record<string, { selected?: number; text?: string }>>().notNull().default({}),
  score: integer("score"),
  maxScore: integer("max_score"),
  // submitted → auto-marked mcq; published when lecturer releases (or immediately if all-mcq)
  status: text("status").notNull().default("submitted"), // submitted | published
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});
