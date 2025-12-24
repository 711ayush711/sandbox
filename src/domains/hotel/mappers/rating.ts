/**
 * Rating mapper for Hotel domain
 * Generates on_rating response based on incoming rating request
 * 
 * @param incomingMessage - Rating request from BAP
 * @param incomingContext - Request context
 * @param storedContext - Previous context (optional)
 */
export const onRatingMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  return {
    "received": true, // Always system-generated
    "aggregate": {
      "count": 2848, // Always system-generated
      "value": 4.5, // Always system-generated
      "best": 5, // Always system-generated
      "worst": 1 // Always system-generated
    },
    "feedbackForm": {
      "id": `detailed-hotel-feedback-${Date.now()}`, // Always system-generated
      "name": "Detailed Hotel Stay Feedback", // Always system-generated
      "url": `https://feedback.grandsiamhotel.com/detailed/booking-${Date.now()}`, // Always system-generated
      "mime_type": "text/html" // Always system-generated
    }
  };
};

