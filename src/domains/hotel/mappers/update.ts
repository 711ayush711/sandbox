/**
 * Update mapper for Hotel domain
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

  // Merge guest information and special requests from update request
  const updatedGuests = updateRequest?.["beckn:orderAttributes"]?.["guests"] || [];
  const existingGuests = onConfirmResponse?.["beckn:orderAttributes"]?.["guests"] || [];
  
  let mergedGuests: any[] = [];
  if (existingGuests.length > 0) {
    mergedGuests = existingGuests.map((existing: any) => {
      const update = updatedGuests.find((upd: any) => upd.guestId === existing.guestId || upd.id === existing.id);
      return update ? { ...existing, ...update } : existing;
    });
  } else if (updatedGuests.length > 0) {
    mergedGuests = updatedGuests;
  }

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || updateRequest?.["beckn:id"] || `order-hotel-${Date.now()}`,
    "beckn:orderStatus": "IN_PROGRESS", // Always system-generated
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || updateRequest?.["beckn:seller"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-grand-siam-hotel"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": updateRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"], // From request first
    "beckn:orderItems": (updateRequest?.["beckn:orderItems"] || onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      ...item,
    })),
    "beckn:orderValue": onConfirmResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 752.25,
      "beckn:components": []
    }, // Always from previous context (preserves context URL from previous), never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": updateRequest?.["beckn:fulfillment"]?.["beckn:id"] || onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-hotel-${Date.now()}`,
      "beckn:type": "hotel_stay",
      "beckn:state": "IN_PROGRESS", // Always system-generated
      "beckn:time": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:time"] || {
        "@type": "beckn:TimePeriod",
        "schema:startDate": "2025-12-10T14:00:00+07:00",
        "schema:endDate": "2025-12-15T12:00:00+07:00",
        "beckn:duration": "P5D"
      }
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "PRE_FULFILLMENT",
      "beckn:status": "PAID", // Always system-generated
      "beckn:amount": onConfirmResponse?.["beckn:payment"]?.["beckn:amount"] || {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 752.25
      }
    },
    "beckn:orderAttributes": {
      ...(onConfirmResponse?.["beckn:orderAttributes"] || {}),
      "guests": mergedGuests.length > 0 ? mergedGuests : (onConfirmResponse?.["beckn:orderAttributes"]?.["guests"] || updateRequest?.["beckn:orderAttributes"]?.["guests"] || []),
      ...(updateRequest?.["beckn:orderAttributes"]?.["guests"]?.[0]?.["specialRequests"] ? {
        "guests": mergedGuests.map((guest: any) => ({
          ...guest,
          "specialRequests": updateRequest?.["beckn:orderAttributes"]?.["guests"]?.find((g: any) => g.guestId === guest.guestId || g.id === guest.id)?.["specialRequests"] || guest.specialRequests
        }))
      } : {})
    }
  };
};

