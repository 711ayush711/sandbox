/**
 * Support mapper for Flight domain
 * Generates on_support response based on incoming support request
 * 
 * @param incomingMessage - Support request from BAP
 * @param incomingContext - Request context
 * @param storedContext - Previous context (optional, not always needed for support)
 */
export const onSupportMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  return {
    "support": {
      "name": "Delta Air Lines Customer Support",
      "phone": "+1-800-221-1212",
      "email": "support@delta.com",
      "url": "https://delta.com/contact",
      "hours": "24/7",
      "channels": ["phone", "email", "web", "chat"]
    }
  };
};

