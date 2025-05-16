import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(client);
