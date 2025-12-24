/**
 * Track mapper for Cab domain
 * Generates on_track response based on incoming track request and previous on_confirm context
 * 
 * @param incomingMessage - Track request from BAP
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onTrackMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const trackRequest = incomingMessage;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;

  const orderId = onConfirmResponse?.["beckn:id"] || trackRequest?.order?.["beckn:id"] || `order-cab-${Date.now()}`;

  return {
    "tracking": {
      "url": `https://track.bangkokcabs.com/ride/${orderId}`,
      "status": "active",
      "tl_method": "http/get"
    }
  };
};

