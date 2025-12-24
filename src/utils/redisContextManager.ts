import { createClient } from "redis";
import { logger } from "./logger";

interface TransactionContext {
  domain: string;
  action: string;
  // Current action request (e.g., select, init, confirm)
  currentRequest?: {
    context: any;
    message: any;
  };
  // Previous on_ response (e.g., on_select, on_init response) - used by next action
  previousResponse?: {
    context: any;
    message: any;
  };
  timestamp: string;
  [key: string]: any;
}

let redisClient: any = null;
const DEFAULT_TTL_SECONDS = 15 * 24 * 60 * 60; // 15 days
const REDIS_KEY_PREFIX = "bpp_sandbox_"; // Prefix for all Redis keys

/**
 * Initialize Redis connection
 * Can be disabled via REDIS_ENABLED env variable
 */
export const initRedis = async (): Promise<void> => {
  const redisEnabled = process.env.REDIS_ENABLED !== "false"; // Default to enabled

  if (!redisEnabled) {
    logger.info("Redis is disabled via REDIS_ENABLED=false");
    return;
  }

  try {
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = parseInt(process.env.REDIS_PORT || "6379");

    const clientConfig: any = {
      socket: {
        host: redisHost,
        port: redisPort,
        connectTimeout: 5000, // 5 second timeout for initial connection
        timeout: 5000, // 5 second timeout for socket operations
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            return new Error('Max retries exceeded');
          }
          return Math.min(retries * 50, 500);
        },
      },
    };

    redisClient = createClient(clientConfig);

    redisClient.on("error", (err: any) => {
      logger.error("Redis client error", {
        error: err.message,
        stack: err.stack,
      });
    });

    await redisClient.connect();

    logger.info("Redis connection established", {
      host: redisHost,
      port: redisPort,
    });
  } catch (error: any) {
    logger.error("Failed to initialize Redis", {
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Store transaction context in Redis
 * Key: bpp_sandbox_${transaction_id}_${action} (action-specific storage)
 * TTL: Configurable via REDIS_TTL_SECONDS env (default: 15 days)
 */
export const storeContext = async (
  transactionId: string,
  context: TransactionContext
): Promise<void> => {
  if (!redisClient) {
    logger.debug("Redis is not initialized, skipping context storage", {
      transactionId,
    });
    return;
  }

  try {
    const ttl = parseInt(process.env.REDIS_TTL_SECONDS || String(DEFAULT_TTL_SECONDS));
    const value = JSON.stringify(context);

    // Store with action-specific key only (e.g., bpp_sandbox_txn123_on_select)
    const actionKey = `${REDIS_KEY_PREFIX}${transactionId}_${context.action}`;
    await redisClient.setEx(actionKey, ttl, value);

    logger.debug("Context stored in Redis", {
      transactionId,
      redisKey: actionKey,
      action: context.action,
      domain: context.domain,
      ttl_seconds: ttl,
    });
  } catch (error: any) {
    logger.error("Failed to store context in Redis", {
      transactionId,
      error: error.message,
    });
  }
};

/**
 * Retrieve context for a specific action from Redis
 * Returns null if not found
 */
export const getContextByAction = async (
  transactionId: string,
  action: string
): Promise<TransactionContext | null> => {
  if (!redisClient) {
    logger.debug("Redis is not initialized, returning null context", {
      transactionId,
      action,
    });
    return null;
  }

  try {
    const key = `${REDIS_KEY_PREFIX}${transactionId}_${action}`;
    const value = await redisClient.get(key);

    if (!value) {
      logger.debug("Context not found in Redis for action", {
        transactionId,
        action,
        redisKey: key,
      });
      return null;
    }

    const context = JSON.parse(value);

    logger.debug("Context retrieved from Redis for action", {
      transactionId,
      action,
      redisKey: key,
      storedAction: context.action,
      domain: context.domain,
    });

    return context;
  } catch (error: any) {
    logger.error("Failed to retrieve context from Redis for action", {
      transactionId,
      action,
      error: error.message,
    });
    return null;
  }
};

/**
 * Delete transaction context from Redis
 */
export const deleteContext = async (transactionId: string): Promise<void> => {
  if (!redisClient) {
    return;
  }

  try {
    const pattern = `${REDIS_KEY_PREFIX}${transactionId}_*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug("Context deleted from Redis", { transactionId, deletedKeys: keys.length });
    }
  } catch (error: any) {
    logger.error("Failed to delete context from Redis", {
      transactionId,
      error: error.message,
    });
  }
};

/**
 * Close Redis connection gracefully
 */
export const closeRedis = async (): Promise<void> => {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis connection closed");
  } catch (error: any) {
    logger.error("Failed to close Redis connection", {
      error: error.message,
    });
  }
};

// All exports are named exports above

