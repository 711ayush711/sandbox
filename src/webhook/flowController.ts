import { Request, Response } from "express";
import axios from "axios";
import { logger } from "../utils/logger";
import { storeContext, getContextByAction } from "../utils/redisContextManager";
import { generateDynamicPayload } from "./utils/dynamicPayloadGenerator";
import { getPreviousActionForContext } from "../utils/actionDependencies";

/**
 * Unified webhook controller using dynamic payload generation
 * Handles all Beckn protocol actions dynamically based on domain configuration
 * 
 * Flow:
 * 1. discover request -> Forward to CDS -> CDS returns on_discover -> Store in Redis
 * 2. select request -> Get on_discover from Redis -> Generate on_select -> Store in Redis
 * 3. init request -> Get on_select from Redis -> Generate on_init -> Store in Redis
 */
export class FlowWebhookController {
  /**
   * Handle incoming action (select, init, confirm, status, etc.)
   */
  static async handleAction(req: Request, res: Response): Promise<void> {
    const { context, message }: { context: any; message: any } = req.body;

    if (!context) {
      logger.error("Missing context in request", { body: req.body });
      res.status(400).json({ error: "Missing context" });
      return;
    }

    const { action, domain: incomingDomain, transaction_id } = context;
    const targetDomain = incomingDomain || "beckn.one:energy:ev-charging";

    logger.info("Webhook action received", {
      action,
      domain: targetDomain,
      transaction_id,
      bpp_uri: context?.bpp_uri,
    });

    try {
      // Transform action to response action (e.g., "select" -> "on_select")
      const responseAction = this.getResponseAction(action);

      // Fetch required previous action context
      const requiredPreviousAction = getPreviousActionForContext(responseAction, targetDomain);
      const previousContext = requiredPreviousAction
        ? await getContextByAction(transaction_id, requiredPreviousAction)
        : null;

      // Generate dynamic payload based on domain and previous context
      const dynamicPayload = await generateDynamicPayload({
        domain: targetDomain,
        action: responseAction,
        incomingContext: context,
        incomingMessage: message,
        storedContext: previousContext,
      });

      // Store response in Redis for next action to reference
      if (transaction_id) {
        await storeContext(transaction_id, {
          domain: targetDomain,
          action: responseAction,
          previousResponse: dynamicPayload,
          currentRequest: { context, message },
          timestamp: new Date().toISOString(),
        });
      }

      logger.info("Action handled successfully", {
        action,
        responseAction,
        domain: targetDomain,
        transaction_id,
      });

      // Send dynamic payload in response for testing
      // dynamicPayload already contains { context, message } structure
      // res.status(200).json({
      //   context,
      //   message: {
      //     ack: {
      //       status: "ACK",
      //     },
      //   },
      // });
      res.status(200).json(dynamicPayload);
      // Forward to Onix adapter (fire and forget)
      // if (process.env.ONIX_ADAPTOR || process.env.BPP_ONIX_ADAPTOR) {
      //   this.forwardResponseToOnix(responseAction, dynamicPayload, context).catch((error) => {
      //     logger.error("Failed to forward response to Onix adapter", {
      //       action: responseAction,
      //       error: error.message,
      //       transaction_id: context?.transaction_id,
      //     });
      //   });
      // }
    } catch (error: any) {
      logger.error("Webhook handler error", {
        action,
        domain: targetDomain,
        transaction_id,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }

  /**
   * Handle discover request - Forward to CDS and store on_discover response
   */
  static async handleDiscover(req: Request, res: Response): Promise<void> {
    const discoverPayload = req.body;
    const { context } = discoverPayload;
    
    logger.info("Received discover request", {
      context: context?.transaction_id,
      action: "discover",
      domain: context?.domain,
    });

    try {
      // Step 1: Call CDS backend
      const cdsUrl = `${process.env.CDS_ENDOINT}/beckn/discover`;
      logger.info("Calling CDS discover endpoint", {
        url: cdsUrl,
        context: context?.transaction_id,
      });

      const discoverResponse = await axios.post(cdsUrl, discoverPayload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      logger.info("CDS discover call successful", {
        url: cdsUrl,
        status: discoverResponse.status,
        context: context?.transaction_id,
      });

      // Step 2: Store on_discover response in Redis
      // This will be used by select action later
      const onDiscoverResponse = discoverResponse.data;
      if (context?.transaction_id && onDiscoverResponse) {
        await storeContext(context.transaction_id, {
          domain: context?.domain || "beckn.one:energy:ev-charging",
          action: "on_discover",
          previousResponse: onDiscoverResponse,
          currentRequest: discoverPayload,
          timestamp: new Date().toISOString(),
        });

        logger.info("on_discover response stored in Redis", {
          context: context.transaction_id,
          messageId: onDiscoverResponse.context?.message_id,
        });
      }

      // Step 3: Send on_discover response for testing
      // Return the full on_discover payload from CDS
      // res.status(200).json({
      //   context,
      //   message: {
      //     ack: {
      //       status: "ACK",
      //     },
      //   },
      // });

      res.status(200).json(onDiscoverResponse);

      // Step 4: Forward to adapter (fire and forget)
      // if (process.env.ONIX_ADAPTOR) {
      //   const adapterUrl = `${process.env.ONIX_ADAPTOR}/bap/receiver/on_discover`;
      //   logger.info("Forwarding discover response to adapter", {
      //     url: adapterUrl,
      //     context: context?.transaction_id,
      //   });

      //   axios.post(adapterUrl, discoverResponse.data)
      //     .then(() => {
      //       logger.info("Discover response forwarded successfully", {
      //         url: adapterUrl,
      //         context: context?.transaction_id,
      //       });
      //     })
      //     .catch((adapterError: any) => {
      //       logger.error("Failed to forward discover response to adapter", {
      //         url: adapterUrl,
      //         context: context?.transaction_id,
      //         error: adapterError.message,
      //       });
      //     });
      // }
    } catch (error: any) {
      logger.error("Error in discover flow", {
        context: context?.transaction_id,
        error: error.message,
        stack: error.stack,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });

      if (!res.headersSent) {
        res.status(500).json({
          context,
          message: {
            ack: {
              status: "NACK",
            },
          },
        });
        return;
      }
    }
  }

  /**
   * Forward response to Onix adapter
   */
  private static async forwardResponseToOnix(
    responseAction: string,
    payload: any,
    context: any
  ): Promise<void> {
    const onixAdapterUrl = process.env.ONIX_ADAPTOR;
    if (!onixAdapterUrl) {
      logger.warn("Onix adapter URL not configured", {
        action: responseAction,
        transactionId: context?.transaction_id,
      });
      return;
    }

    const callbackUrl = `${onixAdapterUrl}/bpp/caller/${responseAction}`;

    logger.info("Forwarding response to Onix adapter", {
      action: responseAction,
      url: callbackUrl,
      transactionId: context?.transaction_id,
    });

    try {
      const response = await axios.post(callbackUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      logger.info("Response forwarded to Onix adapter successfully", {
        action: responseAction,
        url: callbackUrl,
        status: response.status,
        transactionId: context?.transaction_id,
      });
    } catch (error: any) {
      logger.error("Failed to forward response to Onix adapter", {
        action: responseAction,
        url: callbackUrl,
        transactionId: context?.transaction_id,
        error: error.message,
        status: error.response?.status,
        response: error.response?.data ? JSON.stringify(error.response.data, null, 2) : undefined,
      });
      // Don't throw - this is fire-and-forget
    }
  }

  /**
   * Transform action name to response action name (e.g., "select" -> "on_select")
   */
  private static getResponseAction(action: string): string {
    // If already has "on_" prefix, return as is
    if (action.startsWith("on_")) {
      return action;
    }
    // Transform to response action (e.g., "select" -> "on_select")
    return `on_${action}`;
  }
}
