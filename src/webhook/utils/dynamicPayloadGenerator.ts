import { logger } from "../../utils/logger";
import { findDomainConfig, isDomainRegistered } from "../../domains";

interface PayloadGeneratorOptions {
  domain: string;
  action: string;
  incomingContext: any;
  incomingMessage: any;
  storedContext?: any;
}

/**
 * Generate dynamic payload based on action and domain
 * Uses configuration-driven approach to support unlimited domains
 *
 * Retrieves stored context from Redis if available for stateful responses
 */
export const generateDynamicPayload = async (
  options: PayloadGeneratorOptions
): Promise<any> => {
  const { domain, action, incomingContext, incomingMessage } = options;

  try {
    logger.debug("Generating dynamic payload", {
      domain,
      action,
      transaction_id: incomingContext?.transaction_id,
    });

    // Check if domain is registered
    if (!isDomainRegistered(domain)) {
      logger.warn("Domain not registered in configuration", {
        domain,
        registeredDomains: "Check domainMappers.ts",
      });
      return createFallbackPayload(action, incomingContext);
    }

    // Retrieve domain configuration
    const domainConfig = findDomainConfig(domain);
    if (!domainConfig) {
      logger.error("Failed to find domain configuration", { domain });
      return createFallbackPayload(action, incomingContext);
    }

    // Use stored context passed from controller
    // Controller fetches the appropriate previous action's context using getContextByAction()
    const storedContext = options.storedContext;

    // Get the mapper function for this action
    const mapperFunction = domainConfig.mappers[action];
    if (!mapperFunction) {
      logger.warn("No mapper found for action in domain configuration", {
        action,
        domain,
        availableActions: Object.keys(domainConfig.mappers),
      });
      return createFallbackPayload(action, incomingContext);
    }

    // Generate the message payload using the domain-specific mapper
    const messagePayload = mapperFunction(
      incomingMessage,
      incomingContext,
      storedContext
    );

    // Determine message structure based on domain config
    const messageStructure = getMessageStructure(
      action,
      messagePayload,
      domainConfig.messageStructure
    );

    // Construct the final dynamic payload
    const dynamicPayload = {
      context: {
        version: incomingContext?.version || "2.0.0",
        action: action,
        domain: domain,
        timestamp: new Date().toISOString(),
        message_id: incomingContext?.message_id,
        transaction_id: incomingContext?.transaction_id,
        bap_id: incomingContext?.bap_id,
        bap_uri: incomingContext?.bap_uri,
        bpp_id: incomingContext?.bpp_id,
        bpp_uri: incomingContext?.bpp_uri,
        ttl: incomingContext?.ttl || "PT30S",
      },
      message: messageStructure,
    };

    logger.info("Dynamic payload generated successfully", {
      domain,
      action,
      transaction_id: incomingContext?.transaction_id,
    });

    return dynamicPayload;
  } catch (error: any) {
    logger.error("Failed to generate dynamic payload", {
      domain,
      action,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Determine the correct message structure based on action type
 * Different actions have different message structures
 */
const getMessageStructure = (
  action: string,
  messagePayload: any,
  domainMessageStructure: string
): any => {
  // Special actions that don't wrap in order
  if (action === "on_track") {
    return messagePayload; // Returns tracking directly
  }

  if (action === "on_rating") {
    return messagePayload; // Returns feedback directly
  }

  if (action === "on_support") {
    return messagePayload; // Returns support directly
  }

  // Default: wrap order-based actions in { order: ... }
  if (domainMessageStructure === "order") {
    return { order: messagePayload };
  }

  // For custom message structures, return as-is
  return messagePayload;
};

/**
 * Create a fallback payload when domain/action is not found
 * This ensures the system doesn't crash with unknown domains
 */
const createFallbackPayload = (action: string, incomingContext: any): any => {
  logger.warn("Using fallback payload generation", {
    action,
    transaction_id: incomingContext?.transaction_id,
  });

  return {
    context: {
      version: incomingContext?.version || "2.0.0",
      action: action,
      timestamp: new Date().toISOString(),
      message_id: `msg-${action}-${Date.now()}`,
      transaction_id: incomingContext?.transaction_id,
      bap_id: incomingContext?.bap_id,
      bap_uri: incomingContext?.bap_uri,
      bpp_id: incomingContext?.bpp_id,
      bpp_uri: incomingContext?.bpp_uri,
      ttl: incomingContext?.ttl || "PT30S",
    },
    message: { order: {} }, // Empty order object as fallback
  };
};

// All exports are named exports above

