import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlantSchema, insertUserPlantSchema, insertWateringHistorySchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./auth";
import { DatabaseStorage } from "./db-storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use the database storage implementation
  // @ts-ignore - we'll fix the TS issues in the next iteration
  global.storage = new DatabaseStorage();
  
  // Set up authentication
  setupAuth(app);
  
  // User routes for custom authentication
  app.get('/api/user', isAuthenticated, (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json({
        ...req.user,
        isAuthenticated: true
      });
    } else {
      res.status(401).json({ isAuthenticated: false });
    }
  });
  
  // put application routes here
  // prefix all routes with /api

  // Get all plant categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });

  // Get all plants
  app.get('/api/plants', async (req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching plants' });
    }
  });

  // Get plants by category
  app.get('/api/plants/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const plants = await storage.getPlantsByCategory(category);
      res.json(plants);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching plants by category' });
    }
  });

  // Get single plant
  app.get('/api/plants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const plant = await storage.getPlant(id);
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }
      
      res.json(plant);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching plant' });
    }
  });

  // Add new plant to catalog
  app.post('/api/plants', async (req, res) => {
    try {
      const plantData = insertPlantSchema.parse(req.body);
      const newPlant = await storage.createPlant(plantData);
      res.status(201).json(newPlant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid plant data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating plant' });
    }
  });

  // Get user's plant collection
  app.get('/api/user-plants', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const userPlants = await storage.getUserPlants(userId);
      
      // Enhance user plants with their catalog plant information
      const enhancedUserPlants = await Promise.all(
        userPlants.map(async (userPlant) => {
          const plant = await storage.getPlant(userPlant.plantId);
          return { ...userPlant, plant };
        })
      );
      
      res.json(enhancedUserPlants);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user plants' });
    }
  });

  // Get user plant by ID
  app.get('/api/user-plants/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      // Verify the user owns this plant
      const user = req.user as any;
      const userId = user.claims.sub;
      if (userPlant.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to view this plant' });
      }
      
      // Add the catalog plant information
      const plant = await storage.getPlant(userPlant.plantId);
      
      res.json({ ...userPlant, plant });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user plant' });
    }
  });

  // Add plant to user's collection
  app.post('/api/user-plants', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      
      const userPlantData = {
        ...insertUserPlantSchema.parse(req.body),
        userId
      };
      
      const newUserPlant = await storage.createUserPlant(userPlantData);
      
      // Add the catalog plant information to the response
      const plant = await storage.getPlant(newUserPlant.plantId);
      
      res.status(201).json({ ...newUserPlant, plant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user plant data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error adding plant to collection' });
    }
  });

  // Update user plant
  app.patch('/api/user-plants/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      // Verify the user owns this plant
      const user = req.user as any;
      const userId = user.claims.sub;
      if (userPlant.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to update this plant' });
      }
      
      // Only allow updating certain fields
      const allowedFields = [
        'nickname', 'location', 'wateringFrequency', 'notes', 'imageUrl'
      ];
      
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      }
      
      const updatedUserPlant = await storage.updateUserPlant(id, updateData);
      
      // Add the catalog plant information to the response
      const plant = await storage.getPlant(updatedUserPlant!.plantId);
      
      res.json({ ...updatedUserPlant, plant });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user plant' });
    }
  });

  // Delete user plant
  app.delete('/api/user-plants/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      // Verify the user owns this plant
      const user = req.user as any;
      const userId = user.claims.sub;
      if (userPlant.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this plant' });
      }
      
      const deleted = await storage.deleteUserPlant(id);
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: 'Error deleting user plant' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user plant' });
    }
  });

  // Get watering history for a user plant
  app.get('/api/user-plants/:id/watering-history', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      // Verify the user owns this plant
      const user = req.user as any;
      const userId = user.claims.sub;
      if (userPlant.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to view this plant' });
      }
      
      const wateringHistory = await storage.getWateringHistory(id);
      res.json(wateringHistory);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching watering history' });
    }
  });

  // Water a plant
  app.post('/api/user-plants/:id/water', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      // Verify the user owns this plant
      const user = req.user as any;
      const userId = user.claims.sub;
      if (userPlant.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to water this plant' });
      }
      
      const notes = req.body.notes || '';
      const wateringRecord = await storage.waterPlant(id, notes);
      
      // Get the updated user plant
      const updatedUserPlant = await storage.getUserPlant(id);
      const plant = await storage.getPlant(updatedUserPlant!.plantId);
      
      res.status(201).json({
        wateringRecord,
        userPlant: { ...updatedUserPlant, plant }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error watering plant' });
    }
  });

  // Get plants needing water
  app.get('/api/plants-status/needs-water', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const plants = await storage.getPlantsNeedingWater(userId);
      
      // Enhance user plants with their catalog plant information
      const enhancedUserPlants = await Promise.all(
        plants.map(async (userPlant) => {
          const plant = await storage.getPlant(userPlant.plantId);
          return { ...userPlant, plant };
        })
      );
      
      res.json(enhancedUserPlants);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching plants needing water' });
    }
  });

  // Get healthy plants
  app.get('/api/plants-status/healthy', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const plants = await storage.getHealthyPlants(userId);
      
      // Enhance user plants with their catalog plant information
      const enhancedUserPlants = await Promise.all(
        plants.map(async (userPlant) => {
          const plant = await storage.getPlant(userPlant.plantId);
          return { ...userPlant, plant };
        })
      );
      
      res.json(enhancedUserPlants);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching healthy plants' });
    }
  });

  // Get plants with upcoming watering
  app.get('/api/plants-status/upcoming', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const plants = await storage.getUpcomingWateringPlants(userId);
      
      // Enhance user plants with their catalog plant information
      const enhancedUserPlants = await Promise.all(
        plants.map(async (userPlant) => {
          const plant = await storage.getPlant(userPlant.plantId);
          return { ...userPlant, plant };
        })
      );
      
      res.json(enhancedUserPlants);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching plants with upcoming watering' });
    }
  });

  // Wishlist routes
  app.get('/api/wishlist', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      
      const wishlistItems = await storage.getWishlistWithPlants(userId);
      res.json(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      res.status(500).json({ message: 'Error fetching wishlist' });
    }
  });
  
  app.post('/api/wishlist/:plantId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const plantId = parseInt(req.params.plantId);
      
      if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID' });
      }
      
      // Check if plant exists
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }
      
      const wishlistItem = await storage.addToWishlist(userId, plantId);
      res.status(201).json(wishlistItem);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      res.status(500).json({ message: 'Error adding to wishlist' });
    }
  });
  
  app.delete('/api/wishlist/:plantId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const plantId = parseInt(req.params.plantId);
      
      if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID' });
      }
      
      const success = await storage.removeFromWishlist(userId, plantId);
      if (success) {
        res.status(200).json({ message: 'Plant removed from wishlist' });
      } else {
        res.status(404).json({ message: 'Plant not found in wishlist' });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      res.status(500).json({ message: 'Error removing from wishlist' });
    }
  });
  
  app.get('/api/wishlist/check/:plantId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const plantId = parseInt(req.params.plantId);
      
      if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID' });
      }
      
      const isInWishlist = await storage.isInWishlist(userId, plantId);
      res.json({ isInWishlist });
    } catch (error) {
      console.error('Error checking wishlist:', error);
      res.status(500).json({ message: 'Error checking wishlist' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
