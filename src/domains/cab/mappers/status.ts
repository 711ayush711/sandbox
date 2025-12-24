/**
 * Status mapper for Cab domain
 * Generates on_status response based on incoming status request and previous on_confirm context
 * 
 * @param incomingMessage - Status request from BAP
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onStatusMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const statusRequest = incomingMessage?.order;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;

  // Determine ride status based on time or default to IN_PROGRESS
  const rideStatus = onConfirmResponse?.["beckn:orderAttributes"]?.["rideStatus"] || "IN_PROGRESS";
  const fulfillmentStatus = onConfirmResponse?.["beckn:fulfillment"]?.["beckn:status"] || "CONFIRMED";
  const rideState = onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:state"] || "IN_PROGRESS";

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || statusRequest?.["beckn:id"] || `order-cab-${Date.now()}`,
    "beckn:orderStatus": rideStatus === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-bangkok-cab-service",
      "beckn:descriptor": {
        "@type": "beckn:Descriptor",
        "schema:name": "Bangkok Cab Service",
        "beckn:shortDesc": "Reliable cab service in Bangkok",
        "schema:telephone": "+66 2 555 1234",
        "schema:email": "support@bangkokcabs.com"
      }
    },
    "beckn:buyer": onConfirmResponse?.["beckn:buyer"],
    "beckn:orderItems": onConfirmResponse?.["beckn:orderItems"] || [],
    "beckn:orderValue": onConfirmResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 18.50,
      "beckn:components": []
    },
    "beckn:payment": onConfirmResponse?.["beckn:payment"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "POST_FULFILLMENT",
      "beckn:status": "NOT_PAID",
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 18.50
      },
      "beckn:params": {
        "currency": "USD",
        "amount": "18.50"
      }
    },
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-ride-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:status": fulfillmentStatus,
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
        "@type": "beckn:RideDelivery",
        "ride:type": "ride",
        "ride:state": rideState,
        "ride:waitTime": rideState === "COMPLETED" ? "PT0M" : onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:waitTime"] || "PT0M",
        "ride:authorization": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:authorization"] || {},
        "ride:agent": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:agent"] || {},
        "ride:vehicle": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:vehicle"] || {},
        "ride:start": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"] || {},
        "ride:end": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"] || {}
      }
    },
    "beckn:orderAttributes": {
      ...(onConfirmResponse?.["beckn:orderAttributes"] || {}),
      "rideStatus": rideStatus,
      "currentLocation": rideStatus === "IN_PROGRESS" ? {
        "type": "Point",
        "coordinates": [100.6500, 13.7200]
      } : undefined,
      "distanceTraveled": rideStatus === "IN_PROGRESS" ? 12.5 : undefined,
      "estimatedTimeToDestination": rideStatus === "IN_PROGRESS" ? "PT25M" : undefined,
      "actualDistance": rideStatus === "COMPLETED" ? 25.3 : undefined,
      "actualDuration": rideStatus === "COMPLETED" ? "PT38M" : undefined,
      "invoice": rideStatus === "COMPLETED" ? {
        "invoiceNumber": `INV-BKK-${Date.now()}`,
        "invoiceDate": new Date().toISOString(),
        "totalAmount": onConfirmResponse?.["beckn:orderValue"]?.["schema:price"] || 18.50,
        "currency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD"
      } : undefined
    }
  };
};

