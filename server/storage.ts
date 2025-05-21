import {
  users, User, InsertUser,
  plants, Plant, InsertPlant,
  userPlants, UserPlant, InsertUserPlant,
  wateringHistory, WateringHistory, InsertWateringHistory,
  categories, Category, InsertCategory
} from "../shared/schema.js";
import { addDays, format, subDays } from "date-fns";
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
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  waterPlant(id: number, notes: string): Promise<WateringHistory>;

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
  updateWateringHistory(id: number, wateredDate: string | null, notes: string | null): Promise<WateringHistory>;
  deleteWateringHistory(id: number): Promise<boolean>;
  getPlantsNeedingWater(userId: number): Promise<UserPlant[]>;
  getHealthyPlants(userId: number): Promise<UserPlant[]>;
  getUpcomingWateringPlants(userId: number): Promise<UserPlant[]>;
}

class DatabaseStorage implements Storage {
  // User management methods
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await client.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        [insertUser.username, insertUser.email, insertUser.password]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | null> {
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password
      };
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password
      };
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async waterPlant(id: number, notes: string): Promise<WateringHistory> {
    try {
      const today = new Date();
      const wateringRecord = {
        userPlantId: id,
        wateredDate: format(today, 'yyyy-MM-dd'),
        notes: notes || ''
      };

      // Insert watering record
      const wateringResult = await client.query(
        'INSERT INTO watering_history (user_plant_id, watered_date, notes) VALUES ($1, $2, $3) RETURNING *',
        [wateringRecord.userPlantId, wateringRecord.wateredDate, wateringRecord.notes]
      );

      // Update user plant's last watered and next water date
      const userPlant = await this.getUserPlant(id);
      if (userPlant) {
        const nextWaterDate = format(addDays(today, userPlant.wateringFrequency), 'yyyy-MM-dd');
        await client.query(
          'UPDATE user_plants SET last_watered = $1, next_water_date = $2 WHERE id = $3',
          [wateringRecord.wateredDate, nextWaterDate, id]
        );
      }

      const row = wateringResult.rows[0];
      return {
        id: row.id,
        userPlantId: row.user_plant_id,
        wateredDate: row.watered_date,
        notes: row.notes,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error recording watering:', error);
      throw error;
    }
  }

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
      // Validate that the plant exists first
      const plant = await client.query('SELECT id FROM plants WHERE id = $1', [insertUserPlant.plantId]);
      if (plant.rows.length === 0) {
        throw new Error(`Plant with id ${insertUserPlant.plantId} not found`);
      }

      // Handle dates consistently
      const now = new Date();
      const formattedLastWatered = format(
        insertUserPlant.lastWatered ? new Date(insertUserPlant.lastWatered) : now,
        'yyyy-MM-dd'
      );
      const formattedNextWaterDate = format(
        insertUserPlant.nextWaterDate 
          ? new Date(insertUserPlant.nextWaterDate)
          : addDays(now, insertUserPlant.wateringFrequency),
        'yyyy-MM-dd'
      );

      // Validate required fields
      if (!insertUserPlant.nickname?.trim()) {
        throw new Error('Required field missing: nickname');
      }
      if (!insertUserPlant.location?.trim()) {
        throw new Error('Required field missing: location');
      }
      
      console.log('Creating user plant with data:', {
        ...insertUserPlant,
        lastWatered: formattedLastWatered,
        nextWaterDate: formattedNextWaterDate
      });

      // Insert the user plant with proper date handling
      const result = await client.query(
        'INSERT INTO user_plants (user_id, plant_id, nickname, location, last_watered, watering_frequency, next_water_date, image_url, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [
          insertUserPlant.userId,
          insertUserPlant.plantId,
          insertUserPlant.nickname.trim(),
          insertUserPlant.location.trim(),
          formattedLastWatered,
          insertUserPlant.wateringFrequency,
          formattedNextWaterDate,
          insertUserPlant.imageUrl?.trim() || null,
          insertUserPlant.notes?.trim() || null,
          now
        ]
      );

      if (!result.rows[0]) {
        throw new Error('Failed to create user plant - no row returned');
      }

      return mapUserPlantRow(result.rows[0]);
    } catch (error: any) {
      // Improve error messages for common database errors
      console.error('Database error details:', error);
      
      if (error.code === '23503') {
        throw new Error('Invalid plant or user reference');
      } else if (error.code === '23502') {
        throw new Error(`Required field missing: ${error.column}`);
      } else if (error.message.includes('not found') || error.message.includes('Required field')) {
        throw error; // Preserve these specific error messages
      } else {
        console.error('Unexpected error in createUserPlant:', error);
        throw new Error('Database error occurred while creating user plant');
      }
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
      const result = await client.query(
        'SELECT * FROM watering_history WHERE user_plant_id = $1 ORDER BY watered_date DESC, created_at DESC NULLS LAST',
        [userPlantId]
      );
      return result.rows.map(row => ({
        id: row.id,
        userPlantId: row.user_plant_id,
        wateredDate: row.watered_date,
        notes: row.notes,
        createdAt: row.created_at
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

  async updateWateringHistory(id: number, wateredDate: string | null, notes: string | null): Promise<WateringHistory> {
    try {
      const result = await client.query(
        'UPDATE watering_history SET watered_date = COALESCE($1, watered_date), notes = COALESCE($2, notes) WHERE id = $3 RETURNING *',
        [wateredDate, notes, id]
      );
      
      if (result.rows.length === 0) {
        throw new Error("Watering record not found");
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userPlantId: row.user_plant_id,
        wateredDate: row.watered_date,
        notes: row.notes,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error updating watering record:', error);
      throw error;
    }
  }

  async deleteWateringHistory(id: number): Promise<boolean> {
    try {
      // First get the watering record to find the user_plant_id
      const wateringRecord = await client.query(
        'SELECT user_plant_id FROM watering_history WHERE id = $1',
        [id]
      );

      if (wateringRecord.rows.length === 0) {
        return false;
      }

      const userPlantId = wateringRecord.rows[0].user_plant_id;

      // Delete the watering record
      const deleteResult = await client.query(
        'DELETE FROM watering_history WHERE id = $1',
        [id]
      );

      if (deleteResult.rowCount === 0) {
        return false;
      }

      // Check if this was the last watering record
      const remainingRecords = await client.query(
        'SELECT * FROM watering_history WHERE user_plant_id = $1 ORDER BY watered_date DESC LIMIT 1',
        [userPlantId]
      );

      // If no remaining records, update the plant's watering status
      if (remainingRecords.rows.length === 0) {
        // Get the plant's watering frequency
        const plantResult = await client.query(
          'SELECT watering_frequency FROM user_plants WHERE id = $1',
          [userPlantId]
        );

        if (plantResult.rows.length > 0) {
          const { watering_frequency } = plantResult.rows[0];
          const yesterday = format(subDays(new Date(), watering_frequency + 1), 'yyyy-MM-dd');
          const nextWaterDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');

          // Update the plant to be overdue
          await client.query(
            'UPDATE user_plants SET last_watered = $1, next_water_date = $2 WHERE id = $3',
            [yesterday, nextWaterDate, userPlantId]
          );
        }
      } else {
        // Update the plant with the most recent watering record
        const lastWatered = remainingRecords.rows[0].watered_date;
        const wateringFrequency = (await client.query(
          'SELECT watering_frequency FROM user_plants WHERE id = $1',
          [userPlantId]
        )).rows[0].watering_frequency;

        const nextWaterDate = format(addDays(new Date(lastWatered), wateringFrequency), 'yyyy-MM-dd');

        await client.query(
          'UPDATE user_plants SET last_watered = $1, next_water_date = $2 WHERE id = $3',
          [lastWatered, nextWaterDate, userPlantId]
        );
      }

      return true;
    } catch (error) {
      console.error('Error deleting watering record:', error);
      return false;
    }
  }
}

// Export an instance of the storage
export const storage = new DatabaseStorage();
