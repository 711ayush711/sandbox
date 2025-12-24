/**
 * Confirm mapper for Hotel domain
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

  // Generate booking ID and reference
  const bookingId = `HBNK${Date.now().toString().slice(-4)}`;
  const bookingReference = `GS-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${bookingId}`;

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onInitResponse?.["beckn:id"] || confirmRequest?.["beckn:id"] || `order-hotel-${Date.now()}`,
    "beckn:orderStatus": "CONFIRMED", // Always system-generated
    "beckn:seller": (() => {
      const seller = onInitResponse?.["beckn:seller"] || confirmRequest?.["beckn:seller"];
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
        "beckn:id": seller || "provider-grand-siam-hotel",
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
    "beckn:buyer": confirmRequest?.["beckn:buyer"] || onInitResponse?.["beckn:buyer"], // From request first
    "beckn:orderItems": (onInitResponse?.["beckn:orderItems"] || confirmRequest?.["beckn:orderItems"] || []).map((item: any, index: number) => {
      const requestItem = confirmRequest?.["beckn:orderItems"]?.[index];
      const requestAddOnIds = requestItem?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];
      const allAddOns = item?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];
      
      // Expand add-ons from IDs to full objects
      const expandedAddOns = requestAddOnIds.length > 0
        ? requestAddOnIds.map((id: any) => {
            const addOnId = typeof id === 'string' ? id : id?.["@id"];
            return allAddOns.find((addon: any) => addon?.["@id"] === addOnId) || {
              "@type": "schema:Offer",
              "@id": addOnId
            };
          })
        : allAddOns;
      
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": item?.["beckn:lineId"] || requestItem?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": item?.["beckn:orderedItem"] || requestItem?.["beckn:orderedItem"] || "item-hotel-grand-siam-deluxe",
        "beckn:acceptedOffer": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": item?.["beckn:acceptedOffer"]?.["beckn:id"] || requestItem?.["beckn:acceptedOffer"]?.["beckn:id"] || "offer-grand-siam-deluxe-base",
          "beckn:descriptor": item?.["beckn:acceptedOffer"]?.["beckn:descriptor"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": "Deluxe Room with Breakfast - 5 Nights",
            "beckn:shortDesc": "Standard rate for 5 nights stay"
          },
          "beckn:price": item?.["beckn:acceptedOffer"]?.["beckn:price"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
            "schema:price": onInitResponse?.["beckn:orderValue"]?.["beckn:components"]?.[0]?.["beckn:value"] / (item?.["beckn:quantity"]?.["schema:value"] || 5) || 120.00
          },
          "beckn:addOnItems": expandedAddOns
        },
        "beckn:quantity": item?.["beckn:quantity"] || requestItem?.["beckn:quantity"] || {
          "@type": "schema:QuantitativeValue",
          "schema:value": 5,
          "schema:unitCode": "NIGHTS"
        },
        "beckn:price": item?.["beckn:price"] || {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
          "schema:price": onInitResponse?.["beckn:orderValue"]?.["beckn:components"]?.[0]?.["beckn:value"] / (item?.["beckn:quantity"]?.["schema:value"] || 5) || 120.00
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
      };
    }),
    "beckn:orderValue": onInitResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 752.25,
      "beckn:components": []
    }, // Always from previous on_init (preserves context URL from previous), never from request
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "PRE_FULFILLMENT", // Always system-generated
      "beckn:status": "PAID", // Always system-generated
      "beckn:amount": confirmRequest?.["beckn:payment"]?.["beckn:amount"] || onInitResponse?.["beckn:payment"]?.["beckn:amount"] || {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": "USD",
        "schema:price": 752.25
      },
      "beckn:params": {
        "currency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
        "amount": (onInitResponse?.["beckn:orderValue"]?.["schema:price"] || 752.25).toString(),
        "transaction_id": confirmRequest?.["beckn:payment"]?.["beckn:params"]?.["transaction_id"] || `TXN-PAY-HOTEL-${Date.now()}`
      }
    },
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": confirmRequest?.["beckn:fulfillment"]?.["beckn:id"] || onInitResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-hotel-${Date.now()}`,
      "beckn:type": "hotel_stay",
      "beckn:state": "CONFIRMED", // Always system-generated
      "beckn:time": (() => {
        const initTime = onInitResponse?.["beckn:fulfillment"]?.["beckn:time"];
        const requestTime = confirmRequest?.["beckn:fulfillment"]?.["beckn:time"];
        const quantity = onInitResponse?.["beckn:orderItems"]?.[0]?.["beckn:quantity"]?.["schema:value"] || 5;
        return {
          "@type": "beckn:TimePeriod",
          "schema:startDate": requestTime?.["schema:startDate"] || initTime?.["schema:startDate"] || "2025-12-10T14:00:00+07:00",
          "schema:endDate": requestTime?.["schema:endDate"] || initTime?.["schema:endDate"] || "2025-12-15T12:00:00+07:00",
          "beckn:duration": requestTime?.["beckn:duration"] || initTime?.["beckn:duration"] || `P${quantity}D`
        };
      })()
    },
    "beckn:orderAttributes": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelBooking/v1/context.jsonld",
      "@type": "beckn:HotelBooking",
      "bookingId": bookingId, // Always system-generated
      "bookingReference": bookingReference, // Always system-generated
      "guests": (confirmRequest?.["beckn:orderAttributes"]?.["guests"] || onInitResponse?.["beckn:orderAttributes"]?.["guests"] || []).map((guest: any) => ({
        ...guest,
        "roomNumber": guest?.["roomNumber"] || "TBA"
      })),
      "confirmationDocument": {
        "url": `https://hotel-aggregator-platform.com/documents/booking-${bookingId.toLowerCase()}-confirmation.pdf`,
        "mimeType": "application/pdf"
      }, // Always system-generated
      "cancellationPolicy": onInitResponse?.["beckn:orderAttributes"]?.["cancellationPolicy"] || confirmRequest?.["beckn:orderAttributes"]?.["cancellationPolicy"] || {
        "freeCancellationUntil": new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        "cancellationFee": 60.00,
        "refundable": true
      }
    }
  };
};

