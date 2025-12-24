/**
 * Support mapper for Hotel domain
 * Generates on_support response based on incoming support request
 * 
 * @param incomingMessage - Support request from BAP
 * @param incomingContext - Request context
 * @param storedContext - Previous context (optional)
 */
export const onSupportMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  return {
    "support": {
      "phone": "+66 2 123 4567", // Always system-generated
      "email": "support@grandsiamhotel.com", // Always system-generated
      "url": "https://grandsiamhotel.com/support" // Always system-generated
    }
  };
};

