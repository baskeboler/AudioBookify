import {
  users,
  audiobooks,
  listeningProgress,
  type User,
  type UpsertUser,
  type InsertAudiobook,
  type Audiobook,
  type AudiobookWithProgress,
  type InsertListeningProgress,
  type ListeningProgress,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Audiobook operations
  createAudiobook(audiobook: InsertAudiobook): Promise<Audiobook>;
  getAudiobook(id: string): Promise<Audiobook | undefined>;
  getUserAudiobooks(userId: string): Promise<AudiobookWithProgress[]>;
  updateAudiobook(id: string, updates: Partial<Audiobook>): Promise<Audiobook>;
  deleteAudiobook(id: string): Promise<void>;
  
  // Listening progress operations
  updateListeningProgress(progress: InsertListeningProgress): Promise<ListeningProgress>;
  getListeningProgress(userId: string, audiobookId: string): Promise<ListeningProgress | undefined>;
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

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Audiobook operations
  async createAudiobook(audiobook: InsertAudiobook): Promise<Audiobook> {
    const [newAudiobook] = await db
      .insert(audiobooks)
      .values(audiobook)
      .returning();
    return newAudiobook;
  }

  async getAudiobook(id: string): Promise<Audiobook | undefined> {
    const [audiobook] = await db
      .select()
      .from(audiobooks)
      .where(eq(audiobooks.id, id));
    return audiobook;
  }

  async getUserAudiobooks(userId: string): Promise<AudiobookWithProgress[]> {
    const results = await db
      .select({
        audiobook: audiobooks,
        progress: listeningProgress,
      })
      .from(audiobooks)
      .leftJoin(
        listeningProgress,
        and(
          eq(listeningProgress.audiobookId, audiobooks.id),
          eq(listeningProgress.userId, userId)
        )
      )
      .where(eq(audiobooks.userId, userId))
      .orderBy(desc(audiobooks.createdAt));

    return results.map(({ audiobook, progress }) => ({
      ...audiobook,
      listeningProgress: progress ? {
        currentTime: progress.currentTime,
        completed: progress.completed,
      } : undefined,
    }));
  }

  async updateAudiobook(id: string, updates: Partial<Audiobook>): Promise<Audiobook> {
    const [audiobook] = await db
      .update(audiobooks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(audiobooks.id, id))
      .returning();
    return audiobook;
  }

  async deleteAudiobook(id: string): Promise<void> {
    await db.delete(audiobooks).where(eq(audiobooks.id, id));
  }

  // Listening progress operations
  async updateListeningProgress(progress: InsertListeningProgress): Promise<ListeningProgress> {
    const [result] = await db
      .insert(listeningProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [listeningProgress.userId, listeningProgress.audiobookId],
        set: {
          currentTime: progress.currentTime,
          completed: progress.completed,
          lastListenedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getListeningProgress(userId: string, audiobookId: string): Promise<ListeningProgress | undefined> {
    const [progress] = await db
      .select()
      .from(listeningProgress)
      .where(
        and(
          eq(listeningProgress.userId, userId),
          eq(listeningProgress.audiobookId, audiobookId)
        )
      );
    return progress;
  }
}

export const storage = new DatabaseStorage();
