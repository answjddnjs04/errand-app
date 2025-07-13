import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location").default("성수동"),
  maxDistance: integer("max_distance").default(2000), // in meters
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  completedErrands: integer("completed_errands").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Errands table
export const errands = pgTable("errands", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  startLocationLat: decimal("start_location_lat", { precision: 10, scale: 8 }),
  startLocationLng: decimal("start_location_lng", { precision: 11, scale: 8 }),
  startLocationAddress: varchar("start_location_address", { length: 500 }),
  endLocationLat: decimal("end_location_lat", { precision: 10, scale: 8 }),
  endLocationLng: decimal("end_location_lng", { precision: 11, scale: 8 }),
  endLocationAddress: varchar("end_location_address", { length: 500 }),
  urgency: varchar("urgency", { length: 20 }).notNull().default("normal"), // normal, urgent, super-urgent
  tip: integer("tip").default(0), // in KRW
  status: varchar("status", { length: 20 }).notNull().default("waiting"), // waiting, matched, in-progress, completed, cancelled
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  runnerId: varchar("runner_id").references(() => users.id),
  estimatedDistance: integer("estimated_distance"), // in meters
  estimatedTime: integer("estimated_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat rooms for errands
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  errandId: integer("errand_id").notNull().references(() => errands.id),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  runnerId: varchar("runner_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, image, receipt
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requestedErrands: many(errands, { relationName: "requesterErrands" }),
  acceptedErrands: many(errands, { relationName: "runnerErrands" }),
  sentMessages: many(chatMessages),
  requesterChatRooms: many(chatRooms, { relationName: "requesterChatRooms" }),
  runnerChatRooms: many(chatRooms, { relationName: "runnerChatRooms" }),
}));

export const errandsRelations = relations(errands, ({ one, many }) => ({
  requester: one(users, {
    fields: [errands.requesterId],
    references: [users.id],
    relationName: "requesterErrands",
  }),
  runner: one(users, {
    fields: [errands.runnerId],
    references: [users.id],
    relationName: "runnerErrands",
  }),
  chatRooms: many(chatRooms),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  errand: one(errands, {
    fields: [chatRooms.errandId],
    references: [errands.id],
  }),
  requester: one(users, {
    fields: [chatRooms.requesterId],
    references: [users.id],
    relationName: "requesterChatRooms",
  }),
  runner: one(users, {
    fields: [chatRooms.runnerId],
    references: [users.id],
    relationName: "runnerChatRooms",
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chatRoom: one(chatRooms, {
    fields: [chatMessages.chatRoomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertErrandSchema = createInsertSchema(errands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requesterId: true,
  runnerId: true,
  status: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  senderId: true,
  isRead: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Errand = typeof errands.$inferSelect;
export type InsertErrand = z.infer<typeof insertErrandSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Extended types for frontend
export type ErrandWithUser = Errand & {
  requester: User;
  runner?: User;
};

export type ChatRoomWithDetails = ChatRoom & {
  errand: Errand;
  requester: User;
  runner: User;
  messages: ChatMessage[];
};
