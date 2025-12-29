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
  
  // Generate room number and check-in time if not present (for IN_PROGRESS status)
  // If roomNumber is "TBA" or missing, generate a new one; otherwise use existing
  const existingRoomNumber = existingGuests?.[0]?.["roomNumber"];
  const roomNumber = (existingRoomNumber && existingRoomNumber !== "TBA") 
                     ? existingRoomNumber 
                     : `12${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;
  const checkInTime = existingGuests?.[0]?.["checkInTime"] || 
                      new Date().toISOString().replace('Z', '+07:00');
  
  let mergedGuests: any[] = [];
  if (existingGuests.length > 0) {
    mergedGuests = existingGuests.map((existing: any) => {
      const update = updatedGuests.find((upd: any) => upd.guestId === existing.guestId || upd.id === existing.id);
      const merged = update ? { ...existing, ...update } : existing;
      
      // Remove updateReason (request-only field)
      const { updateReason, ...guestWithoutUpdateReason } = merged;
      
      // Ensure roomNumber and checkInTime are present for IN_PROGRESS status
      return {
        ...guestWithoutUpdateReason,
        "roomNumber": roomNumber,
        "checkInTime": checkInTime
      };
    });
  } else if (updatedGuests.length > 0) {
    mergedGuests = updatedGuests.map((guest: any) => {
      const { updateReason, ...guestWithoutUpdateReason } = guest;
      return {
        ...guestWithoutUpdateReason,
        "roomNumber": roomNumber,
        "checkInTime": checkInTime
      };
    });
  }

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onConfirmResponse?.["beckn:id"] || updateRequest?.["beckn:id"] || `order-hotel-${Date.now()}`,
    "beckn:orderStatus": "IN_PROGRESS", // Always system-generated
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
    "beckn:buyer": updateRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"], // From request first
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
    "beckn:payment": onConfirmResponse?.["beckn:payment"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "PRE_FULFILLMENT",
      "beckn:status": "PAID",
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 752.25
      },
      "beckn:params": {
        "currency": "USD",
        "amount": "752.25",
        "transaction_id": "TXN-PAY-HOTEL-20251201-001"
      }
    },
    "beckn:orderAttributes": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelBooking/v1/context.jsonld",
      "@type": "beckn:HotelBooking",
      "bookingId": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingId"] || "HBNK1025",
      "bookingReference": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingReference"] || "GS-20251210-HBNK1025",
      "guests": mergedGuests.length > 0 ? mergedGuests : (onConfirmResponse?.["beckn:orderAttributes"]?.["guests"] || []).map((guest: any) => {
        const { updateReason, ...guestWithoutUpdateReason } = guest;
        return {
          ...guestWithoutUpdateReason,
          "roomNumber": roomNumber,
          "checkInTime": checkInTime
        };
      }),
      "confirmationDocument": onConfirmResponse?.["beckn:orderAttributes"]?.["confirmationDocument"] || {
        "url": `https://hotel-aggregator-platform.com/documents/booking-${(onConfirmResponse?.["beckn:orderAttributes"]?.["bookingId"] || "hbnk1025").toLowerCase()}-confirmation.pdf`,
        "mimeType": "application/pdf"
      },
      "cancellationPolicy": onConfirmResponse?.["beckn:orderAttributes"]?.["cancellationPolicy"] || {
        "freeCancellationUntil": "2025-12-08T23:59:59+07:00",
        "cancellationFee": 60.00,
        "refundable": true
      }
    }
  };
};

