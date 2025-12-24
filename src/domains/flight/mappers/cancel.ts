/**
 * Cancel mapper for Flight domain
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

  // Get base orderValue (without add-ons) from on_confirm components
  // Filter out add-on components (checked baggage, seat selection, travel insurance)
  const allComponents = onConfirmResponse?.["beckn:orderValue"]?.["beckn:components"] || [];
  const baseComponents = allComponents.filter((comp: any) => {
    const desc = comp?.["beckn:description"]?.toLowerCase() || "";
    return !desc.includes("checked baggage") && 
           !desc.includes("seat selection") && 
           !desc.includes("travel insurance");
  });
  
  // Calculate base orderValue from base components
  const baseOrderValue = baseComponents.reduce((sum: number, comp: any) => sum + (comp?.["beckn:value"] || 0), 0);
  const currency = onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD";
  
  // Calculate refund amount based on cancellation terms
  const cancellationTerms = onConfirmResponse?.["beckn:orderAttributes"]?.["cancellationTerms"] || [];
  const applicableTerm = cancellationTerms[0] || { cancellationFee: 200.00, refundEligible: true, refundPercentage: 35 };
  // Refund amount = baseOrderValue - cancellationFee (if refund eligible)
  const refundAmount = applicableTerm.refundEligible ? 
    baseOrderValue - applicableTerm.cancellationFee : 0;

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || cancelRequest?.["beckn:id"] || `order-flight-${Date.now()}`,
    "beckn:orderNumber": onConfirmResponse?.["beckn:orderNumber"] || `BK-${Date.now().toString().slice(-6)}`,
    "beckn:orderStatus": "CANCELLED", // Always system-generated
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || cancelRequest?.["beckn:seller"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-delta-airlines"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": cancelRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"], // From request first
    "beckn:orderItems": (cancelRequest?.["beckn:orderItems"] || onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => {
      const confirmOrderItem = onConfirmResponse?.["beckn:orderItems"]?.[0];
      const confirmAcceptedOffer = confirmOrderItem?.["beckn:acceptedOffer"];
      
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": item?.["beckn:lineId"] || confirmOrderItem?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": item?.["beckn:orderedItem"] || confirmOrderItem?.["beckn:orderedItem"],
        "beckn:quantity": item?.["beckn:quantity"] || confirmOrderItem?.["beckn:quantity"] || 1,
        "beckn:acceptedOffer": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": confirmAcceptedOffer?.["beckn:id"] || item?.["beckn:acceptedOffer"]?.["beckn:id"],
          "beckn:descriptor": confirmAcceptedOffer?.["beckn:descriptor"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": "Main Cabin Economy Fare",
            "beckn:shortDesc": "Standard economy fare with carry-on bag included"
          },
          "beckn:price": confirmAcceptedOffer?.["beckn:price"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": "USD",
            "schema:price": 280.00
          },
          "beckn:addOnItems": confirmAcceptedOffer?.["beckn:addOnItems"] || []
        },
        "beckn:price": confirmOrderItem?.["beckn:price"] || {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": "USD",
          "schema:price": 280.00
        },
        "beckn:orderItemAttributes": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightService/v1/context.jsonld",
          "@type": "beckn:FlightService",
          "flight:flightNumber": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:flightNumber"] || "",
          "flight:airline": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:airline"] || "",
          "flight:airlineCode": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:airlineCode"] || "",
          "flight:departureAirport": {
            "code": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:departureAirport"]?.["code"] || "",
            "name": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:departureAirport"]?.["name"] || ""
          },
          "flight:arrivalAirport": {
            "code": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:arrivalAirport"]?.["code"] || "",
            "name": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:arrivalAirport"]?.["name"] || ""
          },
          "flight:departureTime": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:departureTime"],
          "flight:arrivalTime": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:arrivalTime"],
          "flight:duration": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:duration"],
          "flight:cabinClass": confirmOrderItem?.["beckn:orderItemAttributes"]?.["flight:cabinClass"] || "ECONOMY"
        }
      };
    }),
    "beckn:orderValue": {
      "@context": onConfirmResponse?.["beckn:orderValue"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": currency,
      "schema:price": parseFloat(baseOrderValue.toFixed(2)),
      "beckn:components": baseComponents.map((comp: any) => ({
        ...comp,
        "beckn:description": comp?.["beckn:description"]?.replace(/ \(\d+ × \$\d+\.\d+\)/g, "") || comp?.["beckn:description"] // Remove quantity details for simpler format
      }))
    }, // Base orderValue without add-ons (preserves context URL from previous), never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": cancelRequest?.["beckn:fulfillment"]?.["beckn:id"] || onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-flight-${Date.now()}`,
      "beckn:mode": "FLIGHT",
      "beckn:status": "CANCELLED" // Always system-generated
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": cancelRequest?.["beckn:payment"]?.["beckn:id"] || onConfirmResponse?.["beckn:payment"]?.["beckn:id"] || `payment-${Date.now()}`,
      "beckn:status": "REFUNDED", // Always system-generated
      "beckn:amount": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": currency,
        "schema:price": parseFloat(baseOrderValue.toFixed(2))
      },
      "beckn:txnRef": onConfirmResponse?.["beckn:payment"]?.["beckn:txnRef"] || `TXN-${Date.now()}`,
      "beckn:refundRef": `REFUND-${Date.now()}`, // Always system-generated
      "beckn:refundedAt": new Date().toISOString(), // Always system-generated
      "beckn:beneficiary": "BAP"
    },
    "beckn:orderAttributes": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightBooking/v1/context.jsonld",
      "@type": "FlightBooking",
      "pnr": onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || `DL${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      "bookingReference": onConfirmResponse?.["beckn:orderNumber"] || `BK-${Date.now().toString().slice(-6)}`,
      "cancellationDate": new Date().toISOString(), // Always system-generated
      "cancellationFee": applicableTerm.cancellationFee, // Calculated from cancellation terms
      "refundAmount": parseFloat(refundAmount.toFixed(2)), // Always system-generated (calculated)
      "refundStatus": "PROCESSED" // Always system-generated
    }
  };
};

