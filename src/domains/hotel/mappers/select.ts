/**
 * Select mapper for Hotel domain
 * Generates on_select response based on incoming select request and previous on_discover context
 * 
 * @param incomingMessage - Select request from BAP (contains user's selected hotel item)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_discover response (catalog with all hotels/offers)
 */
export const onSelectMapper = (
  incomingMessage: any,
  incomingContext: any,
  storedContext: any
): any => {
  const selectRequest = incomingMessage?.order;
  const onDiscoverResponse = storedContext?.previousResponse;
  const catalog = onDiscoverResponse?.message?.catalogs?.[0];
  
  // Get selected item ID from the select request
  const selectedItemId = selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:orderedItem"];
  
  // Find the selected hotel item from on_discover catalog
  const catalogItems = catalog?.["beckn:items"] || [];
  const selectedItem = catalogItems.find(
    (item: any) => item?.["beckn:id"] === selectedItemId
  ) || catalogItems[0];
  
  // Find matching offer from catalog
  const catalogOffers = catalog?.["beckn:offers"] || [];
  const selectedOffer = catalogOffers.find(
    (offer: any) => offer?.["beckn:items"]?.includes(selectedItemId)
  ) || catalogOffers[0];
  
  // Get quantity (nights) from request
  const nights = selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:quantity"]?.["schema:value"] || 
                 selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:quantity"] || 5;
  const quantity = typeof nights === 'number' ? nights : nights?.["schema:value"] || 5;
  
  // Calculate orderValue dynamically
  const pricePerNight = selectedOffer?.["beckn:price"]?.["schema:price"] || 
                        selectedItem?.["beckn:price"]?.["schema:price"] || 120.00;
  const currency = selectedOffer?.["beckn:price"]?.["schema:priceCurrency"] || 
                   selectedItem?.["beckn:price"]?.["schema:priceCurrency"] || "USD";
  
  // Calculate components (room charges + service charge + VAT)
  const roomCharges = pricePerNight * quantity;
  const serviceCharge = 30.00; // Fixed service charge
  const vatPercentage = 7; // VAT percentage
  const vatAmount = ((roomCharges + serviceCharge) * vatPercentage) / 100;
  const totalValue = roomCharges + serviceCharge + vatAmount;
  
  const components = [
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(roomCharges.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Room charges (${quantity} nights × $${pricePerNight})`
    },
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
  ];
  
  // Generate orderValue dynamically - never use from request
  const orderValue = {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "schema:PriceSpecification",
    "schema:priceCurrency": currency,
    "schema:price": parseFloat(totalValue.toFixed(2)),
    "beckn:components": components
  };

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": selectRequest?.["beckn:id"] || `order-hotel-${Date.now()}`,
    "beckn:orderStatus": "QUOTE_REQUESTED", // Always system-generated
    "beckn:seller": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": selectedItem?.["beckn:provider"]?.["beckn:id"] || selectRequest?.["beckn:seller"] || "provider-grand-siam-hotel",
      "beckn:descriptor": selectedItem?.["beckn:provider"]?.["beckn:descriptor"] || {
        "@type": "beckn:Descriptor",
        "schema:name": "Grand Siam Hotel",
        "beckn:shortDesc": "Luxury hotel in the heart of Bangkok"
      }
    },
    "beckn:orderItems": [
      {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": selectedItemId || selectedItem?.["beckn:id"] || "item-hotel-grand-siam-deluxe",
        "beckn:acceptedOffer": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": selectedOffer?.["beckn:id"] || `offer-${selectedItemId || "hotel"}-base`,
          "beckn:descriptor": selectedOffer?.["beckn:descriptor"] ? {
            ...selectedOffer?.["beckn:descriptor"],
            "@context": selectedOffer?.["beckn:descriptor"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": selectedOffer?.["beckn:descriptor"]?.["@type"] || "beckn:Descriptor"
          } : {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": `Deluxe Room with Breakfast - ${quantity} Nights`,
            "beckn:shortDesc": "Standard rate for 5 nights stay"
          },
          "beckn:price": {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": currency,
            "schema:price": pricePerNight
          },
          "beckn:addOnItems": selectedOffer?.["beckn:addOnItems"] || [
            {
              "@type": "schema:Offer",
              "@id": "addon-item-late-checkout",
              "schema:name": "Late Check-out",
              "schema:description": "Check-out at 6:00 PM instead of 12:00 PM",
              "schema:price": {
                "@type": "schema:PriceSpecification",
                "schema:priceCurrency": currency,
                "schema:price": 30.00
              }
            },
            {
              "@type": "schema:Offer",
              "@id": "addon-item-airport-transfer",
              "schema:name": "Airport Transfer",
              "schema:description": "One-way airport pickup service",
              "schema:price": {
                "@type": "schema:PriceSpecification",
                "schema:priceCurrency": currency,
                "schema:price": 45.00
              }
            },
            {
              "@type": "schema:Offer",
              "@id": "addon-item-spa-package",
              "schema:name": "Spa Package",
              "schema:description": "60-minute Thai massage at hotel spa",
              "schema:price": {
                "@type": "schema:PriceSpecification",
                "schema:priceCurrency": currency,
                "schema:price": 50.00
              }
            }
          ]
        },
        "beckn:quantity": selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:quantity"] || {
          "@type": "schema:QuantitativeValue",
          "schema:value": quantity,
          "schema:unitCode": "NIGHTS"
        },
        "beckn:price": selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:price"] || {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": currency,
          "schema:price": pricePerNight
        },
        "beckn:orderItemAttributes": (() => {
          const itemAttrs = selectedItem?.["beckn:itemAttributes"] || {};
          // Remove fields not in example (cancellationPolicy, hotelChain, starRating)
          const { "hotel:cancellationPolicy": _, "hotel:hotelChain": __, "hotel:starRating": ___, ...cleanAttrs } = itemAttrs;
          
          return {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/HotelService/v1/context.jsonld",
            "@type": "beckn:HotelService",
            "hotel:hotelName": cleanAttrs["hotel:hotelName"] || "Grand Siam Hotel",
            "hotel:roomType": cleanAttrs["hotel:roomType"] || "Deluxe Room",
            "hotel:bedType": cleanAttrs["hotel:bedType"] || "King",
            "hotel:maxOccupancy": cleanAttrs["hotel:maxOccupancy"] || 2,
            "hotel:roomSize": cleanAttrs["hotel:roomSize"] || 35,
            "hotel:roomSizeUnit": cleanAttrs["hotel:roomSizeUnit"] || "SQM",
            "hotel:viewType": cleanAttrs["hotel:viewType"] || "City View",
            "hotel:checkInTime": cleanAttrs["hotel:checkInTime"] || "14:00",
            "hotel:checkOutTime": cleanAttrs["hotel:checkOutTime"] || "12:00",
            "hotel:amenities": cleanAttrs["hotel:amenities"] || {
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
          };
        })()
      }
    ],
    "beckn:orderValue": orderValue, // Always generated dynamically, never from request
      "beckn:fulfillment": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:Fulfillment",
        "beckn:id": selectRequest?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-hotel-${Date.now()}`,
        "beckn:type": "hotel_stay",
        "beckn:time": (() => {
          const requestTime = selectRequest?.["beckn:fulfillment"]?.["beckn:time"];
          return {
            "@type": "beckn:TimePeriod",
            "schema:startDate": requestTime?.["schema:startDate"] || "2025-12-10T14:00:00+07:00",
            "schema:endDate": requestTime?.["schema:endDate"] || "2025-12-15T12:00:00+07:00",
            "beckn:duration": requestTime?.["beckn:duration"] || `P${quantity}D`
          };
        })()
      }
  };
};

