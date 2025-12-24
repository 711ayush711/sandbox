/**
 * Status mapper for Flight domain
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

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || statusRequest?.["beckn:id"] || `order-flight-${Date.now()}`,
    "beckn:orderNumber": onConfirmResponse?.["beckn:orderNumber"] || `BK-${Date.now().toString().slice(-6)}`,
    "beckn:orderStatus": "IN_PROGRESS", // Always system-generated
    "beckn:seller": onConfirmResponse?.["beckn:seller"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-delta-airlines"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": onConfirmResponse?.["beckn:buyer"], // From previous context
    "beckn:orderItems": (onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => {
      // Enhance orderItemAttributes with flight status and gate information
      const orderItemAttributes = {
        ...(item?.["beckn:orderItemAttributes"] || {}),
        "flight:flightStatus": "SCHEDULED", // Always system-generated
        "flight:departureAirport": {
          ...(item?.["beckn:orderItemAttributes"]?.["flight:departureAirport"] || {}),
          "gate": item?.["beckn:orderItemAttributes"]?.["flight:departureAirport"]?.["gate"] || "D7" // System-generated
        },
        "flight:arrivalAirport": {
          ...(item?.["beckn:orderItemAttributes"]?.["flight:arrivalAirport"] || {}),
          "gate": item?.["beckn:orderItemAttributes"]?.["flight:arrivalAirport"]?.["gate"] || "B22" // System-generated
        }
      };
      
      return {
        ...item,
        "beckn:orderItemAttributes": orderItemAttributes
      };
    }),
    "beckn:orderValue": onConfirmResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 392.70,
      "beckn:components": []
    }, // Always from previous context (preserves context URL from previous)
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": onConfirmResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-flight-${Date.now()}`,
      "beckn:mode": "FLIGHT",
      "beckn:status": "CHECKED_IN", // Always system-generated
      "beckn:trackingAction": {
        "@type": "schema:TrackAction",
        "schema:target": {
          "@type": "schema:EntryPoint",
          "schema:url": `https://delta.com/track/${onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21"}`
        }
      }
    },
    "beckn:payment": onConfirmResponse?.["beckn:payment"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": `payment-${Date.now()}`,
      "beckn:status": "PAID", // Always system-generated
      "beckn:amount": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 392.70
      },
      "beckn:txnRef": `TXN-${Date.now()}`,
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": ["Card"]
    },
    "beckn:orderAttributes": {
      ...(onConfirmResponse?.["beckn:orderAttributes"] || {}),
      "@context": onConfirmResponse?.["beckn:orderAttributes"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightBooking/v1/context.jsonld",
      "@type": onConfirmResponse?.["beckn:orderAttributes"]?.["@type"] || "FlightBooking",
      "pnr": onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || `DL${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      "bookingReference": onConfirmResponse?.["beckn:orderNumber"] || onConfirmResponse?.["beckn:orderAttributes"]?.["bookingReference"] || `BK-${Date.now().toString().slice(-6)}`,
      "passengers": (onConfirmResponse?.["beckn:orderAttributes"]?.["passengers"] || []).map((passenger: any) => ({
        ...passenger,
        "checkInStatus": "CHECKED_IN", // Always system-generated
        "checkInTime": new Date().toISOString(), // Always system-generated
        "boardingPass": {
          "url": `https://delta-airlines-platform.com/boardingpass/${onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21"}-PAX${passenger?.["id"]?.toUpperCase() || "001"}.pdf`,
          "mimeType": "application/pdf",
          "qrCode": `https://delta-airlines-platform.com/boardingpass/qr/${onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21"}-PAX${passenger?.["id"]?.toUpperCase() || "001"}.png`,
          "barcode": `M1${(passenger?.["lastName"] || "BECKN").toUpperCase()}/${passenger?.["firstName"] || "FIDE"}           E${onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21"} ${passenger?.["assignedSeat"] || "12A"}001D007B`
        } // Always system-generated
      })),
      "confirmationDocument": onConfirmResponse?.["beckn:orderAttributes"]?.["confirmationDocument"] || {
        "url": `https://delta-airlines-platform.com/documents/booking-${(onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21").toLowerCase()}-confirmation.pdf`,
        "mimeType": "application/pdf"
      },
      "eTicket": onConfirmResponse?.["beckn:orderAttributes"]?.["eTicket"] || {
        "url": `https://delta-airlines-platform.com/documents/eticket-${(onConfirmResponse?.["beckn:orderAttributes"]?.["pnr"] || "DL9X21").toLowerCase()}.pdf`,
        "mimeType": "application/pdf"
      },
      "checkInDetails": {
        "checkInOpenTime": new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours before departure
        "checkInCloseTime": new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 1 hour before departure
        "boardingTime": new Date(Date.now() + 25.5 * 60 * 60 * 1000).toISOString(), // 30 minutes before departure
        "gate": "D7", // System-generated
        "terminal": "2" // System-generated
      }, // Always system-generated
      "cancellationTerms": onConfirmResponse?.["beckn:orderAttributes"]?.["cancellationTerms"] || [
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

