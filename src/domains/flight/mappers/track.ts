/**
 * Track mapper for Flight domain
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

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || `order-flight-${Date.now()}`,
    "beckn:orderStatus": "IN_PROGRESS", // Always system-generated
    "beckn:orderItems": onConfirmResponse?.["beckn:orderItems"]?.map((item: any) => ({
      "beckn:lineId": item["beckn:lineId"],
      "beckn:orderedItem": item["beckn:orderedItem"]
    })) || [],
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-flight-${Date.now()}`,
      "beckn:mode": "FLIGHT",
      "beckn:status": "IN_TRANSIT", // Always system-generated
      "beckn:trackingAction": {
        "@type": "schema:TrackAction",
        "schema:target": {
          "@type": "schema:EntryPoint",
          "schema:url": `https://delta.com/track/${onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21"}`
        }
      },
      "deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightService/v1/context.jsonld",
        "@type": "beckn:FlightService",
        "flight:flightStatus": "IN_FLIGHT", // Always system-generated
        "flight:currentLocation": {
          "latitude": 40.7128,
          "longitude": -74.0060,
          "altitude": 35000,
          "altitudeUnit": "FT"
        }, // Always system-generated
        "flight:estimatedArrivalTime": onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"]?.["flight:arrivalTime"] || new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        "flight:departureAirport": onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"]?.["flight:departureAirport"] || {},
        "flight:arrivalAirport": onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"]?.["flight:arrivalAirport"] || {}
      }
    }
  };
};

