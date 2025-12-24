/**
 * Cancel mapper for Cab domain
 * Generates on_cancel response based on incoming cancel request and previous on_confirm context
 * 
 * @param incomingMessage - Cancel request from BAP (contains cancellation details)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_confirm response (confirmed order details)
 */
export const onCancelMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const cancelRequest = incomingMessage?.order;
  const onConfirmResponse = storedContext?.previousResponse?.message?.order;

  // Calculate cancellation fee based on cancellation policy
  const cancellationPolicy = onConfirmResponse?.["beckn:orderItems"]?.[0]?.["beckn:orderItemAttributes"]?.["ride:cancellationPolicy"] || {};
  const freeCancellationWindow = cancellationPolicy?.["freeCancellationWindow"] || "PT5M";
  const cancellationFee = cancellationPolicy?.["cancellationFee"] || 0.00;
  
  // Check if within free cancellation window (simplified - assume within window)
  const isWithinFreeWindow = true; // In real scenario, check time difference
  const finalCancellationFee = isWithinFreeWindow ? 0.00 : cancellationFee;
  
  const orderValue = onConfirmResponse?.["beckn:orderValue"] || {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "schema:PriceSpecification",
    "schema:priceCurrency": "USD",
    "schema:price": 18.50,
    "beckn:components": []
  };

  const components = [
    ...(orderValue?.["beckn:components"] || []),
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "DISCOUNT",
      "beckn:value": parseFloat((-orderValue?.["schema:price"] || 0).toFixed(2)),
      "beckn:currency": orderValue?.["schema:priceCurrency"] || "USD",
      "beckn:description": isWithinFreeWindow ? "Cancellation within free window - no charge" : `Cancellation fee: $${finalCancellationFee.toFixed(2)}`
    }
  ];

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || cancelRequest?.["beckn:id"] || `order-cab-${Date.now()}`,
    "beckn:orderStatus": "CANCELLED",
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || cancelRequest?.["beckn:seller"] || {
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
    "beckn:buyer": cancelRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"],
    "beckn:orderItems": (cancelRequest?.["beckn:orderItems"] || onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      ...item,
    })),
    "beckn:orderValue": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": orderValue?.["schema:priceCurrency"] || "USD",
      "schema:price": parseFloat(finalCancellationFee.toFixed(2)),
      "beckn:components": components
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "POST_FULFILLMENT",
      "beckn:status": "NOT_PAID",
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": orderValue?.["schema:priceCurrency"] || "USD",
        "schema:price": parseFloat(finalCancellationFee.toFixed(2))
      },
      "beckn:params": {
        "currency": orderValue?.["schema:priceCurrency"] || "USD",
        "amount": finalCancellationFee.toFixed(2)
      }
    },
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": cancelRequest?.["beckn:fulfillment"]?.["beckn:id"] || onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-ride-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:status": "CANCELLED",
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
        "@type": "beckn:RideDelivery",
        "ride:type": "ride",
        "ride:state": "CANCELLED",
        "ride:agent": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:agent"] || {},
        "ride:vehicle": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:vehicle"] || {},
        "ride:start": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"] || {},
        "ride:end": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"] || {}
      }
    },
    "beckn:orderAttributes": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideBooking/v1/context.jsonld",
      "@type": "beckn:RideBooking",
      "bookingId": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingId"] || `RIDE-BKK-${Date.now()}`,
      "bookingReference": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingReference"] || `BCS-${Date.now()}`,
      "rideStatus": "CANCELLED",
      "cancellationTime": new Date().toISOString(),
      "cancellationReason": isWithinFreeWindow ? "Customer cancelled within free cancellation window" : "Customer cancelled",
      "cancellationFee": parseFloat(finalCancellationFee.toFixed(2))
    }
  };
};

