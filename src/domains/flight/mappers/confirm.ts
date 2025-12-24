/**
 * Confirm mapper for Flight domain
 * Generates on_confirm response based on incoming confirm request and previous on_init context
 * 
 * @param incomingMessage - Confirm request from BAP (contains order confirmation details)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_init response (order initialization details)
 */
export const onConfirmMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const confirmRequest = incomingMessage?.order;
  const onInitResponse = storedContext?.previousResponse?.message?.order;

  // Get add-on items from confirm request (may have only @id) and expand from on_init
  const confirmAddOnIds = confirmRequest?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];
  const initAddOnItems = onInitResponse?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];
  
  // Map confirm request addOn IDs to full addOn items from on_init
  const expandedAddOnItems = confirmAddOnIds.map((confirmAddOn: any) => {
    const addOnId = confirmAddOn?.["@id"];
    const fullAddOn = initAddOnItems.find((item: any) => item?.["@id"] === addOnId);
    return fullAddOn || confirmAddOn; // Use full details if found, otherwise use confirm addOn
  });
  
  // If no addOns in confirm request, use all from on_init
  const addOnItems = expandedAddOnItems.length > 0 ? expandedAddOnItems : initAddOnItems;

  // Update component descriptions to match example format
  const orderValue = onInitResponse?.["beckn:orderValue"];
  const updatedComponents = orderValue?.["beckn:components"]?.map((comp: any) => {
    if (comp?.["beckn:type"] === "UNIT" && comp?.["beckn:description"]?.includes("Checked baggage")) {
      return {
        ...comp,
        "beckn:description": `Checked baggage (1 × $${comp?.["beckn:value"]?.toFixed(2)})`
      };
    }
    if (comp?.["beckn:type"] === "UNIT" && comp?.["beckn:description"]?.includes("Seat selection")) {
      return {
        ...comp,
        "beckn:description": `Seat selection (1 × $${comp?.["beckn:value"]?.toFixed(2)})`
      };
    }
    if (comp?.["beckn:type"] === "UNIT" && comp?.["beckn:description"]?.includes("Travel insurance")) {
      return {
        ...comp,
        "beckn:description": `Travel insurance (1 × $${comp?.["beckn:value"]?.toFixed(2)})`
      };
    }
    return comp;
  }) || [];

  // Generate PNR
  const pnr = `DL${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const bookingReference = onInitResponse?.["beckn:orderNumber"] || `BK-${Date.now().toString().slice(-6)}`;

  // Enhance passenger details with assigned seat and ticket number
  const passengers = (confirmRequest?.["beckn:orderAttributes"]?.["passengers"] || 
                      onInitResponse?.["beckn:orderAttributes"]?.["passengers"] || []).map((passenger: any) => ({
    ...passenger,
    "assignedSeat": passenger?.["assignedSeat"] || (passenger?.["seatPreference"] === "WINDOW" ? "12A" : "12B"), // System-generated
    "ticketNumber": passenger?.["ticketNumber"] || `006${Math.random().toString().slice(2, 11)}` // System-generated
  }));

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onInitResponse?.["beckn:id"] || confirmRequest?.["beckn:id"] || `order-flight-${Date.now()}`,
    "beckn:orderNumber": onInitResponse?.["beckn:orderNumber"] || confirmRequest?.["beckn:orderNumber"] || `BK-${Date.now().toString().slice(-6)}`,
    "beckn:orderStatus": "CONFIRMED", // Always system-generated
    "beckn:seller": onInitResponse?.["beckn:seller"] || confirmRequest?.["beckn:seller"] || {
      "@context": onInitResponse?.["beckn:seller"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-delta-airlines"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": confirmRequest?.["beckn:buyer"] || onInitResponse?.["beckn:buyer"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Buyer",
      "beckn:id": `buyer-${Date.now()}`,
      "beckn:role": "BUYER",
    }, // From request first
    "beckn:orderItems": (confirmRequest?.["beckn:orderItems"] || onInitResponse?.["beckn:orderItems"] || []).map((item: any) => {
      const initOrderItem = onInitResponse?.["beckn:orderItems"]?.[0];
      const initAcceptedOffer = initOrderItem?.["beckn:acceptedOffer"];
      
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": item?.["beckn:lineId"] || initOrderItem?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": item?.["beckn:orderedItem"] || initOrderItem?.["beckn:orderedItem"],
        "beckn:quantity": item?.["beckn:quantity"] || initOrderItem?.["beckn:quantity"] || 1,
        "beckn:acceptedOffer": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": initAcceptedOffer?.["beckn:id"] || item?.["beckn:acceptedOffer"]?.["beckn:id"],
          "beckn:descriptor": initAcceptedOffer?.["beckn:descriptor"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": "Main Cabin Economy Fare",
            "beckn:shortDesc": "Standard economy fare with carry-on bag included"
          },
          "beckn:price": initAcceptedOffer?.["beckn:price"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": "USD",
            "schema:price": 280.00
          },
          "beckn:addOnItems": addOnItems
        },
        "beckn:price": initOrderItem?.["beckn:price"] || {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": "USD",
          "schema:price": 280.00
        },
        "beckn:orderItemAttributes": initOrderItem?.["beckn:orderItemAttributes"] || {}
      };
    }),
    "beckn:orderValue": {
      ...(onInitResponse?.["beckn:orderValue"] || {}),
      "@context": onInitResponse?.["beckn:orderValue"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
      "schema:price": onInitResponse?.["beckn:orderValue"]?.["schema:price"] || 392.70,
      "beckn:components": updatedComponents
    }, // Always from previous on_init (preserves context URL from previous), never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": confirmRequest?.["beckn:fulfillment"]?.["beckn:id"] || onInitResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-flight-${Date.now()}`,
      "beckn:mode": "FLIGHT",
      "beckn:status": "BOOKED" // Always system-generated
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": confirmRequest?.["beckn:payment"]?.["beckn:id"] || onInitResponse?.["beckn:payment"]?.["beckn:id"] || `payment-${Date.now()}`,
      "beckn:status": "PAID", // Always system-generated
      "beckn:amount": confirmRequest?.["beckn:payment"]?.["beckn:amount"] || onInitResponse?.["beckn:payment"]?.["beckn:amount"] || {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 392.70
      },
      "beckn:txnRef": confirmRequest?.["beckn:payment"]?.["beckn:txnRef"] || `TXN-${Date.now()}`, // System-generated if not provided
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": confirmRequest?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || onInitResponse?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || ["Card"]
    },
    "beckn:orderAttributes": {
      ...(onInitResponse?.["beckn:orderAttributes"] || {}),
      "@context": onInitResponse?.["beckn:orderAttributes"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightBooking/v1/context.jsonld",
      "@type": onInitResponse?.["beckn:orderAttributes"]?.["@type"] || "FlightBooking",
      "pnr": pnr, // Always system-generated
      "bookingReference": bookingReference, // Always system-generated
      "passengers": passengers,
      "confirmationDocument": {
        "url": `https://delta-airlines-platform.com/documents/booking-${pnr.toLowerCase()}-confirmation.pdf`,
        "mimeType": "application/pdf"
      }, // Always system-generated
      "eTicket": {
        "url": `https://delta-airlines-platform.com/documents/eticket-${pnr.toLowerCase()}.pdf`,
        "mimeType": "application/pdf"
      }, // Always system-generated
      "cancellationTerms": onInitResponse?.["beckn:orderAttributes"]?.["cancellationTerms"] || [
        {
          "condition": "More than 24 hours before departure",
          "cancellationFee": 200.00,
          "refundEligible": true,
          "refundPercentage": 35
        },
        {
          "condition": "Less than 24 hours before departure",
          "cancellationFee": 280.00,
          "refundEligible": false
        }
      ]
    }
  };
};

