import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  date,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "treasurer",
  "coordinator",
]);
export const blogPostStatusEnum = pgEnum("blog_post_status", [
  "draft",
  "published",
]);
export const blogCategoryEnum = pgEnum("blog_category", [
  "announcement",
  "story",
  "update",
  "general",
]);
export const paymentModeEnum = pgEnum("payment_mode", [
  "upi",
  "cash",
  "bank_transfer",
  "cheque",
  "other",
]);
export const expenseStatusEnum = pgEnum("expense_status", [
  "pending",
  "approved",
  "rejected",
]);
export const expenseCategoryEnum = pgEnum("expense_category", [
  "food",
  "supplies",
  "transport",
  "venue",
  "printing",
  "medical",
  "donation_forward",
  "other",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "upcoming",
  "active",
  "completed",
  "cancelled",
]);
export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "approved",
  "rejected",
]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const registrationCategoryEnum = pgEnum("registration_category", [
  "mens_singles",
  "womens_singles",
  "mens_doubles",
  "mixed_doubles",
]);
export const bloodGroupEnum = pgEnum("blood_group", [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);

// Clubs Table
export const clubs = pgTable("clubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default("Street Cause"),
  description: text("description"),
  logoUrl: text("logo_url"),
  upiId: text("upi_id"),
  bankDetails: text("bank_details"), // JSON stored as text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Members Table
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique(), // Unused (kept for nullable backwards compat)
  authId: uuid("auth_id").unique(), // Supabase Auth user ID — primary auth identifier
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("coordinator"),
  isActive: boolean("is_active").default(true),
  googleRefreshToken: text("google_refresh_token"),
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Member Invites Table
export const memberInvites = pgTable("member_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("coordinator"),
  invitedBy: uuid("invited_by").references(() => members.id),
  inviteToken: text("invite_token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events Table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).default(
    "0",
  ),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: eventStatusEnum("status").default("upcoming"),
  createdBy: uuid("created_by").references(() => members.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Donations Table
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email"),
  donorPhone: text("donor_phone"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode: paymentModeEnum("payment_mode").notNull().default("upi"),
  transactionId: text("transaction_id"),
  screenshotUrl: text("screenshot_url"),
  notes: text("notes"),
  collectedBy: uuid("collected_by").references(() => members.id),
  donationDate: date("donation_date").notNull(),
  bloodGroup: bloodGroupEnum("blood_group"),
  canContactForBlood: boolean("can_contact_for_blood").default(false),
  status: expenseStatusEnum("status").notNull().default("approved"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by").references(() => members.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses Table
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: expenseCategoryEnum("category").notNull().default("other"),
  receiptUrl: text("receipt_url"),
  status: expenseStatusEnum("status").default("pending"),
  submittedBy: uuid("submitted_by").references(() => members.id),
  approvedBy: uuid("approved_by").references(() => members.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  expenseDate: date("expense_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog Posts Table
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImageUrl: text("cover_image_url"),
  category: blogCategoryEnum("category").default("general"),
  status: blogPostStatusEnum("status").default("draft"),
  authorId: uuid("author_id").references(() => members.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Registration Configs Table
export const registrationConfigs = pgTable("registration_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
  configName: text("config_name").notNull(),
  googleSheetId: text("google_sheet_id").notNull(),
  sheetName: text("sheet_name").notNull().default("Form Responses 1"),
  lastSyncedRow: integer("last_synced_row").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => members.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Registrations Table
export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  configId: uuid("config_id").references(() => registrationConfigs.id, { onDelete: "cascade" }),
  googleFormRowIndex: integer("google_form_row_index").notNull(),
  respondentEmail: text("respondent_email"),
  participantName: text("participant_name").notNull(),
  participantAge: text("participant_age"),
  contactNumber: text("contact_number"),
  gender: genderEnum("gender"),
  category: registrationCategoryEnum("category"),
  participant2Name: text("participant2_name"),
  participant2Age: text("participant2_age"),
  transactionId: text("transaction_id"),
  screenshotDriveUrl: text("screenshot_drive_url"),
  screenshotUrl: text("screenshot_url"),
  ticketAmount: decimal("ticket_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: registrationStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by").references(() => members.id),
  reviewedAt: timestamp("reviewed_at"),
  importedAt: timestamp("imported_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const clubsRelations = relations(clubs, ({ many }) => ({
  members: many(members),
  events: many(events),
  donations: many(donations),
  expenses: many(expenses),
  blogPosts: many(blogPosts),
  registrationConfigs: many(registrationConfigs),
  eventRegistrations: many(eventRegistrations),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  club: one(clubs, {
    fields: [members.clubId],
    references: [clubs.id],
  }),
  submittedExpenses: many(expenses, {
    relationName: "submittedExpenses",
  }),
  approvedExpenses: many(expenses, {
    relationName: "approvedExpenses",
  }),
  submittedDonations: many(donations, {
    relationName: "submittedDonations",
  }),
  reviewedDonations: many(donations, {
    relationName: "reviewedDonations",
  }),
  authoredPosts: many(blogPosts, {
    relationName: "authoredPosts",
  }),
  createdConfigs: many(registrationConfigs, {
    relationName: "createdConfigs",
  }),
  reviewedRegistrations: many(eventRegistrations, {
    relationName: "reviewedRegistrations",
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  club: one(clubs, {
    fields: [events.clubId],
    references: [clubs.id],
  }),
  donations: many(donations),
  expenses: many(expenses),
  registrationConfigs: many(registrationConfigs),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  club: one(clubs, {
    fields: [donations.clubId],
    references: [clubs.id],
  }),
  event: one(events, {
    fields: [donations.eventId],
    references: [events.id],
  }),
  submitter: one(members, {
    fields: [donations.collectedBy],
    references: [members.id],
    relationName: "submittedDonations",
  }),
  reviewer: one(members, {
    fields: [donations.reviewedBy],
    references: [members.id],
    relationName: "reviewedDonations",
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  club: one(clubs, {
    fields: [expenses.clubId],
    references: [clubs.id],
  }),
  event: one(events, {
    fields: [expenses.eventId],
    references: [events.id],
  }),
  submitter: one(members, {
    fields: [expenses.submittedBy],
    references: [members.id],
    relationName: "submittedExpenses",
  }),
  approver: one(members, {
    fields: [expenses.approvedBy],
    references: [members.id],
    relationName: "approvedExpenses",
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  club: one(clubs, {
    fields: [blogPosts.clubId],
    references: [clubs.id],
  }),
  author: one(members, {
    fields: [blogPosts.authorId],
    references: [members.id],
    relationName: "authoredPosts",
  }),
  event: one(events, {
    fields: [blogPosts.eventId],
    references: [events.id],
  }),
}));

export const registrationConfigsRelations = relations(registrationConfigs, ({ one, many }) => ({
  club: one(clubs, {
    fields: [registrationConfigs.clubId],
    references: [clubs.id],
  }),
  event: one(events, {
    fields: [registrationConfigs.eventId],
    references: [events.id],
  }),
  createdByMember: one(members, {
    fields: [registrationConfigs.createdBy],
    references: [members.id],
    relationName: "createdConfigs",
  }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  club: one(clubs, {
    fields: [eventRegistrations.clubId],
    references: [clubs.id],
  }),
  config: one(registrationConfigs, {
    fields: [eventRegistrations.configId],
    references: [registrationConfigs.id],
  }),
  reviewer: one(members, {
    fields: [eventRegistrations.reviewedBy],
    references: [members.id],
    relationName: "reviewedRegistrations",
  }),
}));

// Export types
export type Club = typeof clubs.$inferSelect;
export type NewClub = typeof clubs.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type MemberInvite = typeof memberInvites.$inferSelect;
export type NewMemberInvite = typeof memberInvites.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type RegistrationConfig = typeof registrationConfigs.$inferSelect;
export type NewRegistrationConfig = typeof registrationConfigs.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
