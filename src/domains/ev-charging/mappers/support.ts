/**
 * Support mapper for EV charging domain
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
  const supportRequest = incomingMessage;

  return {
    support: {
      name: "BlueCharge Support Team",
      phone: "18001080",
      email: "support@bluechargenet-aggregator.io",
      url: `https://support.bluechargenet-aggregator.io/ticket/SUP-${Date.now()}`,
      hours: "Mon–Sun 24/7 IST",
      channels: [
        "PHONE",
        "EMAIL",
        "WEB",
        "CHAT"
      ]
    }
  };
};

