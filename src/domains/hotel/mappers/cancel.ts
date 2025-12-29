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
    "beckn:seller": (() => {
      const seller = onConfirmResponse?.["beckn:seller"] || cancelRequest?.["beckn:seller"];
      if (seller && typeof seller === 'object' && seller["@type"]) {
        // Remove locations (not in example)
        const { "beckn:locations": _, ...sellerWithoutLocations } = seller;
        return {
          ...sellerWithoutLocations,
          "beckn:descriptor": {
            "@type": "beckn:Descriptor",
            "schema:name": seller["beckn:descriptor"]?.["schema:name"] || "Grand Siam Hotel",
            "beckn:shortDesc": seller["beckn:descriptor"]?.["beckn:shortDesc"] || "Luxury hotel in the heart of Bangkok"
          }
        };
      }
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:Provider",
        "beckn:id": seller || "provider-grand-siam-hotel",
        "beckn:descriptor": {
          "@type": "beckn:Descriptor",
          "schema:name": "Grand Siam Hotel",
          "beckn:shortDesc": "Luxury hotel in the heart of Bangkok"
        }
      };
    })(),
    "beckn:buyer": cancelRequest?.["beckn:buyer"] || onConfirmResponse?.["beckn:buyer"], // From request first
    "beckn:orderItems": (onConfirmResponse?.["beckn:orderItems"] || cancelRequest?.["beckn:orderItems"] || []).map((item: any) => {
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": item?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": item?.["beckn:orderedItem"] || "item-hotel-grand-siam-deluxe",
        "beckn:acceptedOffer": item?.["beckn:acceptedOffer"] ? {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": item?.["beckn:acceptedOffer"]?.["beckn:id"] || "offer-grand-siam-deluxe-base",
          "beckn:descriptor": item?.["beckn:acceptedOffer"]?.["beckn:descriptor"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": "Deluxe Room with Breakfast - 5 Nights",
            "beckn:shortDesc": "Standard rate for 5 nights stay"
          },
          "beckn:price": item?.["beckn:acceptedOffer"]?.["beckn:price"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
            "schema:price": 120.00
          },
          "beckn:addOnItems": item?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || []
        } : {
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
            "schema:priceCurrency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
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
          "schema:priceCurrency": onConfirmResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
          "schema:price": 120.00
        },
        "beckn:orderItemAttributes": (() => {
          const attrs = item?.["beckn:orderItemAttributes"] || {};
          // Only include fields from example: hotelName, roomType, bedType, maxOccupancy, checkInTime, checkOutTime
          return {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelService/v1/context.jsonld",
            "@type": "beckn:HotelService",
            "hotel:hotelName": attrs["hotel:hotelName"] || "Grand Siam Hotel",
            "hotel:roomType": attrs["hotel:roomType"] || "Deluxe Room",
            "hotel:bedType": attrs["hotel:bedType"] || "King",
            "hotel:maxOccupancy": attrs["hotel:maxOccupancy"] || 2,
            "hotel:checkInTime": attrs["hotel:checkInTime"] || "14:00",
            "hotel:checkOutTime": attrs["hotel:checkOutTime"] || "12:00"
          };
        })()
      };
    }),
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
      "beckn:state": "CANCELLED", // Always system-generated
      "beckn:time": (() => {
        const initTime = onConfirmResponse?.["beckn:fulfillment"]?.["beckn:time"];
        // Remove duration field (not in example)
        if (initTime) {
          const { "beckn:duration": _, ...timeWithoutDuration } = initTime;
          return timeWithoutDuration;
        }
        return {
          "@type": "beckn:TimePeriod",
          "schema:startDate": "2025-12-10T14:00:00+07:00",
          "schema:endDate": "2025-12-15T12:00:00+07:00"
        };
      })()
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
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelBooking/v1/context.jsonld",
      "@type": "beckn:HotelBooking",
      "bookingId": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingId"] || "HBNK1025",
      "bookingReference": onConfirmResponse?.["beckn:orderAttributes"]?.["bookingReference"] || "GS-20251210-HBNK1025",
      "cancellationDate": new Date().toISOString(), // Always system-generated
      "refundAmount": parseFloat(refundAmount.toFixed(2)), // Always system-generated (calculated)
      "refundStatus": "PROCESSED" // Always system-generated
    }
  };
};

