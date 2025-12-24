import express, { Router, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger, loggerStream } from "./utils/logger";
import { webhookRoutes } from "./webhook/routes";
import { bapWebhookRoutes } from "./bap-webhook/routes";
import { initializeDomains } from "./domains";

// Extend Express Request type to include logger
declare global {
  namespace Express {
    interface Request {
      log?: typeof logger;
    }
  }
}

export function createApp() {
  // Initialize all domains
  initializeDomains();

  const app = express();
  app.use(cors());
  app.use(helmet());
  app.use(express.json({ limit: "5mb" }));

  // Add logger to request object
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.log = logger;
    next();
  });

  // HTTP request logging middleware
  app.use(
    morgan("combined", {
      stream: loggerStream,
      skip: (req, res) => res.statusCode < 400, // Skip logging successful requests in combined format
    })
  );
  app.use(
    morgan("dev", {
      stream: {
        write: (message: string) => logger.debug(message.trim()),
      },
    })
  );

  // Create main API router
  const apiRouter = Router();

  // Mount all routes under the main API router
  // Use flow-based routes for modular domain handling
  apiRouter.use("/webhook", webhookRoutes());
  apiRouter.use("/bap-webhook", bapWebhookRoutes());
  // Mount the main API router with /api prefix
  apiRouter.use("/health", (req: Request, res: Response) => {
    req.log?.info("Health check endpoint accessed");
    return res.status(200).json({ message: "OK!" });
  });
  app.use("/api", apiRouter);

  // Global error fallback
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    req.log?.error("Unhandled error occurred", {
      error: err.message,
      stack: err.stack,
      status: err.status || 500,
      path: req.path,
      method: req.method,
    });
    res.status(err.status || 500).json({ error: "internal_error" });
  });

  logger.info("Express app configured successfully");

  return app;
}
