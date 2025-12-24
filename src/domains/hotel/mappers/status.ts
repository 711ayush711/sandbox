/**
 * Status mapper for Hotel domain
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

  // Determine order status and fulfillment state based on booking state
  // Can be CONFIRMED, CHECKED_IN, or COMPLETED
  const bookingState = statusRequest?.["beckn:fulfillment"]?.["beckn:state"] || 
                       onConfirmResponse?.["beckn:fulfillment"]?.["beckn:state"] || 
                       "CONFIRMED";
  
  let orderStatus = "CONFIRMED";
  let fulfillmentState = "CONFIRMED";
  let roomNumber: string | undefined = undefined;
  let checkInTime: string | undefined = undefined;
  let checkOutTime: string | undefined = undefined;
  let invoice: any = undefined;

  if (bookingState === "CHECKED_IN" || bookingState === "IN_PROGRESS") {
    orderStatus = "IN_PROGRESS";
    fulfillmentState = "CHECKED_IN";
    roomNumber = onConfirmResponse?.["beckn:orderAttributes"]?.["guests"]?.[0]?.["roomNumber"] || 
                 `12${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;
    checkInTime = onConfirmResponse?.["beckn:orderAttributes"]?.["guests"]?.[0]?.["checkInTime"] || 
                  new Date().toISOString();
  } else if (bookingState === "COMPLETED" || bookingState === "CHECKED_OUT") {
    orderStatus = "COMPLETED";
    fulfillmentState = "COMPLETED";
    roomNumber = onConfirmResponse?.["beckn:orderAttributes"]?.["guests"]?.[0]?.["roomNumber"] || 
                 `12${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;
    checkInTime = onConfirmResponse?.["beckn:orderAttributes"]?.["guests"]?.[0]?.["checkInTime"] || 
                  new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    checkOutTime = onConfirmResponse?.["beckn:orderAttributes"]?.["guests"]?.[0]?.["checkOutTime"] || 
                   new Date().toISOString();
    invoice = {
      "url": `https://hotel-aggregator-platform.com/documents/invoice-${onConfirmResponse?.["beckn:orderAttributes"]?.["bookingId"]?.toLowerCase() || "hbnk1025"}.pdf`,
      "mimeType": "application/pdf",
      "totalAmount": onConfirmResponse?.["beckn:orderValue"]?.["schema:price"] || 752.25
    };
  }

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || statusRequest?.["beckn:id"] || `order-hotel-${Date.now()}`,
    "beckn:orderStatus": orderStatus, // Always system-generated based on booking state
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-grand-siam-hotel"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": onConfirmResponse?.["beckn:buyer"], // From previous context
    "beckn:orderItems": onConfirmResponse?.["beckn:orderItems"] || [],
    "beckn:orderValue": onConfirmResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 752.25,
      "beckn:components": []
    }, // Always from previous context (preserves context URL from previous)
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-hotel-${Date.now()}`,
      "beckn:type": "hotel_stay",
      "beckn:state": fulfillmentState, // Always system-generated based on booking state
      "beckn:time": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:time"] || {
        "@type": "beckn:TimePeriod",
        "schema:startDate": "2025-12-10T14:00:00+07:00",
        "schema:endDate": "2025-12-15T12:00:00+07:00",
        "beckn:duration": "P5D"
      }
    },
    "beckn:payment": onConfirmResponse?.["beckn:payment"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "PRE_FULFILLMENT",
      "beckn:status": "PAID",
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 752.25
      }
    },
    "beckn:orderAttributes": {
      ...(onConfirmResponse?.["beckn:orderAttributes"] || {}),
      "guests": (onConfirmResponse?.["beckn:orderAttributes"]?.["guests"] || []).map((guest: any) => ({
        ...guest,
        ...(roomNumber ? { "roomNumber": roomNumber } : {}), // Always system-generated when checked in
        ...(checkInTime ? { "checkInTime": checkInTime } : {}), // Always system-generated when checked in
        ...(checkOutTime ? { "checkOutTime": checkOutTime } : {}), // Always system-generated when checked out
        ...(fulfillmentState === "CHECKED_IN" ? { "checkInStatus": "CHECKED_IN" } : {}), // Always system-generated
        ...(fulfillmentState === "COMPLETED" ? { "checkInStatus": "CHECKED_OUT" } : {}) // Always system-generated
      })),
      ...(invoice ? { "invoice": invoice } : {}) // Always system-generated when completed
    }
  };
};

