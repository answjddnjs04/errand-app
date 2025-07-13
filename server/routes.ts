import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./kakaoAuth";
import { insertErrandSchema, insertChatMessageSchema, users } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // req.user는 이미 카카오 인증으로 가져온 사용자 정보
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Errand routes
  app.get('/api/errands', async (req, res) => {
    try {
      const { urgency, maxDistance, userLat, userLng } = req.query;
      const filters = {
        urgency: urgency as string,
        maxDistance: maxDistance ? parseInt(maxDistance as string) : undefined,
        userLat: userLat ? parseFloat(userLat as string) : undefined,
        userLng: userLng ? parseFloat(userLng as string) : undefined,
      };
      
      const errands = await storage.getErrands(undefined, filters);
      res.json(errands);
    } catch (error) {
      console.error("Error fetching errands:", error);
      res.status(500).json({ message: "Failed to fetch errands" });
    }
  });

  app.get('/api/errands/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const errand = await storage.getErrand(id);
      
      if (!errand) {
        return res.status(404).json({ message: "Errand not found" });
      }
      
      res.json(errand);
    } catch (error) {
      console.error("Error fetching errand:", error);
      res.status(500).json({ message: "Failed to fetch errand" });
    }
  });

  app.post('/api/errands', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertErrandSchema.parse(req.body);
      
      const errand = await storage.createErrand({
        ...validatedData,
        requesterId: userId,
      });
      
      res.json(errand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating errand:", error);
      res.status(500).json({ message: "Failed to create errand" });
    }
  });

  app.patch('/api/errands/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const errandId = parseInt(req.params.id);
      
      const errand = await storage.getErrand(errandId);
      if (!errand) {
        return res.status(404).json({ message: "Errand not found" });
      }
      
      if (errand.status !== "waiting") {
        return res.status(400).json({ message: "Errand is no longer available" });
      }
      
      if (errand.requesterId === userId) {
        return res.status(400).json({ message: "Cannot accept your own errand" });
      }
      
      const updatedErrand = await storage.updateErrand(errandId, {
        runnerId: userId,
        status: "matched",
      });
      
      // Create chat room
      await storage.createChatRoom(errandId, errand.requesterId, userId);
      
      res.json(updatedErrand);
    } catch (error) {
      console.error("Error accepting errand:", error);
      res.status(500).json({ message: "Failed to accept errand" });
    }
  });

  app.get('/api/my-errands', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type } = req.query;
      
      if (!type || (type !== 'requested' && type !== 'accepted')) {
        return res.status(400).json({ message: "Invalid type parameter" });
      }
      
      const errands = await storage.getUserErrands(userId, type);
      res.json(errands);
    } catch (error) {
      console.error("Error fetching user errands:", error);
      res.status(500).json({ message: "Failed to fetch user errands" });
    }
  });

  // Chat routes
  app.get('/api/chat-rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const chatRooms = await storage.getChatRooms(userId);
      res.json(chatRooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.get('/api/chat-rooms/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const chatRoomId = parseInt(req.params.id);
      const messages = await storage.getChatMessages(chatRoomId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat-rooms/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const chatRoomId = parseInt(req.params.id);
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      const message = await storage.createChatMessage({
        ...validatedData,
        chatRoomId,
        senderId: userId,
      });
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // Profile routes
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { location, maxDistance } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user location and maxDistance in the database directly
      const [updatedUser] = await db
        .update(users)
        .set({
          location: location || user.location,
          maxDistance: maxDistance || user.maxDistance,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
