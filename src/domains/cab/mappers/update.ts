/**
 * Update mapper for Cab domain
 * Generates on_update response based on incoming update request and previous on_confirm context
 * 
 * @param incomingMessage - Update request from BAP (contains order update details)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onUpdateMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const updateRequest = incomingMessage?.order;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;

  // Get updated end location from request
  const updatedEndLocation = updateRequest?.["beckn:fulfillment"]?.["beckn:end"]?.["beckn:location"] ||
                             updateRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"]?.["beckn:location"];

  // Recalculate orderValue if destination changed
  const basePrice = onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:price"]?.["schema:price"] || 18.00;
  const currency = onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD";
  
  // If destination changed, adjust price (example: +10% for longer distance)
  const updatedBasePrice = updatedEndLocation ? basePrice * 1.1 : basePrice;
  const serviceTaxPercentage = 2.78;
  const taxAmount = (updatedBasePrice * serviceTaxPercentage) / 100;
  const totalValue = updatedBasePrice + taxAmount;

  const components = [
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(updatedBasePrice.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": updatedEndLocation ? "Base fare (updated)" : "Base fare"
    },
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "TAX",
      "beckn:value": parseFloat(taxAmount.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Service tax (${serviceTaxPercentage}%)`
    }
  ];

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || updateRequest?.["beckn:id"] || `order-cab-${Date.now()}`,
    "beckn:orderStatus": "IN_PROGRESS",
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || updateRequest?.["beckn:seller"] || {
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
    "beckn:buyer": updateRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"],
    "beckn:orderItems": (updateRequest?.["beckn:orderItems"] || onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      ...item,
      "beckn:orderItemAttributes": {
        ...item?.["beckn:orderItemAttributes"],
        ...onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"],
        "ride:estimatedDistance": updatedEndLocation ? 28 : onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"]?.["ride:estimatedDistance"] || 25,
        "ride:estimatedDuration": updatedEndLocation ? "PT45M" : onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"]?.["ride:estimatedDuration"] || "PT40M"
      }
    })),
    "beckn:orderValue": updatedEndLocation ? {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": currency,
      "schema:price": parseFloat(totalValue.toFixed(2)),
      "beckn:components": components
    } : onConfirmResponse?.["beckn:orderValue"],
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "POST_FULFILLMENT",
      "beckn:status": "NOT_PAID",
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": currency,
        "schema:price": updatedEndLocation ? parseFloat(totalValue.toFixed(2)) : (onConfirmResponse?.["beckn:orderValue"]?.["schema:price"] || 18.50)
      },
      "beckn:params": {
        "currency": currency,
        "amount": updatedEndLocation ? totalValue.toFixed(2) : (onConfirmResponse?.["beckn:orderValue"]?.["schema:price"] || 18.50).toString()
      }
    },
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": updateRequest?.["beckn:fulfillment"]?.["beckn:id"] || onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-ride-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:status": "CONFIRMED",
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
        "@type": "beckn:RideDelivery",
        "ride:type": "ride",
        "ride:state": "IN_PROGRESS",
        "ride:waitTime": "PT0M",
        "ride:authorization": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:authorization"] || {},
        "ride:agent": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:agent"] || {},
        "ride:vehicle": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:vehicle"] || {},
        "ride:start": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"] || {},
        "ride:end": updatedEndLocation ? {
          "@type": "beckn:FulfillmentPoint",
          "beckn:location": updatedEndLocation,
          "beckn:time": {
            "@type": "beckn:TimePeriod",
            "schema:startDate": new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
          }
        } : onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"] || {}
      }
    },
    "beckn:orderAttributes": {
      ...(onConfirmResponse?.["beckn:orderAttributes"] || {}),
      "rideStatus": "IN_PROGRESS",
      "updateReason": updatedEndLocation ? "Destination changed by passenger" : undefined,
      "currentLocation": {
        "type": "Point",
        "coordinates": [100.6500, 13.7200]
      },
      "distanceTraveled": 12.5,
      "estimatedTimeToDestination": updatedEndLocation ? "PT30M" : "PT25M"
    }
  };
};

