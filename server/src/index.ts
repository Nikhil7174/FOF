import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseUrl } from "./utils/database";
import authRoutes from "./routes/auth";
import participantRoutes from "./routes/participants";
import volunteerRoutes from "./routes/volunteers";
import sportRoutes from "./routes/sports";
import communityRoutes from "./routes/communities";
import userRoutes from "./routes/users";
import departmentRoutes from "./routes/departments";
import calendarRoutes from "./routes/calendar";
import settingsRoutes from "./routes/settings";
import emailRoutes from "./routes/email";
import communityContactRoutes from "./routes/community-contacts";
import convenorRoutes from "./routes/convenors";
import tournamentFormatRoutes from "./routes/tournament-formats";
import leaderboardRoutes from "./routes/leaderboard";
import { errorHandler } from "./middleware/errorHandler";
import { verifyEmailConfig } from "./utils/email";

dotenv.config();

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

try {
  const { hostname, port, protocol } = new URL(databaseUrl);
  console.log(`Database connection target: ${protocol}//${hostname}${port ? `:${port}` : ""}`);
} catch (error) {
  console.warn("Unable to determine database connection target:", error);
}

const app = express();
const PORT = process.env.PORT || 3000;
const defaultFrontendUrl = "https://fof-iota.vercel.app";
const FRONTEND_URL = process.env.FRONTEND_URL || defaultFrontendUrl;
const additionalOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const staticOrigins = [
  FRONTEND_URL,
  defaultFrontendUrl,
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "https://fof-iota.vercel.app",
  "https://fof-3m3x.onrender.com",
];

const allowedOrigins = Array.from(new Set([...staticOrigins, ...additionalOrigins]));

function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    if (url.hostname.endsWith(".vercel.app")) {
      return true;
    }
  } catch (error) {
    console.warn("Failed to parse origin for CORS check:", origin, error);
  }

  return false;
}

console.log("CORS allowed origins:", allowedOrigins);

// Initialize Prisma Client
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/sports", sportRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/community-contacts", communityContactRoutes);
app.use("/api/convenors", convenorRoutes);
app.use("/api/tournament-formats", tournamentFormatRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  
  // Verify email configuration
  await verifyEmailConfig();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    console.log("HTTP server closed");
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(async () => {
    console.log("HTTP server closed");
    await prisma.$disconnect();
    process.exit(0);
  });
});



