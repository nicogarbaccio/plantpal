import {
  users, User, InsertUser,
  plants, Plant, InsertPlant,
  userPlants, UserPlant, InsertUserPlant,
  wateringHistory, WateringHistory, InsertWateringHistory,
  categories, Category, InsertCategory
} from "../shared/schema.js";
import { addDays, format } from "date-fns";

// Modify the interface with any CRUD methods
// you might need
interface Storage {
  createPlant(insertPlant: InsertPlant): Promise<Plant>;
  getPlant(id: number): Promise<Plant | null>;
  getAllPlants(): Promise<Plant[]>;
  getCategory(name: string): Promise<Category | null>;
  updateCategory(category: Category): Promise<Category>;
  getUserPlant(id: number): Promise<UserPlant | null>;
  updateUserPlant(userPlant: UserPlant): Promise<UserPlant>;
  getAllCategories(): Promise<Category[]>;
  getPlantsByCategory(category: string): Promise<Plant[]>;
  getAllUserPlants(userId: number): Promise<UserPlant[]>;
  deleteUserPlant(id: number): Promise<boolean>;
  getWateringHistory(userPlantId: number): Promise<WateringHistory[]>;
  getPlantsNeedingWater(userId: number): Promise<UserPlant[]>;
  getHealthyPlants(userId: number): Promise<UserPlant[]>;
  getUpcomingWateringPlants(userId: number): Promise<UserPlant[]>;
}

class InMemoryStorage implements Storage {
  private plants: Plant[] = [];
  private users: User[] = [];
  private userPlants: UserPlant[] = [];
  private wateringHistory: WateringHistory[] = [];
  private categories: Category[] = [];
  private nextId = 1;

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = this.nextId++;
    const plant: Plant = {
      ...insertPlant,
      id,
      imageUrl: insertPlant.imageUrl ?? null
    };
    this.plants.push(plant);

    const category = await this.getCategory(insertPlant.category);
    if (category) {
      const updatedCategory = {
        ...category,
        plantCount: (category.plantCount || 0) + 1
      };
      await this.updateCategory(updatedCategory);
    }

    return plant;
  }

  async getPlant(id: number): Promise<Plant | null> {
    return this.plants.find(p => p.id === id) ?? null;
  }

  async getAllPlants(): Promise<Plant[]> {
    return this.plants;
  }

  async getCategory(name: string): Promise<Category | null> {
    return this.categories.find(c => c.name === name) ?? null;
  }

  async updateCategory(category: Category): Promise<Category> {
    const index = this.categories.findIndex(c => c.id === category.id);
    if (index === -1) {
      throw new Error("Category not found");
    }
    this.categories[index] = category;
    return category;
  }

  async createUserPlant(insertUserPlant: InsertUserPlant): Promise<UserPlant> {
    const id = this.nextId++;
    const now = new Date();
    const lastWatered = format(now, 'yyyy-MM-dd');
    const nextWaterDate = format(addDays(now, insertUserPlant.wateringFrequency), 'yyyy-MM-dd');

    const userPlant: UserPlant = {
      ...insertUserPlant,
      id,
      imageUrl: insertUserPlant.imageUrl ?? null,
      nickname: insertUserPlant.nickname ?? null,
      location: insertUserPlant.location ?? null,
      lastWatered,
      nextWaterDate,
      notes: insertUserPlant.notes ?? null,
      createdAt: now
    };
    this.userPlants.push(userPlant);
    return userPlant;
  }

  async getUserPlant(id: number): Promise<UserPlant | null> {
    return this.userPlants.find(p => p.id === id) ?? null;
  }

  async updateUserPlant(userPlant: UserPlant): Promise<UserPlant> {
    const index = this.userPlants.findIndex(p => p.id === userPlant.id);
    if (index === -1) {
      throw new Error("User plant not found");
    }
    this.userPlants[index] = userPlant;
    return userPlant;
  }

  async createWateringHistory(insertWatering: InsertWateringHistory): Promise<WateringHistory> {
    const id = this.nextId++;
    const watering: WateringHistory = {
      ...insertWatering,
      id,
      notes: insertWatering.notes ?? null
    };
    this.wateringHistory.push(watering);
    return watering;
  }

  async waterPlant(userPlantId: number, notes?: string): Promise<void> {
    const userPlant = await this.getUserPlant(userPlantId);
    if (!userPlant) {
      throw new Error("User plant not found");
    }

    const today = new Date();
    await this.updateUserPlant({
      ...userPlant,
      lastWatered: format(today, 'yyyy-MM-dd'),
      nextWaterDate: format(addDays(today, userPlant.wateringFrequency), 'yyyy-MM-dd')
    });

    await this.createWateringHistory({
      userPlantId,
      wateredDate: format(today, 'yyyy-MM-dd'),
      notes: notes ?? null
    });
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.nextId++;
    const category: Category = {
      ...insertCategory,
      id,
      imageUrl: insertCategory.imageUrl ?? null,
      plantCount: insertCategory.plantCount ?? null
    };
    this.categories.push(category);
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categories;
  }

  async getPlantsByCategory(category: string): Promise<Plant[]> {
    return this.plants.filter(p => p.category === category);
  }

  async getAllUserPlants(userId: number): Promise<UserPlant[]> {
    return this.userPlants.filter(p => p.userId === userId);
  }

  async deleteUserPlant(id: number): Promise<boolean> {
    const index = this.userPlants.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }
    this.userPlants.splice(index, 1);
    return true;
  }

  async getWateringHistory(userPlantId: number): Promise<WateringHistory[]> {
    return this.wateringHistory.filter(w => w.userPlantId === userPlantId);
  }

  async getPlantsNeedingWater(userId: number): Promise<UserPlant[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.userPlants.filter(p => 
      p.userId === userId && 
      p.nextWaterDate != null && 
      p.nextWaterDate <= today
    );
  }

  async getHealthyPlants(userId: number): Promise<UserPlant[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.userPlants.filter(p => 
      p.userId === userId && 
      p.nextWaterDate != null && 
      p.nextWaterDate > today
    );
  }

  async getUpcomingWateringPlants(userId: number): Promise<UserPlant[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    return this.userPlants.filter(p => 
      p.userId === userId && 
      p.nextWaterDate != null && 
      p.nextWaterDate > today && 
      p.nextWaterDate <= nextWeek
    );
  }
}

// Export an instance of the storage
export const storage = new InMemoryStorage();
