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
  let roomNumber: string | undefined = "TBA"; // Default to TBA for CONFIRMED status
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
    "beckn:seller": (() => {
      const seller = onConfirmResponse?.["beckn:seller"];
      if (seller && typeof seller === 'object' && seller["@type"]) {
        // Ensure seller has locations and descriptor with telephone/email
        return {
          ...seller,
          "beckn:descriptor": {
            ...seller["beckn:descriptor"],
            "schema:telephone": seller["beckn:descriptor"]?.["schema:telephone"] || "+66 2 123 4567",
            "schema:email": seller["beckn:descriptor"]?.["schema:email"] || "reservations@grandsiamhotel.com"
          },
          "beckn:locations": seller["beckn:locations"] || [
            {
              "@type": "beckn:Location",
              "beckn:id": "location-grand-siam-hotel",
              "beckn:address": {
                "@type": "schema:PostalAddress",
                "schema:streetAddress": "123 Sukhumvit Road",
                "schema:addressLocality": "Khlong Toei",
                "schema:addressRegion": "Bangkok",
                "schema:postalCode": "10110",
                "schema:addressCountry": "TH"
              },
              "beckn:geo": {
                "type": "Point",
                "coordinates": [100.5698, 13.7563]
              }
            }
          ]
        };
      }
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:Provider",
        "beckn:id": "provider-grand-siam-hotel",
        "beckn:descriptor": {
          "@type": "beckn:Descriptor",
          "schema:name": "Grand Siam Hotel",
          "beckn:shortDesc": "Luxury hotel in the heart of Bangkok",
          "schema:telephone": "+66 2 123 4567",
          "schema:email": "reservations@grandsiamhotel.com"
        },
        "beckn:locations": [
          {
            "@type": "beckn:Location",
            "beckn:id": "location-grand-siam-hotel",
            "beckn:address": {
              "@type": "schema:PostalAddress",
              "schema:streetAddress": "123 Sukhumvit Road",
              "schema:addressLocality": "Khlong Toei",
              "schema:addressRegion": "Bangkok",
              "schema:postalCode": "10110",
              "schema:addressCountry": "TH"
            },
            "beckn:geo": {
              "type": "Point",
              "coordinates": [100.5698, 13.7563]
            }
          }
        ]
      };
    })(),
    "beckn:buyer": onConfirmResponse?.["beckn:buyer"], // From previous context
    "beckn:orderItems": (onConfirmResponse?.["beckn:orderItems"] || []).map((item: any) => ({
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:OrderItem",
      "beckn:lineId": item?.["beckn:lineId"] || "line-001",
      "beckn:orderedItem": item?.["beckn:orderedItem"] || "item-hotel-grand-siam-deluxe",
      "beckn:acceptedOffer": item?.["beckn:acceptedOffer"] || {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:Offer",
        "beckn:id": "offer-grand-siam-deluxe-base",
        "beckn:descriptor": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Descriptor",
          "schema:name": "Deluxe Room with Breakfast - 5 Nights",
          "beckn:shortDesc": "Standard rate for 5 nights stay"
        },
        "beckn:price": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": "USD",
          "schema:price": 120.00
        },
        "beckn:addOnItems": []
      },
      "beckn:quantity": item?.["beckn:quantity"] || {
        "@type": "schema:QuantitativeValue",
        "schema:value": 5,
        "schema:unitCode": "NIGHTS"
      },
      "beckn:price": item?.["beckn:price"] || {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 120.00
      },
      "beckn:orderItemAttributes": item?.["beckn:orderItemAttributes"] || {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelService/v1/context.jsonld",
        "@type": "beckn:HotelService",
        "hotel:hotelName": "Grand Siam Hotel",
        "hotel:roomType": "Deluxe Room",
        "hotel:bedType": "King",
        "hotel:maxOccupancy": 2,
        "hotel:roomSize": 35,
        "hotel:roomSizeUnit": "SQM",
        "hotel:viewType": "City View",
        "hotel:checkInTime": "14:00",
        "hotel:checkOutTime": "12:00",
        "hotel:amenities": {
          "wifi": true,
          "breakfast": true,
          "pool": true,
          "gym": true,
          "parking": true,
          "airConditioning": true,
          "tv": true,
          "minibar": true,
          "safe": true,
          "roomService": true
        }
      }
    })),
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
      "beckn:time": (() => {
        const initTime = onConfirmResponse?.["beckn:fulfillment"]?.["beckn:time"];
        return initTime || {
          "@type": "beckn:TimePeriod",
          "schema:startDate": "2025-12-10T14:00:00+07:00",
          "schema:endDate": "2025-12-15T12:00:00+07:00",
          "beckn:duration": "P5D"
        };
      })()
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
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelBooking/v1/context.jsonld",
      "@type": "beckn:HotelBooking",
      "bookingId": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingId"] || "HBNK1025",
      "bookingReference": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingReference"] || "GS-20251210-HBNK1025",
      "guests": (onConfirmResponse?.["beckn:orderAttributes"]?.["guests"] || []).map((guest: any) => {
        const guestObj: any = {
          "guestId": guest?.["guestId"] || "GUEST001",
          "name": guest?.["name"],
          "email": guest?.["email"],
          "phone": guest?.["phone"],
          "specialRequests": guest?.["specialRequests"]
        };
        
        // For CONFIRMED status, always include roomNumber as "TBA"
        if (orderStatus === "CONFIRMED") {
          guestObj["roomNumber"] = "TBA";
        } else if (roomNumber) {
          guestObj["roomNumber"] = roomNumber;
        }
        
        // Add checkInTime only for CHECKED_IN or COMPLETED
        if (checkInTime) {
          guestObj["checkInTime"] = checkInTime;
        }
        
        // Add checkOutTime only for COMPLETED
        if (checkOutTime) {
          guestObj["checkOutTime"] = checkOutTime;
        }
        
        // Add checkInStatus only for CHECKED_IN or COMPLETED
        if (fulfillmentState === "CHECKED_IN") {
          guestObj["checkInStatus"] = "CHECKED_IN";
        } else if (fulfillmentState === "COMPLETED") {
          guestObj["checkInStatus"] = "CHECKED_OUT";
        }
        
        return guestObj;
      }),
      "confirmationDocument": onConfirmResponse?.["beckn:orderAttributes"]?.["confirmationDocument"] || {
        "url": `https://hotel-aggregator-platform.com/documents/booking-${(onConfirmResponse?.["beckn:orderAttributes"]?.["bookingId"] || "hbnk1025").toLowerCase()}-confirmation.pdf`,
        "mimeType": "application/pdf"
      },
      "cancellationPolicy": onConfirmResponse?.["beckn:orderAttributes"]?.["cancellationPolicy"] || {
        "freeCancellationUntil": "2025-12-08T23:59:59+07:00",
        "cancellationFee": 60.00,
        "refundable": true
      },
      ...(invoice ? { "invoice": invoice } : {}) // Always system-generated when completed
    }
  };
};

