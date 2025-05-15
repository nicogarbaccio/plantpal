import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { categories } from "../../shared/schema.js";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Extract unique categories from plants data
const plantCategories = [
  {
    name: "Low Maintenance",
    description: "Perfect for busy plant parents or beginners. These plants are hardy and can tolerate irregular watering.",
    imageUrl: "https://images.unsplash.com/photo-1463320898484-cdee8141c787?q=80&w=1170&auto=format&fit=crop",
    plantCount: 2, // Snake Plant and ZZ Plant
  },
  {
    name: "Tropical",
    description: "Bring the jungle indoors with these lush, dramatic plants that thrive in warm, humid environments.",
    imageUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=1000&auto=format&fit=crop",
    plantCount: 1, // Monstera
  },
  {
    name: "Vines",
    description: "Trailing and climbing plants that add vertical interest and can dramatically transform any space.",
    imageUrl: "https://images.unsplash.com/photo-1446071103084-c257b5f70672?q=80&w=1000&auto=format&fit=crop",
    plantCount: 1, // Pothos
  },
  {
    name: "Flowering",
    description: "Add color and fragrance to your space with these beautiful blooming plants.",
    imageUrl: "https://images.unsplash.com/photo-1468327768560-75b778cbb551?q=80&w=1000&auto=format&fit=crop",
    plantCount: 1, // Peace Lily
  },
  {
    name: "Air Purifying",
    description: "NASA-studied plants that help clean indoor air by removing common household toxins.",
    imageUrl: "https://images.unsplash.com/photo-1524492449090-a4f84c3fde5c?q=80&w=1000&auto=format&fit=crop",
    plantCount: 1, // Spider Plant
  },
];

async function seed() {
  try {
    await client.connect();
    
    // Delete existing categories using SQL
    await client.query('DELETE FROM categories');
    
    // Insert new categories using SQL
    for (const category of plantCategories) {
      await client.query(
        `INSERT INTO categories (name, description, image_url, plant_count)
         VALUES ($1, $2, $3, $4)`,
        [
          category.name,
          category.description,
          category.imageUrl,
          category.plantCount
        ]
      );
    }
    
    console.log("Categories seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    await client.end();
  }
}

seed();
