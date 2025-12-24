import { createApp } from "./app";
import { initRedis, closeRedis } from "./utils/redisContextManager";
import dotenv from "dotenv";
import { logger } from "./utils/logger";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize Redis and start server
async function startServer() {
  try {
    // Initialize Redis connection for context management
    await initRedis();
    logger.info("Redis initialized");

    // Create and start Express app
    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || "development",
        redis_host: process.env.REDIS_HOST || "localhost",
        redis_port: process.env.REDIS_PORT || "6379",
      });
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully...");
      await closeRedis();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("SIGINT received, shutting down gracefully...");
      await closeRedis();
      process.exit(0);
    });
  } catch (error: any) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();
