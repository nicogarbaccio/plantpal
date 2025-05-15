import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertPlantSchema, insertUserPlantSchema, insertWateringHistorySchema, type UserPlant } from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Get all plant categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });

  // Get all plants
  app.get('/api/plants', async (req, res) => {
    try {
      const plants = await storage.getAllPlants();
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
  app.get('/api/user-plants', async (req, res) => {
    try {
      // For simplicity, we're using user ID 1 (demo user)
      const userId = 1;
      const userPlants = await storage.getAllUserPlants(userId);
      
      // Enhance user plants with their catalog plant information
      const enhancedUserPlants = await Promise.all(
        userPlants.map(async (userPlant: UserPlant) => {
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
  app.get('/api/user-plants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      // Add the catalog plant information
      const plant = await storage.getPlant(userPlant.plantId);
      
      res.json({ ...userPlant, plant });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user plant' });
    }
  });

  // Add plant to user's collection
  app.post('/api/user-plants', async (req, res) => {
    try {
      // For simplicity, we're using user ID 1 (demo user)
      const userId = 1;
      
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
  app.patch('/api/user-plants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
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
      
      const currentUserPlant = await storage.getUserPlant(id);
      if (!currentUserPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      const updatedUserPlant = await storage.updateUserPlant({
        ...currentUserPlant,
        ...updateData
      });
      
      // Add the catalog plant information to the response
      const plant = await storage.getPlant(updatedUserPlant.plantId);
      
      res.json({ ...updatedUserPlant, plant });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user plant' });
    }
  });

  // Delete user plant
  app.delete('/api/user-plants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
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
  app.get('/api/user-plants/:id/watering-history', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
      }
      
      const wateringHistory = await storage.getWateringHistory(id);
      res.json(wateringHistory);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching watering history' });
    }
  });

  // Water a plant
  app.post('/api/user-plants/:id/water', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const userPlant = await storage.getUserPlant(id);
      if (!userPlant) {
        return res.status(404).json({ message: 'User plant not found' });
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
  app.get('/api/plants-status/needs-water', async (req, res) => {
    try {
      // For simplicity, we're using user ID 1 (demo user)
      const userId = 1;
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
  app.get('/api/plants-status/healthy', async (req, res) => {
    try {
      // For simplicity, we're using user ID 1 (demo user)
      const userId = 1;
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
  app.get('/api/plants-status/upcoming', async (req, res) => {
    try {
      // For simplicity, we're using user ID 1 (demo user)
      const userId = 1;
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

  const httpServer = createServer(app);
  return httpServer;
}
