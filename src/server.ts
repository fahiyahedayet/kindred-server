
import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db.js";
import { createIndexes } from "./config/collections.js";
import { auth } from "./config/auth.js";
import eventRoutes from "./routes/event.routes.js";


const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const allowedOrigins = [
  "http://localhost:3000",
  
  "https://kindred-client-five.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Kindred API!",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Kindred server is running.",
  });
});

app.use("/api/events", eventRoutes);

const startServer = async () => {
  try {
    await connectDB();
    await createIndexes();

    app.listen(PORT, () => {
      console.log(`Kindred server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
