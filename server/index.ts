import express from "express";
import { registerRoutes } from "./routes.js";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist/public")));
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
