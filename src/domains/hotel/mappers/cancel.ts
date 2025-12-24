/**
 * Cancel mapper for Hotel domain
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

  // Calculate refund amount based on cancellation policy
  const orderValue = onConfirmResponse?.["beckn:orderValue"]?.["schema:price"] || 752.25;
  const cancellationPolicy = onConfirmResponse?.["beckn:orderAttributes"]?.["cancellationPolicy"] || {
    "cancellationFee": 60.00,
    "refundable": true
  };
  const cancellationFee = cancellationPolicy.cancellationFee || 60.00;
  const refundAmount = cancellationPolicy.refundable ? (orderValue - cancellationFee) : 0;

  // Add cancellation fee component to orderValue
  const baseComponents = onConfirmResponse?.["beckn:orderValue"]?.["beckn:components"] || [];
  const updatedComponents = [
    ...baseComponents,
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "FEE",
      "beckn:value": parseFloat((-cancellationFee).toFixed(2)),
      "beckn:currency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
      "beckn:description": "Cancellation fee"
    }
  ];

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || cancelRequest?.["beckn:id"] || `order-hotel-${Date.now()}`,
    "beckn:orderStatus": "CANCELLED", // Always system-generated
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || cancelRequest?.["beckn:seller"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-grand-siam-hotel"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": cancelRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"], // From request first
    "beckn:orderItems": (cancelRequest?.["beckn:orderItems"] || onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      ...item,
    })),
    "beckn:orderValue": {
      "@context": onConfirmResponse?.["beckn:orderValue"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
      "schema:price": parseFloat((orderValue - cancellationFee).toFixed(2)),
      "beckn:components": updatedComponents
    }, // Always from previous context (preserves context URL from previous), with cancellation fee deducted
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": cancelRequest?.["beckn:fulfillment"]?.["beckn:id"] || onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-hotel-${Date.now()}`,
      "beckn:type": "hotel_stay",
      "beckn:state": "CANCELLED" // Always system-generated
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "PRE_FULFILLMENT", // Always system-generated
      "beckn:status": "REFUNDED", // Always system-generated
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
        "schema:price": parseFloat((orderValue - cancellationFee).toFixed(2))
      },
      "beckn:params": {
        "currency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
        "amount": parseFloat((orderValue - cancellationFee).toFixed(2)).toString(),
        "transaction_id": onConfirmResponse?.["beckn:payment"]?.["beckn:params"]?.["transaction_id"] || `TXN-PAY-HOTEL-${Date.now()}`,
        "refund_transaction_id": `TXN-REFUND-HOTEL-${Date.now()}` // Always system-generated
      }
    },
    "beckn:orderAttributes": {
      ...(onConfirmResponse?.["beckn:orderAttributes"] || {}),
      "cancellationDate": new Date().toISOString(), // Always system-generated
      "refundAmount": parseFloat(refundAmount.toFixed(2)), // Always system-generated (calculated)
      "refundStatus": "PROCESSED" // Always system-generated
    }
  };
};

