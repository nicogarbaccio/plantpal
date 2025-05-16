import 'dotenv/config';
import express from "express";
import { registerRoutes } from "./routes.js";
import { client } from "./database.js";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to the database
try {
  await client.connect();
  console.log("Connected to the database");
} catch (error) {
  console.error("Failed to connect to the database:", error);
  process.exit(1);
}

// Register API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist/public")));
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
