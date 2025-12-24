/**
 * Init mapper for Hotel domain
 * Generates on_init response based on incoming init request and previous on_select context
 * 
 * @param incomingMessage - Init request from BAP (contains buyer details, payment, fulfillment)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_select response (order items with details)
 */
export const onInitMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const initRequest = incomingMessage?.order;
  const onSelectResponse = storedContext?.previousResponse?.message?.order;

  const baseOrderValue = onSelectResponse?.["beckn:orderValue"];
  const selectedItem = onSelectResponse?.["beckn:orderItems"]?.[0];
  const nights = selectedItem?.["beckn:quantity"]?.["schema:value"] || 
                 selectedItem?.["beckn:quantity"] || 5;
  const quantity = typeof nights === 'number' ? nights : nights?.["schema:value"] || 5;

  // Get add-on items from init request (user selected add-ons) or from on_select response
  const selectedAddOns = (initRequest?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [])
    .map((addon: any) => {
      const matchingAddon = selectedItem?.["beckn:acceptedOffer"]?.["beckn:addOnItems"]?.find(
        (item: any) => item?.["@id"] === addon?.["@id"] || item?.["@id"] === addon
      );
      return matchingAddon || addon;
    });

  const addOnsTotal = selectedAddOns.reduce((sum: number, addon: any) => {
    const addonPrice = typeof addon?.["schema:price"] === 'number' 
      ? addon?.["schema:price"]
      : addon?.["schema:price"]?.["schema:price"] || 0;
    return sum + (typeof addonPrice === 'number' ? addonPrice : 0);
  }, 0);

  // Recalculate orderValue with add-ons
  const roomCharges = baseOrderValue?.["beckn:components"]?.[0]?.["beckn:value"] || 
                      (baseOrderValue?.["schema:price"] || 672.00) - (baseOrderValue?.["beckn:components"]?.[1]?.["beckn:value"] || 30.00) - (baseOrderValue?.["beckn:components"]?.[2]?.["beckn:value"] || 42.00);
  const currency = baseOrderValue?.["schema:priceCurrency"] || "USD";
  const serviceCharge = 30.00;
  const vatPercentage = 7;
  const subtotalForVAT = roomCharges + addOnsTotal + serviceCharge;
  const vatAmount = (subtotalForVAT * vatPercentage) / 100;
  const totalValue = roomCharges + addOnsTotal + serviceCharge + vatAmount;

  const components = [
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(roomCharges.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Room charges (${quantity} nights × $${roomCharges / quantity})`
    }
  ];

  if (addOnsTotal > 0) {
    const addOnNames = selectedAddOns.map((addon: any) => addon?.["schema:name"]).filter(Boolean).join(" + ");
    components.push({
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(addOnsTotal.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": addOnNames ? `Add-ons (${addOnNames})` : "Add-ons"
    });
  }

  components.push(
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "FEE",
      "beckn:value": parseFloat(serviceCharge.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": "Service charge"
    },
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "TAX",
      "beckn:value": parseFloat(vatAmount.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `VAT (${vatPercentage}%)`
    }
  );

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onSelectResponse?.["beckn:id"] || initRequest?.["beckn:id"] || `order-hotel-${Date.now()}`,
    "beckn:orderStatus": "INITIALIZED", // Always system-generated
    "beckn:seller": onSelectResponse?.["beckn:seller"] || initRequest?.["beckn:seller"] || {
      "@context": onSelectResponse?.["beckn:seller"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-grand-siam-hotel"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": initRequest?.["beckn:buyer"] || onSelectResponse?.["beckn:buyer"], // From request first, then previous
    "beckn:orderItems": (onSelectResponse?.["beckn:orderItems"] || initRequest?.["beckn:orderItems"] || []).map((item: any, index: number) => {
      const requestItem = initRequest?.["beckn:orderItems"]?.[index];
      const selectedAddOnIds = requestItem?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];
      const allAddOns = item?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];
      
      // Filter add-ons to only include selected ones (by @id)
      const filteredAddOns = selectedAddOnIds.length > 0 
        ? allAddOns.filter((addon: any) => 
            selectedAddOnIds.some((id: any) => 
              (typeof id === 'string' ? id : id?.["@id"]) === addon?.["@id"]
            )
          )
        : [];
      
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
            "schema:priceCurrency": currency,
            "schema:price": roomCharges / quantity
          },
          "beckn:addOnItems": filteredAddOns
        },
        "beckn:quantity": item?.["beckn:quantity"] || requestItem?.["beckn:quantity"] || {
          "@type": "schema:QuantitativeValue",
          "schema:value": quantity,
          "schema:unitCode": "NIGHTS"
        },
        "beckn:price": item?.["beckn:price"] || {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": currency,
          "schema:price": roomCharges / quantity
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
    "beckn:orderValue": {
      "@context": onSelectResponse?.["beckn:orderValue"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": currency,
      "schema:price": parseFloat(totalValue.toFixed(2)),
      "beckn:components": components
    }, // Recalculate with add-ons (preserves context URL from previous on_select)
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "PRE_FULFILLMENT", // Always system-generated
      "beckn:status": "NOT_PAID", // Always system-generated
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": currency,
        "schema:price": parseFloat(totalValue.toFixed(2))
      },
      "beckn:params": {
        "currency": currency,
        "amount": parseFloat(totalValue.toFixed(2)).toString()
      }
    },
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": initRequest?.["beckn:fulfillment"]?.["beckn:id"] || onSelectResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-hotel-${Date.now()}`,
      "beckn:type": "hotel_stay",
      "beckn:time": (() => {
        const selectTime = onSelectResponse?.["beckn:fulfillment"]?.["beckn:time"];
        const requestTime = initRequest?.["beckn:fulfillment"]?.["beckn:time"];
        return {
          "@type": "beckn:TimePeriod",
          "schema:startDate": requestTime?.["schema:startDate"] || selectTime?.["schema:startDate"] || "2025-12-10T14:00:00+07:00",
          "schema:endDate": requestTime?.["schema:endDate"] || selectTime?.["schema:endDate"] || "2025-12-15T12:00:00+07:00",
          "beckn:duration": requestTime?.["beckn:duration"] || selectTime?.["beckn:duration"] || `P${quantity}D`
        };
      })()
    },
    "beckn:orderAttributes": initRequest?.["beckn:orderAttributes"] || onSelectResponse?.["beckn:orderAttributes"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelBooking/v1/context.jsonld",
      "@type": "beckn:HotelBooking",
      "guests": []
    }
  };
};

