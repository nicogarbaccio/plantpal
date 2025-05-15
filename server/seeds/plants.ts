import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { plants } from "../../shared/schema.js";
import * as dotenv from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const popularPlants = [
  {
    name: "Snake Plant",
    botanicalName: "Sansevieria trifasciata",
    description: "One of the most tolerant houseplants. Excellent air purifier and perfect for beginners.",
    imageUrl: "https://example.com/snake-plant.jpg",
    wateringFrequency: 14, // Water every 2 weeks
    lightRequirements: "Low to bright indirect light",
    difficulty: "Easy",
    category: "Low Maintenance",
  },
  {
    name: "Monstera Deliciosa",
    botanicalName: "Monstera deliciosa",
    description: "Known for its dramatic leaves with natural holes, this tropical plant is a popular choice for making a statement.",
    imageUrl: "https://example.com/monstera.jpg",
    wateringFrequency: 7, // Water weekly
    lightRequirements: "Bright indirect light",
    difficulty: "Moderate",
    category: "Tropical",
  },
  {
    name: "Pothos",
    botanicalName: "Epipremnum aureum",
    description: "A trailing vine with heart-shaped leaves, known for being nearly indestructible.",
    imageUrl: "https://example.com/pothos.jpg",
    wateringFrequency: 7, // Water weekly
    lightRequirements: "Low to bright indirect light",
    difficulty: "Easy",
    category: "Vines",
  },
  {
    name: "Peace Lily",
    botanicalName: "Spathiphyllum",
    description: "Elegant white flowers and glossy leaves. Great air purifier and humidity lover.",
    imageUrl: "https://example.com/peace-lily.jpg",
    wateringFrequency: 7, // Water weekly
    lightRequirements: "Low to medium indirect light",
    difficulty: "Easy",
    category: "Flowering",
  },
  {
    name: "ZZ Plant",
    botanicalName: "Zamioculcas zamiifolia",
    description: "Virtually indestructible plant with glossy leaves. Perfect for offices and low-light conditions.",
    imageUrl: "https://example.com/zz-plant.jpg",
    wateringFrequency: 14, // Water every 2 weeks
    lightRequirements: "Low to bright indirect light",
    difficulty: "Easy",
    category: "Low Maintenance",
  },
  {
    name: "Spider Plant",
    botanicalName: "Chlorophytum comosum",
    description: "Fast-growing plant that produces babies (plantlets) on long stems. Great air purifier.",
    imageUrl: "https://example.com/spider-plant.jpg",
    wateringFrequency: 7, // Water weekly
    lightRequirements: "Moderate to bright indirect light",
    difficulty: "Easy",
    category: "Air Purifying",
  },
];

async function seed() {
  try {
    await client.connect();
    const db = drizzle(client);
    
    // Delete existing plants using SQL
    await client.query('DELETE FROM plants');
    
    // Insert new plants using SQL
    for (const plant of popularPlants) {
      await client.query(
        `INSERT INTO plants (name, botanical_name, description, image_url, watering_frequency, light_requirements, difficulty, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          plant.name,
          plant.botanicalName,
          plant.description,
          plant.imageUrl,
          plant.wateringFrequency,
          plant.lightRequirements,
          plant.difficulty,
          plant.category
        ]
      );
    }
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.end();
  }
}

seed();
