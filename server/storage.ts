import {
  users, User, InsertUser,
  plants, Plant, InsertPlant,
  userPlants, UserPlant, InsertUserPlant,
  wateringHistory, WateringHistory, InsertWateringHistory,
  categories, Category, InsertCategory
} from "@shared/schema";
import { addDays, format } from "date-fns";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(userData: InsertUser & { id: string }): Promise<User>;
  
  // Plant catalog methods
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  getPlantsByCategory(category: string): Promise<Plant[]>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  
  // User's plant collection methods
  getUserPlants(userId: string): Promise<UserPlant[]>;
  getUserPlant(id: number): Promise<UserPlant | undefined>;
  createUserPlant(userPlant: InsertUserPlant): Promise<UserPlant>;
  updateUserPlant(id: number, userPlant: Partial<InsertUserPlant>): Promise<UserPlant | undefined>;
  deleteUserPlant(id: number): Promise<boolean>;
  
  // Watering history methods
  getWateringHistory(userPlantId: number): Promise<WateringHistory[]>;
  createWateringRecord(watering: InsertWateringHistory): Promise<WateringHistory>;
  waterPlant(userPlantId: number, notes?: string): Promise<WateringHistory>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Utility methods
  getPlantsNeedingWater(userId: string): Promise<UserPlant[]>;
  getHealthyPlants(userId: string): Promise<UserPlant[]>;
  getUpcomingWateringPlants(userId: string): Promise<UserPlant[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private plants: Map<number, Plant>;
  private userPlants: Map<number, UserPlant>;
  private wateringHistory: Map<number, WateringHistory>;
  private categories: Map<number, Category>;
  
  private plantId: number;
  private userPlantId: number;
  private wateringId: number;
  private categoryId: number;

  constructor() {
    this.users = new Map();
    this.plants = new Map();
    this.userPlants = new Map();
    this.wateringHistory = new Map();
    this.categories = new Map();
    
    this.plantId = 1;
    this.userPlantId = 1;
    this.wateringId = 1;
    this.categoryId = 1;
    
    // Initialize with default data
    this.seedData();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!insertUser.id) {
      throw new Error('User ID is required');
    }
    
    const user: User = { 
      ...insertUser,
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }
  
  async upsertUser(userData: InsertUser & { id: string }): Promise<User> {
    // If user already exists, update it
    if (this.users.has(userData.id)) {
      const existingUser = this.users.get(userData.id)!;
      const updatedUser = { 
        ...existingUser, 
        ...userData,
        updatedAt: new Date()
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    }
    
    // Otherwise create a new user
    return this.createUser(userData);
  }
  
  // Plant catalog methods
  async getPlants(): Promise<Plant[]> {
    return Array.from(this.plants.values());
  }
  
  async getPlant(id: number): Promise<Plant | undefined> {
    return this.plants.get(id);
  }
  
  async getPlantsByCategory(category: string): Promise<Plant[]> {
    return Array.from(this.plants.values()).filter(
      (plant) => plant.category === category
    );
  }
  
  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = this.plantId++;
    const plant: Plant = { ...insertPlant, id };
    this.plants.set(id, plant);
    
    // Update plant count in category
    const categories = await this.getCategories();
    const category = categories.find(c => c.name === plant.category);
    if (category) {
      const updatedCategory = { ...category, plantCount: category.plantCount + 1 };
      this.categories.set(category.id, updatedCategory);
    }
    
    return plant;
  }
  
  // User's plant collection methods
  async getUserPlants(userId: string): Promise<UserPlant[]> {
    return Array.from(this.userPlants.values()).filter(
      (userPlant) => userPlant.userId === userId
    );
  }
  
  async getUserPlant(id: number): Promise<UserPlant | undefined> {
    return this.userPlants.get(id);
  }
  
  async createUserPlant(insertUserPlant: InsertUserPlant): Promise<UserPlant> {
    const id = this.userPlantId++;
    
    // Calculate next water date
    const lastWatered = insertUserPlant.lastWatered 
      ? new Date(insertUserPlant.lastWatered) 
      : new Date();
    const nextWaterDate = addDays(lastWatered, insertUserPlant.wateringFrequency);
    
    const userPlant: UserPlant = {
      ...insertUserPlant,
      id,
      lastWatered: lastWatered,
      nextWaterDate: nextWaterDate,
      createdAt: new Date()
    };
    
    this.userPlants.set(id, userPlant);
    return userPlant;
  }
  
  async updateUserPlant(id: number, partialUserPlant: Partial<InsertUserPlant>): Promise<UserPlant | undefined> {
    const existingUserPlant = this.userPlants.get(id);
    if (!existingUserPlant) return undefined;
    
    // If watering frequency or last watered date changes, recalculate next water date
    let nextWaterDate = existingUserPlant.nextWaterDate;
    const wateringFrequency = partialUserPlant.wateringFrequency ?? existingUserPlant.wateringFrequency;
    
    if (partialUserPlant.lastWatered) {
      const lastWatered = new Date(partialUserPlant.lastWatered);
      nextWaterDate = addDays(lastWatered, wateringFrequency);
    } else if (partialUserPlant.wateringFrequency !== undefined && 
               existingUserPlant.lastWatered) {
      nextWaterDate = addDays(existingUserPlant.lastWatered, wateringFrequency);
    }
    
    const updatedUserPlant: UserPlant = {
      ...existingUserPlant,
      ...partialUserPlant,
      nextWaterDate,
    };
    
    this.userPlants.set(id, updatedUserPlant);
    return updatedUserPlant;
  }
  
  async deleteUserPlant(id: number): Promise<boolean> {
    return this.userPlants.delete(id);
  }
  
  // Watering history methods
  async getWateringHistory(userPlantId: number): Promise<WateringHistory[]> {
    return Array.from(this.wateringHistory.values())
      .filter(history => history.userPlantId === userPlantId)
      .sort((a, b) => {
        return new Date(b.wateredDate).getTime() - new Date(a.wateredDate).getTime();
      });
  }
  
  async createWateringRecord(insertWatering: InsertWateringHistory): Promise<WateringHistory> {
    const id = this.wateringId++;
    const watering: WateringHistory = { ...insertWatering, id };
    this.wateringHistory.set(id, watering);
    return watering;
  }
  
  async waterPlant(userPlantId: number, notes?: string): Promise<WateringHistory> {
    const userPlant = await this.getUserPlant(userPlantId);
    if (!userPlant) {
      throw new Error('User plant not found');
    }
    
    const today = new Date();
    
    // Update the user plant
    await this.updateUserPlant(userPlantId, {
      lastWatered: today,
      nextWaterDate: addDays(today, userPlant.wateringFrequency)
    });
    
    // Create watering record
    return this.createWateringRecord({
      userPlantId,
      wateredDate: today,
      notes: notes || '',
    });
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Utility methods
  async getPlantsNeedingWater(userId: string): Promise<UserPlant[]> {
    const userPlants = await this.getUserPlants(userId);
    const today = new Date();
    
    return userPlants.filter(userPlant => {
      if (!userPlant.nextWaterDate) return false;
      const nextWaterDate = new Date(userPlant.nextWaterDate);
      return nextWaterDate <= today;
    });
  }
  
  async getHealthyPlants(userId: string): Promise<UserPlant[]> {
    const userPlants = await this.getUserPlants(userId);
    const today = new Date();
    
    return userPlants.filter(userPlant => {
      if (!userPlant.nextWaterDate) return false;
      const nextWaterDate = new Date(userPlant.nextWaterDate);
      const daysDifference = Math.ceil((nextWaterDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      // Plants with at least 3 days until next watering are considered "healthy"
      return daysDifference >= 3;
    });
  }
  
  async getUpcomingWateringPlants(userId: string): Promise<UserPlant[]> {
    const userPlants = await this.getUserPlants(userId);
    const today = new Date();
    
    return userPlants.filter(userPlant => {
      if (!userPlant.nextWaterDate) return false;
      const nextWaterDate = new Date(userPlant.nextWaterDate);
      const daysDifference = Math.ceil((nextWaterDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      // Plants needing water in 1-2 days are considered "upcoming"
      return daysDifference > 0 && daysDifference <= 2;
    });
  }
  
  // Seed data for testing purposes
  private seedData() {
    // Add a default user
    this.upsertUser({
      id: '1', // Using string ID for Replit Auth compatibility
      username: 'demo',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      profileImageUrl: null
    });
    
    // Add categories
    const categories = [
      {
        name: 'Low Light',
        description: 'Plants that thrive in low light conditions',
        imageUrl: 'https://pixabay.com/get/g6089c6ecf30b2a3b018dbaa954b3fdf88a5404be53bd3a803c43826901f5da7c7c5d3184557be7e38f8004cf566090e273c3e533c4e44a627abfaecfdd68159b_1280.jpg',
        plantCount: 0
      },
      {
        name: 'Sun Lovers',
        description: 'Plants that need bright, direct sunlight',
        imageUrl: 'https://pixabay.com/get/g67ff22ceb6c1347b9071f509bba51daa1da7cdc49f400d9de977fdbb3b11d98f0d5b92d30c9686134b7ea40d4a23038324f8752a8aa9e62629da40bcf485af74_1280.jpg',
        plantCount: 0
      },
      {
        name: 'Air Purifiers',
        description: 'Plants known for their air purifying qualities',
        imageUrl: 'https://pixabay.com/get/gc31e3fc6be72abe08447b829530fd71f7bf1f877bf2376374de2090da23edff196eddb29193f4ec9ccbde855dcab3c36006841b5564388719e59799316ae14c7_1280.jpg',
        plantCount: 0
      },
      {
        name: 'Pet Friendly',
        description: 'Non-toxic plants safe for homes with pets',
        imageUrl: 'https://pixabay.com/get/gd352f7af9c8a1212cb8a70eece7e009af8ba654e4ec5ca063d4d425b1561221a0828927756ecd9757af243359f42330d5ba917cda03b0db5b8bfb79ac2569327_1280.jpg',
        plantCount: 0
      }
    ];
    
    categories.forEach(category => {
      this.createCategory(category);
    });
    
    // Add plants to catalog
    const plants = [
      {
        name: 'Monstera Deliciosa',
        botanicalName: 'Swiss Cheese Plant',
        description: 'Known for its distinctive split leaves, the Monstera is a popular houseplant that adds a tropical feel to any space.',
        imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000&q=80',
        wateringFrequency: 7, // Weekly
        lightRequirements: 'Medium Light',
        difficulty: 'Easy',
        category: 'Air Purifiers'
      },
      {
        name: 'Epipremnum Aureum',
        botanicalName: 'Golden Pothos',
        description: 'A trailing vine plant with heart-shaped leaves. One of the easiest houseplants to grow.',
        imageUrl: 'https://pixabay.com/get/g3f8e183f70e60ada7a2c0cde1cf390fac3bc7ce021588af8709e4506ccc370cc4324c88d65bf9eb9ba54ffa8526f5db2f55d70810644c631ff7f5f84711cff22_1280.jpg',
        wateringFrequency: 14, // Bi-weekly
        lightRequirements: 'Low to Medium',
        difficulty: 'Very Easy',
        category: 'Low Light'
      },
      {
        name: 'Spathiphyllum',
        botanicalName: 'Peace Lily',
        description: 'Elegant plant with glossy leaves and white flowers. Great air purifier and low-light tolerant.',
        imageUrl: 'https://pixabay.com/get/g46fbc0176334cb0b91a53fea5929d54b9df3ea78e9b92a6deebb2644335270ef279cd9a7b2aa71ab6342ecc9821a91feaa3a3ea65ec39a1235eaa7fbe4dc9de9_1280.jpg',
        wateringFrequency: 7, // Weekly
        lightRequirements: 'Low Light',
        difficulty: 'Medium',
        category: 'Low Light'
      },
      {
        name: 'Sansevieria Trifasciata',
        botanicalName: 'Snake Plant',
        description: 'Nearly indestructible plant with tall, stiff leaves. Perfect for beginners and busy people.',
        imageUrl: 'https://pixabay.com/get/g23b0ee73a41916bacdb308f8a35b0430a857fff865e85372eee188c16591d0c31155c55245516c21b1ec89f56e263b4c454b2005a8cf70288034ddc71b72f97d_1280.jpg',
        wateringFrequency: 30, // Monthly
        lightRequirements: 'Any Light',
        difficulty: 'Very Easy',
        category: 'Air Purifiers'
      },
      {
        name: 'Ficus Lyrata',
        botanicalName: 'Fiddle Leaf Fig',
        description: 'Popular indoor tree with large, violin-shaped leaves. Adds drama and height to any space.',
        imageUrl: 'https://images.unsplash.com/photo-1524492449090-a4e289316d9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000&q=80',
        wateringFrequency: 7, // Weekly
        lightRequirements: 'Bright Indirect',
        difficulty: 'Difficult',
        category: 'Sun Lovers'
      },
      {
        name: 'Zamioculcas Zamiifolia',
        botanicalName: 'ZZ Plant',
        description: 'Glossy, dark green leaves that can tolerate neglect and low light. Very drought tolerant.',
        imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000&q=80',
        wateringFrequency: 30, // Monthly
        lightRequirements: 'Low to Medium',
        difficulty: 'Very Easy',
        category: 'Low Light'
      },
      {
        name: 'Calathea Orbifolia',
        botanicalName: 'Prayer Plant',
        description: 'Known for its striking round leaves with silver stripes. Leaves fold up at night like hands in prayer.',
        imageUrl: 'https://pixabay.com/get/g5eedf1f0ac9bc130f118bb03f6558f3546f6a4d386c628a8359dfe10ebe4305ec8bc74c00f5f837b0c727bdeb2caa944007c5ea625f59ba980ce9714bec5b6e9_1280.jpg',
        wateringFrequency: 7, // Weekly
        lightRequirements: 'Indirect Light',
        difficulty: 'Medium',
        category: 'Pet Friendly'
      },
      {
        name: 'Ficus Elastica',
        botanicalName: 'Rubber Plant',
        description: 'Popular houseplant with glossy, burgundy-colored leaves. Easy to grow and dramatic looking.',
        imageUrl: 'https://pixabay.com/get/g724e01b48ac211206556ed15b8e31da4bab6b2df68c72295b90901e4e7962085e759b5e2ee52821db28b54a1b439cc78f89aff9f3cfd4f0cb451cdd06afcdfb5_1280.jpg',
        wateringFrequency: 14, // Bi-weekly
        lightRequirements: 'Medium Light',
        difficulty: 'Easy',
        category: 'Air Purifiers'
      }
    ];
    
    plants.forEach(plant => {
      this.createPlant(plant);
    });
    
    // Add some plants to the user's collection
    const userPlants = [
      {
        userId: '1', // Using string ID for Replit Auth compatibility
        plantId: 1, // Monstera
        nickname: 'Monstera',
        location: 'Living Room',
        lastWatered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        wateringFrequency: 7,
        notes: 'Gift from Mom',
        imageUrl: 'https://pixabay.com/get/g211f86cd284b492ad5a1badffb0094a0f8522ba75e85765a070ebe85818f5294b99adf98730357fcf1a80e93a232da0a24e95a423b194ef140a33de01ac77429_1280.jpg'
      },
      {
        userId: '1', // Using string ID for Replit Auth compatibility
        plantId: 2, // Pothos
        nickname: 'Golden Pothos',
        location: 'Bedroom',
        lastWatered: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        wateringFrequency: 14,
        notes: 'Propagated from office plant',
        imageUrl: 'https://pixabay.com/get/ga329a11e4489bd80e8b3d3970cc74f6e2cf0a1fc7bd3e0be51155fc76d49eb95ed707ee1f27d1d3fe66ea3d7e58b1f2b8db5682378b7f594d2651072ca117723_1280.jpg'
      },
      {
        userId: '1', // Using string ID for Replit Auth compatibility
        plantId: 4, // Snake Plant
        nickname: 'Snake Plant',
        location: 'Office',
        lastWatered: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
        wateringFrequency: 30,
        notes: 'Very low maintenance',
        imageUrl: 'https://pixabay.com/get/g2b1ed98472a8e174779f4292429adb54f12cde9df9f893219fcdcb5550cb7f746ed6a5c5dfc4de61f17117bed80802485ec22629c8f8bf6a13207e976f301c49_1280.jpg'
      },
      {
        userId: '1', // Using string ID for Replit Auth compatibility
        plantId: 5, // Fiddle Leaf Fig
        nickname: 'Fiddle Leaf Fig',
        location: 'Living Room',
        lastWatered: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        wateringFrequency: 7,
        notes: 'Needs bright light',
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80'
      },
      {
        userId: '1', // Using string ID for Replit Auth compatibility
        plantId: 6, // ZZ Plant
        nickname: 'ZZ Plant',
        location: 'Bedroom',
        lastWatered: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        wateringFrequency: 30,
        notes: 'Almost impossible to kill',
        imageUrl: 'https://images.unsplash.com/photo-1591454371758-644f9d123a81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80'
      },
      {
        userId: '1', // Using string ID for Replit Auth compatibility
        plantId: 7, // Calathea
        nickname: 'Calathea',
        location: 'Office',
        lastWatered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        wateringFrequency: 7,
        notes: 'Needs high humidity',
        imageUrl: 'https://pixabay.com/get/g9bbe1f2ab85f402c77ae17fe586429cc8e5ad30dc6c7d35d3441773b7819a7cfff491a686560b35a9a6f655d44636e7dfa114d3fe8f2f7e435512661773e2819_1280.jpg'
      }
    ];
    
    userPlants.forEach(userPlant => {
      this.createUserPlant(userPlant);
    });
    
    // Add watering history
    [1, 2, 3, 4, 5, 6].forEach(userPlantId => {
      const userPlant = this.userPlants.get(userPlantId);
      if (userPlant && userPlant.lastWatered) {
        this.createWateringRecord({
          userPlantId,
          wateredDate: userPlant.lastWatered,
          notes: 'Regular watering',
        });
      }
    });
  }
}

export const storage = new MemStorage();
