import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const audiobooks = pgTable("audiobooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  originalFileName: text("original_file_name").notNull(),
  filePath: text("file_path").notNull(),
  audioPath: text("audio_path"),
  videoPath: text("video_path"),
  pages: integer("pages"),
  duration: real("duration"), // in seconds
  voice: varchar("voice", { length: 50 }).default('alloy'),
  speed: real("speed").default(1.0),
  status: varchar("status", { length: 20 }).default('pending'), // pending, processing, complete, error
  progress: integer("progress").default(0), // percentage 0-100
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listeningProgress = pgTable("listening_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  audiobookId: varchar("audiobook_id").notNull().references(() => audiobooks.id, { onDelete: 'cascade' }),
  currentTime: real("current_time").default(0), // in seconds
  completed: boolean("completed").default(false),
  lastListenedAt: timestamp("last_listened_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  audiobooks: many(audiobooks),
  listeningProgress: many(listeningProgress),
}));

export const audiobooksRelations = relations(audiobooks, ({ one, many }) => ({
  user: one(users, {
    fields: [audiobooks.userId],
    references: [users.id],
  }),
  listeningProgress: many(listeningProgress),
}));

export const listeningProgressRelations = relations(listeningProgress, ({ one }) => ({
  user: one(users, {
    fields: [listeningProgress.userId],
    references: [users.id],
  }),
  audiobook: one(audiobooks, {
    fields: [listeningProgress.audiobookId],
    references: [audiobooks.id],
  }),
}));

// Insert schemas
export const insertAudiobookSchema = createInsertSchema(audiobooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListeningProgressSchema = createInsertSchema(listeningProgress).omit({
  id: true,
  lastListenedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertAudiobook = z.infer<typeof insertAudiobookSchema>;
export type Audiobook = typeof audiobooks.$inferSelect;
export type AudiobookWithProgress = Audiobook & {
  listeningProgress?: {
    currentTime: number;
    completed: boolean;
  };
};
export type InsertListeningProgress = z.infer<typeof insertListeningProgressSchema>;
export type ListeningProgress = typeof listeningProgress.$inferSelect;
