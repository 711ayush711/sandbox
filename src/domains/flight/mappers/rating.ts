/**
 * Rating mapper for Flight domain
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
  return {
    "received": true,
    "aggregate": {
      "count": 1247,
      "value": 4.73,
      "best": 5,
      "worst": 1
    },
    "feedbackForm": {
      "id": `detailed-flight-feedback-${Date.now()}`,
      "name": "Detailed Flight Experience Feedback",
      "url": `https://feedback.delta.com/detailed/flight-${Date.now()}`,
      "mime_type": "text/html"
    }
  };
};

