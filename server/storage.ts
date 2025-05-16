import {
  users, User, InsertUser,
  plants, Plant, InsertPlant,
  userPlants, UserPlant, InsertUserPlant,
  wateringHistory, WateringHistory, InsertWateringHistory,
  categories, Category, InsertCategory
} from "../shared/schema.js";
import { addDays, format } from "date-fns";
import { client } from './database.js';

// Helper function to map user plant database row to UserPlant object
const mapUserPlantRow = (row: any): UserPlant => ({
  id: row.id,
  userId: row.user_id,
  plantId: row.plant_id,
  nickname: row.nickname,
  location: row.location,
  lastWatered: row.last_watered,
  wateringFrequency: row.watering_frequency,
  nextWaterDate: row.next_water_date,
  imageUrl: row.image_url,
  notes: row.notes,
  createdAt: row.created_at
});

// Database interface for plant operations
interface Storage {
  createPlant(insertPlant: InsertPlant): Promise<Plant>;
  getPlant(id: number): Promise<Plant | null>;
  getAllPlants(): Promise<Plant[]>;
  getCategory(name: string): Promise<Category | null>;
  updateCategory(category: Category): Promise<Category>;
  createUserPlant(insertUserPlant: InsertUserPlant): Promise<UserPlant>;
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

class DatabaseStorage implements Storage {

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    try {
      const result = await client.query(
        'INSERT INTO plants (name, botanical_name, description, image_url, watering_frequency, light_requirements, difficulty, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          insertPlant.name,
          insertPlant.botanicalName,
          insertPlant.description,
          insertPlant.imageUrl,
          insertPlant.wateringFrequency,
          insertPlant.lightRequirements,
          insertPlant.difficulty,
          insertPlant.category
        ]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        botanicalName: row.botanical_name,
        description: row.description,
        imageUrl: row.image_url,
        wateringFrequency: row.watering_frequency,
        lightRequirements: row.light_requirements,
        difficulty: row.difficulty,
        category: row.category
      };
    } catch (error) {
      console.error('Error creating plant:', error);
      throw error;
    }
  }

  async getPlant(id: number): Promise<Plant | null> {
    try {
      const result = await client.query('SELECT * FROM plants WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        botanicalName: row.botanical_name,
        description: row.description,
        imageUrl: row.image_url,
        wateringFrequency: row.watering_frequency,
        lightRequirements: row.light_requirements,
        difficulty: row.difficulty,
        category: row.category
      };
    } catch (error) {
      console.error('Error fetching plant:', error);
      return null;
    }
  }

  async getAllPlants(): Promise<Plant[]> {
    try {
      const result = await client.query('SELECT * FROM plants');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        botanicalName: row.botanical_name,
        description: row.description,
        imageUrl: row.image_url,
        wateringFrequency: row.watering_frequency,
        lightRequirements: row.light_requirements,
        difficulty: row.difficulty,
        category: row.category
      }));
    } catch (error) {
      console.error('Error fetching plants:', error);
      return [];
    }
  }

  async getCategory(name: string): Promise<Category | null> {
    try {
      const result = await client.query('SELECT * FROM categories WHERE name = $1', [name]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        plantCount: row.plant_count
      };
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  async updateCategory(category: Category): Promise<Category> {
    try {
      const result = await client.query(
        'UPDATE categories SET name = $1, description = $2, image_url = $3, plant_count = $4 WHERE id = $5 RETURNING *',
        [category.name, category.description, category.imageUrl, category.plantCount, category.id]
      );
      if (result.rows.length === 0) {
        throw new Error("Category not found");
      }
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        plantCount: row.plant_count
      };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async createUserPlant(insertUserPlant: InsertUserPlant): Promise<UserPlant> {
    try {
      const now = new Date();
      const lastWatered = format(now, 'yyyy-MM-dd');
      const nextWaterDate = format(addDays(now, insertUserPlant.wateringFrequency), 'yyyy-MM-dd');

      const result = await client.query(
        'INSERT INTO user_plants (user_id, plant_id, nickname, location, last_watered, watering_frequency, next_water_date, image_url, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [
          insertUserPlant.userId,
          insertUserPlant.plantId,
          insertUserPlant.nickname,
          insertUserPlant.location,
          lastWatered,
          insertUserPlant.wateringFrequency,
          nextWaterDate,
          insertUserPlant.imageUrl,
          insertUserPlant.notes,
          now
        ]
      );

      const row = result.rows[0];
      return mapUserPlantRow(row);
    } catch (error) {
      console.error('Error creating user plant:', error);
      throw error;
    }
  }

  async getUserPlant(id: number): Promise<UserPlant | null> {
    try {
      const result = await client.query('SELECT * FROM user_plants WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return mapUserPlantRow(result.rows[0]);
    } catch (error) {
      console.error('Error fetching user plant:', error);
      return null;
    }
  }

  async updateUserPlant(userPlant: UserPlant): Promise<UserPlant> {
    try {
      const result = await client.query(
        'UPDATE user_plants SET user_id = $1, plant_id = $2, nickname = $3, location = $4, last_watered = $5, watering_frequency = $6, next_water_date = $7, image_url = $8, notes = $9, created_at = $10 WHERE id = $11 RETURNING *',
        [
          userPlant.userId,
          userPlant.plantId,
          userPlant.nickname,
          userPlant.location,
          userPlant.lastWatered,
          userPlant.wateringFrequency,
          userPlant.nextWaterDate,
          userPlant.imageUrl,
          userPlant.notes,
          userPlant.createdAt,
          userPlant.id
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error("User plant not found");
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        plantId: row.plant_id,
        nickname: row.nickname,
        location: row.location,
        lastWatered: row.last_watered,
        wateringFrequency: row.watering_frequency,
        nextWaterDate: row.next_water_date,
        imageUrl: row.image_url,
        notes: row.notes,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error updating user plant:', error);
      throw error;
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const result = await client.query('SELECT * FROM categories');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        plantCount: row.plant_count
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getPlantsByCategory(category: string): Promise<Plant[]> {
    try {
      const result = await client.query('SELECT * FROM plants WHERE category = $1', [category]);
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        botanicalName: row.botanical_name,
        description: row.description,
        imageUrl: row.image_url,
        wateringFrequency: row.watering_frequency,
        lightRequirements: row.light_requirements,
        difficulty: row.difficulty,
        category: row.category
      }));
    } catch (error) {
      console.error('Error fetching plants by category:', error);
      return [];
    }
  }

  async getAllUserPlants(userId: number): Promise<UserPlant[]> {
    try {
      const result = await client.query('SELECT * FROM user_plants WHERE user_id = $1', [userId]);
      return result.rows.map(mapUserPlantRow);
    } catch (error) {
      console.error('Error fetching user plants:', error);
      return [];
    }
  }

  async deleteUserPlant(id: number): Promise<boolean> {
    try {
      const result = await client.query('DELETE FROM user_plants WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user plant:', error);
      return false;
    }
  }

  async getWateringHistory(userPlantId: number): Promise<WateringHistory[]> {
    try {
      const result = await client.query('SELECT * FROM watering_history WHERE user_plant_id = $1', [userPlantId]);
      return result.rows.map(row => ({
        id: row.id,
        userPlantId: row.user_plant_id,
        wateredDate: row.watered_date,
        notes: row.notes
      }));
    } catch (error) {
      console.error('Error fetching watering history:', error);
      return [];
    }
  }

  async getPlantsNeedingWater(userId: number): Promise<UserPlant[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const result = await client.query(
        'SELECT * FROM user_plants WHERE user_id = $1 AND next_water_date <= $2',
        [userId, today]
      );
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        plantId: row.plant_id,
        nickname: row.nickname,
        location: row.location,
        lastWatered: row.last_watered,
        wateringFrequency: row.watering_frequency,
        nextWaterDate: row.next_water_date,
        imageUrl: row.image_url,
        notes: row.notes,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching plants needing water:', error);
      return [];
    }
  }

  async getHealthyPlants(userId: number): Promise<UserPlant[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const result = await client.query(
        'SELECT * FROM user_plants WHERE user_id = $1 AND next_water_date > $2',
        [userId, today]
      );
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        plantId: row.plant_id,
        nickname: row.nickname,
        location: row.location,
        lastWatered: row.last_watered,
        wateringFrequency: row.watering_frequency,
        nextWaterDate: row.next_water_date,
        imageUrl: row.image_url,
        notes: row.notes,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching healthy plants:', error);
      return [];
    }
  }

  async getUpcomingWateringPlants(userId: number): Promise<UserPlant[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const result = await client.query(
        'SELECT * FROM user_plants WHERE user_id = $1 AND next_water_date > $2 AND next_water_date <= $3',
        [userId, today, nextWeek]
      );
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        plantId: row.plant_id,
        nickname: row.nickname,
        location: row.location,
        lastWatered: row.last_watered,
        wateringFrequency: row.watering_frequency,
        nextWaterDate: row.next_water_date,
        imageUrl: row.image_url,
        notes: row.notes,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching upcoming watering plants:', error);
      return [];
    }
  }
}

// Export an instance of the storage
export const storage = new DatabaseStorage();
