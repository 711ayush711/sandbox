import { Router } from "express";
import { FlowWebhookController } from "./flowController";

/**
 * Webhook routes using flow-based controller
 * All actions route to the unified handleAction method
 * Special handling for discover action
 */
export const webhookRoutes = () => {
  const router = Router();

  // Unified handler for all actions
  const handleAction = async (req: any, res: any) => {
    await FlowWebhookController.handleAction(req, res);
  };

  // Special handler for discover - forwards to CDS and stores on_discover
  router.post("/discover", async (req: any, res: any) => {
    await FlowWebhookController.handleDiscover(req, res);
  });

  // Standard workflow actions
  router.post("/select", handleAction);
  router.post("/init", handleAction);
  router.post("/confirm", handleAction);
  router.post("/status", handleAction);
  router.post("/cancel", handleAction);
  router.post("/update", handleAction);
  router.post("/rating", handleAction);
  router.post("/support", handleAction);
  router.post("/track", handleAction);

  return router;
};
