import {
  users,
  errands,
  chatRooms,
  chatMessages,
  type User,
  type UpsertUser,
  type Errand,
  type InsertErrand,
  type ErrandWithUser,
  type ChatRoom,
  type ChatMessage,
  type InsertChatMessage,
  type ChatRoomWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Errand operations
  getErrands(userId?: string, filters?: {
    urgency?: string;
    maxDistance?: number;
    userLat?: number;
    userLng?: number;
  }): Promise<ErrandWithUser[]>;
  getErrand(id: number): Promise<ErrandWithUser | undefined>;
  createErrand(errand: InsertErrand & { requesterId: string }): Promise<Errand>;
  updateErrand(id: number, updates: Partial<Errand>): Promise<Errand | undefined>;
  getUserErrands(userId: string, type: 'requested' | 'accepted'): Promise<ErrandWithUser[]>;
  
  // Chat operations
  getChatRooms(userId: string): Promise<ChatRoomWithDetails[]>;
  getChatRoom(errandId: number, requesterId: string, runnerId: string): Promise<ChatRoom | undefined>;
  createChatRoom(errandId: number, requesterId: string, runnerId: string): Promise<ChatRoom>;
  getChatMessages(chatRoomId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage & { senderId: string }): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Errand operations
  async getErrands(userId?: string, filters?: {
    urgency?: string;
    maxDistance?: number;
    userLat?: number;
    userLng?: number;
  }): Promise<ErrandWithUser[]> {
    let query = db
      .select({
        errand: errands,
        requester: users,
      })
      .from(errands)
      .innerJoin(users, eq(errands.requesterId, users.id))
      .where(eq(errands.status, "waiting"))
      .orderBy(
        sql`CASE 
          WHEN ${errands.urgency} = 'super-urgent' THEN 1
          WHEN ${errands.urgency} = 'urgent' THEN 2
          ELSE 3
        END`,
        desc(errands.createdAt)
      );

    const results = await query;
    
    return results.map(result => ({
      ...result.errand,
      requester: result.requester,
    }));
  }

  async getErrand(id: number): Promise<ErrandWithUser | undefined> {
    const [result] = await db
      .select({
        errand: errands,
        requester: users,
      })
      .from(errands)
      .innerJoin(users, eq(errands.requesterId, users.id))
      .where(eq(errands.id, id));

    if (!result) return undefined;

    return {
      ...result.errand,
      requester: result.requester,
    };
  }

  async createErrand(errandData: InsertErrand & { requesterId: string }): Promise<Errand> {
    const [errand] = await db
      .insert(errands)
      .values(errandData)
      .returning();
    return errand;
  }

  async updateErrand(id: number, updates: Partial<Errand>): Promise<Errand | undefined> {
    const [errand] = await db
      .update(errands)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(errands.id, id))
      .returning();
    return errand;
  }

  async getUserErrands(userId: string, type: 'requested' | 'accepted'): Promise<ErrandWithUser[]> {
    const condition = type === 'requested' 
      ? eq(errands.requesterId, userId)
      : eq(errands.runnerId, userId);

    const results = await db
      .select({
        errand: errands,
        requester: users,
      })
      .from(errands)
      .innerJoin(users, eq(errands.requesterId, users.id))
      .where(condition)
      .orderBy(desc(errands.createdAt));

    return results.map(result => ({
      ...result.errand,
      requester: result.requester,
    }));
  }

  // Chat operations
  async getChatRooms(userId: string): Promise<ChatRoomWithDetails[]> {
    const results = await db
      .select({
        chatRoom: chatRooms,
        errand: errands,
        requester: users,
      })
      .from(chatRooms)
      .innerJoin(errands, eq(chatRooms.errandId, errands.id))
      .innerJoin(users, eq(chatRooms.requesterId, users.id))
      .where(or(
        eq(chatRooms.requesterId, userId),
        eq(chatRooms.runnerId, userId)
      ))
      .orderBy(desc(chatRooms.lastMessageAt));

    // Get runner details and messages for each chat room
    const chatRoomsWithDetails: ChatRoomWithDetails[] = [];
    
    for (const result of results) {
      const [runner] = await db
        .select()
        .from(users)
        .where(eq(users.id, result.chatRoom.runnerId));

      const messages = await this.getChatMessages(result.chatRoom.id);

      chatRoomsWithDetails.push({
        ...result.chatRoom,
        errand: result.errand,
        requester: result.requester,
        runner,
        messages,
      });
    }

    return chatRoomsWithDetails;
  }

  async getChatRoom(errandId: number, requesterId: string, runnerId: string): Promise<ChatRoom | undefined> {
    const [chatRoom] = await db
      .select()
      .from(chatRooms)
      .where(and(
        eq(chatRooms.errandId, errandId),
        eq(chatRooms.requesterId, requesterId),
        eq(chatRooms.runnerId, runnerId)
      ));
    return chatRoom;
  }

  async createChatRoom(errandId: number, requesterId: string, runnerId: string): Promise<ChatRoom> {
    const [chatRoom] = await db
      .insert(chatRooms)
      .values({
        errandId,
        requesterId,
        runnerId,
      })
      .returning();
    return chatRoom;
  }

  async getChatMessages(chatRoomId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatRoomId, chatRoomId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(messageData: InsertChatMessage & { senderId: string }): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();

    // Update chat room last message time
    await db
      .update(chatRooms)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatRooms.id, messageData.chatRoomId));

    return message;
  }
}

export const storage = new DatabaseStorage();
