import { pgTable, text, serial, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
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
export const userPlants = pgTable('user_plants', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  plantId: integer('plant_id').notNull().references(() => plants.id),
  nickname: text('nickname'),
  location: text('location').notNull(),
  lastWatered: timestamp("last_watered", { withTimezone: true }).notNull(),
  wateringFrequency: integer('watering_frequency').notNull(),
  nextWaterDate: timestamp("next_water_date", { withTimezone: true }).notNull(),
  imageUrl: text('image_url'),
  notes: text('notes'),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  needsInitialWatering: boolean("needs_initial_watering").default(false).notNull()
});

// Custom schema for inserting user plants that accepts ISO date strings
export const insertUserPlantSchema = z.object({
  userId: z.number(),
  plantId: z.number(),
  nickname: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  lastWatered: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Invalid date format"),
  wateringFrequency: z.number().min(1, "Watering frequency is required"),
  nextWaterDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Invalid date format"),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertUserPlant = z.infer<typeof insertUserPlantSchema>;
export type UserPlant = typeof userPlants.$inferSelect & {
  id: number;
  userId: number;
  plantId: number;
  nickname: string | null;
  location: string;
  lastWatered: Date;
  wateringFrequency: number;
  nextWaterDate: Date;
  imageUrl: string | null;
  notes: string | null;
  createdAt: Date | null;
  needsInitialWatering: boolean;
};

// Watering history schema
export const wateringHistory = pgTable("watering_history", {
  id: serial("id").primaryKey(),
  userPlantId: integer("user_plant_id").notNull(),
  wateredDate: timestamp("watered_date", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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
