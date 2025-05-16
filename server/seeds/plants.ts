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
    imageUrl: "https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    wateringFrequency: 14, // Water every 2 weeks
    lightRequirements: "Low to bright indirect light",
    difficulty: "Easy",
    category: "Low Maintenance",
  },
  {
    name: "Monstera Deliciosa",
    botanicalName: "Monstera deliciosa",
    description: "Known for its dramatic leaves with natural holes, this tropical plant is a popular choice for making a statement.",
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1000&auto=format&fit=crop",
    wateringFrequency: 7, // Water weekly
    lightRequirements: "Bright indirect light",
    difficulty: "Moderate",
    category: "Tropical",
  },
  {
    name: "Pothos",
    botanicalName: "Epipremnum aureum",
    description: "A trailing vine with heart-shaped leaves, known for being nearly indestructible.",
    imageUrl: "https://images.unsplash.com/photo-1607931042288-0c82960d4afc?q=80&w=1000&auto=format&fit=crop",
    wateringFrequency: 7, // Water weekly
    lightRequirements: "Low to bright indirect light",
    difficulty: "Easy",
    category: "Vines",
  },
  {
    name: "Peace Lily",
    botanicalName: "Spathiphyllum",
    description: "Elegant white flowers and glossy leaves. Great air purifier and humidity lover.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1676117273363-2b13dbbc5385?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVhY2UlMjBsaWx5fGVufDB8fDB8fHww&auto=format&fit=crop",
    wateringFrequency: 7, // Water weekly
    lightRequirements: "Low to medium indirect light",
    difficulty: "Easy",
    category: "Flowering",
  },
  {
    name: "ZZ Plant",
    botanicalName: "Zamioculcas zamiifolia",
    description: "Virtually indestructible plant with glossy leaves. Perfect for offices and low-light conditions.",
    imageUrl: "https://images.unsplash.com/photo-1622673037877-18ee56d1f990?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8enolMjBwbGFudHxlbnwwfHwwfHx8MA%3D%3D",
    wateringFrequency: 14, // Water every 2 weeks
    lightRequirements: "Low to bright indirect light",
    difficulty: "Easy",
    category: "Low Maintenance",
  },
  {
    name: "Spider Plant",
    botanicalName: "Chlorophytum comosum",
    description: "Fast-growing plant that produces babies (plantlets) on long stems. Great air purifier.",
    imageUrl: "https://images.unsplash.com/photo-1608161779298-f42256d2c58d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3BpZGVyJTIwcGxhbnR8ZW58MHx8MHx8fDA%3D",
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
