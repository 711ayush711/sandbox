/**
 * Support mapper for Cab domain
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
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:SupportInfo",
      "phone": "+66 2 555 1234",
      "email": "support@bangkokcabs.com",
      "url": "https://bangkokcabs.com/support"
    }
  };
};

