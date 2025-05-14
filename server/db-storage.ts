import {
  users, User, InsertUser,
  plants, Plant, InsertPlant,
  userPlants, UserPlant, InsertUserPlant,
  wateringHistory, WateringHistory, InsertWateringHistory,
  categories, Category, InsertCategory,
  wishlist, Wishlist, InsertWishlist
} from "@shared/schema";
import { addDays } from "date-fns";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, lte, gt, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  async upsertUser(userData: Partial<User> & { id: number }): Promise<User> {
    const { id, ...rest } = userData;
    const [updatedUser] = await db
      .update(users)
      .set({
        ...rest,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  // Plant catalog methods
  async getPlants(): Promise<Plant[]> {
    return db.select().from(plants);
  }
  
  async getPlant(id: number): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant;
  }
  
  async getPlantsByCategory(category: string): Promise<Plant[]> {
    return db.select().from(plants).where(eq(plants.category, category));
  }
  
  async createPlant(plant: InsertPlant): Promise<Plant> {
    const [createdPlant] = await db.insert(plants).values(plant).returning();
    
    // Update plant count in category
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, plant.category));
    
    if (category) {
      await db
        .update(categories)
        .set({ plantCount: (category.plantCount || 0) + 1 })
        .where(eq(categories.id, category.id));
    }
    
    return createdPlant;
  }
  
  // User's plant collection methods
  async getUserPlants(userId: number): Promise<UserPlant[]> {
    return db.select().from(userPlants).where(eq(userPlants.userId, userId));
  }
  
  async getUserPlant(id: number): Promise<UserPlant | undefined> {
    const [userPlant] = await db.select().from(userPlants).where(eq(userPlants.id, id));
    return userPlant;
  }
  
  async createUserPlant(userPlant: InsertUserPlant): Promise<UserPlant> {
    // Calculate next water date if not provided
    let nextWaterDate = userPlant.nextWaterDate;
    
    if (!nextWaterDate && userPlant.lastWatered) {
      nextWaterDate = addDays(new Date(userPlant.lastWatered), userPlant.wateringFrequency);
    }
    
    const [createdUserPlant] = await db
      .insert(userPlants)
      .values({
        ...userPlant,
        nextWaterDate
      })
      .returning();
    
    return createdUserPlant;
  }
  
  async updateUserPlant(id: number, update: Partial<InsertUserPlant>): Promise<UserPlant | undefined> {
    const [existingUserPlant] = await db
      .select()
      .from(userPlants)
      .where(eq(userPlants.id, id));
    
    if (!existingUserPlant) return undefined;
    
    // If watering frequency or last watered date changes, recalculate next water date
    let nextWaterDate = existingUserPlant.nextWaterDate;
    const wateringFrequency = update.wateringFrequency ?? existingUserPlant.wateringFrequency;
    
    if (update.lastWatered) {
      nextWaterDate = addDays(new Date(update.lastWatered), wateringFrequency);
    } else if (update.wateringFrequency !== undefined && existingUserPlant.lastWatered) {
      nextWaterDate = addDays(new Date(existingUserPlant.lastWatered), wateringFrequency);
    }
    
    const [updatedUserPlant] = await db
      .update(userPlants)
      .set({
        ...update,
        nextWaterDate,
        updatedAt: new Date()
      })
      .where(eq(userPlants.id, id))
      .returning();
    
    return updatedUserPlant;
  }
  
  async deleteUserPlant(id: number): Promise<boolean> {
    const result = await db
      .delete(userPlants)
      .where(eq(userPlants.id, id));
    
    return result.rowCount > 0;
  }
  
  // Watering history methods
  async getWateringHistory(userPlantId: number): Promise<WateringHistory[]> {
    return db
      .select()
      .from(wateringHistory)
      .where(eq(wateringHistory.userPlantId, userPlantId))
      .orderBy(desc(wateringHistory.wateredDate));
  }
  
  async createWateringRecord(watering: InsertWateringHistory): Promise<WateringHistory> {
    const [createdRecord] = await db
      .insert(wateringHistory)
      .values(watering)
      .returning();
    
    return createdRecord;
  }
  
  async waterPlant(userPlantId: number, notes?: string): Promise<WateringHistory> {
    const userPlant = await this.getUserPlant(userPlantId);
    if (!userPlant) {
      throw new Error('User plant not found');
    }
    
    const today = new Date();
    
    // Update the user plant with new watering date
    await this.updateUserPlant(userPlantId, {
      lastWatered: today,
      nextWaterDate: addDays(today, userPlant.wateringFrequency)
    });
    
    // Create watering record
    return this.createWateringRecord({
      userPlantId,
      wateredDate: today,
      notes: notes || null
    });
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [createdCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    
    return createdCategory;
  }
  
  // Wishlist methods
  async getWishlist(userId: number): Promise<Wishlist[]> {
    return db
      .select()
      .from(wishlist)
      .where(eq(wishlist.userId, userId));
  }
  
  async getWishlistWithPlants(userId: number): Promise<(Wishlist & { plant: Plant })[]> {
    const userWishlist = await this.getWishlist(userId);
    const result: (Wishlist & { plant: Plant })[] = [];
    
    for (const item of userWishlist) {
      const plant = await this.getPlant(item.plantId);
      if (plant) {
        result.push({
          ...item,
          plant
        });
      }
    }
    
    return result;
  }
  
  async addToWishlist(userId: number, plantId: number): Promise<Wishlist> {
    // Check if already in wishlist
    const [existingItem] = await db
      .select()
      .from(wishlist)
      .where(and(
        eq(wishlist.userId, userId),
        eq(wishlist.plantId, plantId)
      ));
    
    if (existingItem) {
      return existingItem;
    }
    
    // Add new wishlist item
    const [createdItem] = await db
      .insert(wishlist)
      .values({
        userId,
        plantId
      })
      .returning();
    
    return createdItem;
  }
  
  async removeFromWishlist(userId: number, plantId: number): Promise<boolean> {
    const result = await db
      .delete(wishlist)
      .where(and(
        eq(wishlist.userId, userId),
        eq(wishlist.plantId, plantId)
      ));
    
    return result.rowCount > 0;
  }
  
  async isInWishlist(userId: number, plantId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(wishlist)
      .where(and(
        eq(wishlist.userId, userId),
        eq(wishlist.plantId, plantId)
      ));
    
    return !!item;
  }
  
  // Utility methods
  async getPlantsNeedingWater(userId: number): Promise<UserPlant[]> {
    const today = new Date();
    
    return db
      .select()
      .from(userPlants)
      .where(and(
        eq(userPlants.userId, userId),
        lte(userPlants.nextWaterDate, today)
      ));
  }
  
  async getHealthyPlants(userId: number): Promise<UserPlant[]> {
    const today = new Date();
    const threeDaysLater = addDays(today, 3);
    
    return db
      .select()
      .from(userPlants)
      .where(and(
        eq(userPlants.userId, userId),
        gt(userPlants.nextWaterDate, threeDaysLater)
      ));
  }
  
  async getUpcomingWateringPlants(userId: number): Promise<UserPlant[]> {
    const today = new Date();
    const threeDaysLater = addDays(today, 3);
    
    return db
      .select()
      .from(userPlants)
      .where(and(
        eq(userPlants.userId, userId),
        gt(userPlants.nextWaterDate, today),
        lte(userPlants.nextWaterDate, threeDaysLater)
      ));
  }
}