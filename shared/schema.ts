import { pgTable, text, serial, integer, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Plant schema for catalog
export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  botanicalName: text("botanical_name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  wateringFrequency: integer("watering_frequency").notNull(), // Days between watering
  lightRequirements: text("light_requirements").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
});

export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
});

export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plants.$inferSelect;

// User's plant collection schema
export const userPlants = pgTable("user_plants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plantId: integer("plant_id").notNull(),
  nickname: text("nickname"),
  location: text("location"),
  lastWatered: date("last_watered"),
  wateringFrequency: integer("watering_frequency").notNull(), // Days between watering, can be customized by user
  nextWaterDate: date("next_water_date"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserPlantSchema = createInsertSchema(userPlants).omit({
  id: true,
  createdAt: true,
});

export type InsertUserPlant = z.infer<typeof insertUserPlantSchema>;
export type UserPlant = typeof userPlants.$inferSelect;

// Watering history schema
export const wateringHistory = pgTable("watering_history", {
  id: serial("id").primaryKey(),
  userPlantId: integer("user_plant_id").notNull(),
  wateredDate: date("watered_date").notNull(),
  notes: text("notes"),
});

export const insertWateringHistorySchema = createInsertSchema(wateringHistory).omit({
  id: true,
});

export type InsertWateringHistory = z.infer<typeof insertWateringHistorySchema>;
export type WateringHistory = typeof wateringHistory.$inferSelect;

// Plant categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  plantCount: integer("plant_count").default(0),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
