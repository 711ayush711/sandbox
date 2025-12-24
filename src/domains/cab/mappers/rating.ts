/**
 * Rating mapper for Cab domain
 * Generates on_rating response based on incoming rating request
 * 
 * @param incomingMessage - Rating request from BAP (contains feedback/rating)
 * @param incomingContext - Request context
 * @param storedContext - Previous context (optional, not always needed for rating)
 */
export const onRatingMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const ratingRequest = incomingMessage;
  const orderId = ratingRequest?.id || `order-cab-${Date.now()}`;

  return {
    "received": true,
    "aggregate": {
      "ratingValue": 4.8,
      "ratingCount": 1248
    },
    "feedbackForm": {
      "url": `https://bangkokcabs.com/feedback/${orderId}`,
      "mimeType": "text/html"
    }
  };
};

