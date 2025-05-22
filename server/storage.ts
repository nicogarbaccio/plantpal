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
  createdAt: row.created_at,
  needsInitialWatering: row.needs_initial_watering
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
        wateredDate: format(today, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''),
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
        const nextWaterDate = format(addDays(today, userPlant.wateringFrequency), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
        await client.query(
          'UPDATE user_plants SET last_watered = $1, next_water_date = $2, needs_initial_watering = false WHERE id = $3',
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
      // Log the input data
      console.log('Creating user plant with data:', {
        ...insertUserPlant,
        password: undefined // Don't log sensitive data
      });

      // Validate that the plant exists first
      const plant = await client.query('SELECT id FROM plants WHERE id = $1', [insertUserPlant.plantId]);
      if (plant.rows.length === 0) {
        throw new Error(`Plant with id ${insertUserPlant.plantId} not found`);
      }

      // Handle dates consistently with timezone awareness
      const now = new Date();
      const lastWateredDate = insertUserPlant.lastWatered ? new Date(insertUserPlant.lastWatered) : now;
      
      // Set both dates to noon UTC
      lastWateredDate.setUTCHours(12, 0, 0, 0);
      const formattedLastWatered = lastWateredDate.toISOString();

      console.log('Formatted last watered date:', formattedLastWatered);
      
      const nextWaterDate = insertUserPlant.nextWaterDate 
        ? new Date(insertUserPlant.nextWaterDate)
        : addDays(lastWateredDate, insertUserPlant.wateringFrequency);
      // Also use UTC for next water date
      nextWaterDate.setUTCHours(12, 0, 0, 0);
      const formattedNextWaterDate = nextWaterDate.toISOString();

      console.log('Formatted next water date:', formattedNextWaterDate);

      // Validate required fields
      if (!insertUserPlant.location?.trim()) {
        throw new Error('Required field missing: location');
      }

      // If nickname is not provided, get the plant name to use as default
      if (!insertUserPlant.nickname?.trim()) {
        const plantResult = await client.query('SELECT name FROM plants WHERE id = $1', [insertUserPlant.plantId]);
        insertUserPlant.nickname = plantResult.rows[0].name;
      }

      // Log the SQL query parameters
      console.log('Inserting user plant with parameters:', {
        userId: insertUserPlant.userId,
        plantId: insertUserPlant.plantId,
        nickname: insertUserPlant.nickname?.trim() || null,
        location: insertUserPlant.location.trim(),
        lastWatered: formattedLastWatered,
        wateringFrequency: insertUserPlant.wateringFrequency,
        nextWaterDate: formattedNextWaterDate,
        imageUrl: insertUserPlant.imageUrl?.trim() || null,
        notes: insertUserPlant.notes?.trim() || null,
        createdAt: now
      });

      // Insert the user plant with proper date handling
      const result = await client.query(
        'INSERT INTO user_plants (user_id, plant_id, nickname, location, last_watered, watering_frequency, next_water_date, image_url, notes, created_at, needs_initial_watering) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false) RETURNING *',
        [
          insertUserPlant.userId,
          insertUserPlant.plantId,
          insertUserPlant.nickname?.trim() || null,
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

      // Log the successful insert
      console.log('Successfully inserted user plant:', result.rows[0]);

      // Create initial watering history record
      await client.query(
        'INSERT INTO watering_history (user_plant_id, watered_date, notes) VALUES ($1, $2, $3)',
        [result.rows[0].id, formattedLastWatered, 'Initial watering record']
      );

      return mapUserPlantRow(result.rows[0]);
    } catch (error: any) {
      // Improve error messages for common database errors
      console.error('Database error details:', {
        error: error,
        message: error.message,
        code: error.code,
        column: error.column,
        constraint: error.constraint,
        stack: error.stack
      });
      
      if (error.code === '23503') {
        throw new Error(`Invalid plant or user reference: ${error.detail || error.message}`);
      } else if (error.code === '23502') {
        throw new Error(`Required field missing: ${error.column}`);
      } else if (error.message.includes('not found') || error.message.includes('Required field')) {
        throw error; // Preserve these specific error messages
      } else {
        console.error('Unexpected error in createUserPlant:', error);
        throw new Error(`Database error occurred while creating user plant: ${error.message}`);
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
        'UPDATE user_plants SET user_id = $1, plant_id = $2, nickname = $3, location = $4, last_watered = $5, watering_frequency = $6, next_water_date = $7, image_url = $8, notes = $9, created_at = $10, needs_initial_watering = $11 WHERE id = $12 RETURNING *',
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
          userPlant.needsInitialWatering,
          userPlant.id
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error("User plant not found");
      }
      
      return mapUserPlantRow(result.rows[0]);
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
      const today = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      const result = await client.query(
        'SELECT * FROM user_plants WHERE user_id = $1 AND next_water_date <= $2',
        [userId, today]
      );
      return result.rows.map(mapUserPlantRow);
    } catch (error) {
      console.error('Error fetching plants needing water:', error);
      return [];
    }
  }

  async getHealthyPlants(userId: number): Promise<UserPlant[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      const result = await client.query(
        'SELECT * FROM user_plants WHERE user_id = $1 AND next_water_date > $2',
        [userId, today]
      );
      return result.rows.map(mapUserPlantRow);
    } catch (error) {
      console.error('Error fetching healthy plants:', error);
      return [];
    }
  }

  async getUpcomingWateringPlants(userId: number): Promise<UserPlant[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      const result = await client.query(
        'SELECT * FROM user_plants WHERE user_id = $1 AND next_water_date > $2 AND next_water_date <= $3',
        [userId, today, nextWeek]
      );
      return result.rows.map(mapUserPlantRow);
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
      const userPlantId = row.user_plant_id;

      // Get the most recent watering record for this plant
      const recentWateringResult = await client.query(
        'SELECT watered_date FROM watering_history WHERE user_plant_id = $1 ORDER BY watered_date DESC LIMIT 1',
        [userPlantId]
      );

      if (recentWateringResult.rows.length > 0) {
        const lastWatered = recentWateringResult.rows[0].watered_date;
        
        // Get the plant's watering frequency
        const plantResult = await client.query(
          'SELECT watering_frequency FROM user_plants WHERE id = $1',
          [userPlantId]
        );

        if (plantResult.rows.length > 0) {
          const { watering_frequency } = plantResult.rows[0];
          
          // Calculate new next water date based on most recent watering
          const nextWaterDate = format(addDays(new Date(lastWatered), watering_frequency), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');

          // Update the plant's last watered and next water dates
          await client.query(
            'UPDATE user_plants SET last_watered = $1, next_water_date = $2 WHERE id = $3',
            [lastWatered, nextWaterDate, userPlantId]
          );
        }
      }
      
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
        throw new Error('Watering record not found');
      }

      const userPlantId = wateringRecord.rows[0].user_plant_id;

      // Delete the watering record
      const deleteResult = await client.query(
        'DELETE FROM watering_history WHERE id = $1',
        [id]
      );

      if (deleteResult.rowCount === 0) {
        throw new Error('Failed to delete watering record');
      }

      // Check if this was the last watering record
      const remainingRecords = await client.query(
        'SELECT * FROM watering_history WHERE user_plant_id = $1 ORDER BY watered_date DESC LIMIT 1',
        [userPlantId]
      );

      if (remainingRecords.rows.length === 0) {
        // If this was the last watering record, mark the plant as needing initial watering
        // and set nextWaterDate to a past date to indicate it needs water
        const today = new Date();
        const pastDate = format(subDays(today, 30), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
        
        await client.query(
          'UPDATE user_plants SET last_watered = $1, next_water_date = $1, needs_initial_watering = true WHERE id = $2',
          [pastDate, userPlantId]
        );
      } else {
        // Update the plant with the most recent watering record
        const lastWatered = remainingRecords.rows[0].watered_date;
        const wateringFrequency = (await client.query(
          'SELECT watering_frequency FROM user_plants WHERE id = $1',
          [userPlantId]
        )).rows[0].watering_frequency;

        const nextWaterDate = format(addDays(new Date(lastWatered), wateringFrequency), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');

        await client.query(
          'UPDATE user_plants SET last_watered = $1, next_water_date = $2, needs_initial_watering = false WHERE id = $3',
          [lastWatered, nextWaterDate, userPlantId]
        );
      }

      return true;
    } catch (error) {
      console.error('Error deleting watering record:', error);
      throw error;
    }
  }
}

// Export an instance of the storage
export const storage = new DatabaseStorage();
