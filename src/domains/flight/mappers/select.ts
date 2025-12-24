/**
 * Select mapper for Flight domain
 * Generates on_select response based on incoming select request and previous on_discover context
 * 
 * @param incomingMessage - Select request from BAP (contains user's selected flight item)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_discover response (catalog with all flights/offers)
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
  
  // Find the selected flight item from on_discover catalog
  const catalogItems = catalog?.["beckn:items"] || [];
  const selectedItem = catalogItems.find(
    (item: any) => item?.["beckn:id"] === selectedItemId
  ) || catalogItems[0];
  
  // Find matching offer from catalog
  const catalogOffers = catalog?.["beckn:offers"] || [];
  const selectedOffer = catalogOffers.find(
    (offer: any) => offer?.["beckn:items"]?.includes(selectedItemId)
  ) || catalogOffers[0];
  
  // Get quantity from request (default 1 for flights)
  const quantity = selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:quantity"] || 1;
  
  // Calculate orderValue dynamically
  // Handle both catalog format (currency/value) and response format (schema:priceCurrency/schema:price)
  const offerPrice = selectedOffer?.["beckn:price"];
  const itemPrice = selectedItem?.["beckn:price"];
  
  const basePrice = offerPrice?.["schema:price"] || offerPrice?.["value"] || 
                    itemPrice?.["schema:price"] || itemPrice?.["value"] || 280.00;
  const currency = offerPrice?.["schema:priceCurrency"] || offerPrice?.["currency"] || 
                   itemPrice?.["schema:priceCurrency"] || itemPrice?.["currency"] || "USD";
  
  // Calculate components
  const unitCost = basePrice * quantity;
  const airportFacilityCharges = 15.00; // Fixed fee
  const taxPercentage = 4.5; // Federal excise tax percentage
  const taxAmount = (unitCost * taxPercentage) / 100;
  const totalValue = unitCost + airportFacilityCharges + taxAmount;
  
  const components = [
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(unitCost.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Base fare (${quantity} × $${basePrice.toFixed(2)})`
    },
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "FEE",
      "beckn:value": parseFloat(airportFacilityCharges.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": "Airport facility charges"
    },
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "TAX",
      "beckn:value": parseFloat(taxAmount.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Federal excise tax (${taxPercentage}%)`
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
    "beckn:orderStatus": "QUOTE_PROVIDED", // Always system-generated
    "beckn:seller": selectedItem?.["beckn:provider"]?.["beckn:id"] || selectRequest?.["beckn:seller"] || "provider-delta-airlines",
    "beckn:orderItems": [
      {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": selectedItemId || selectedItem?.["beckn:id"] || "item-flight-dl145-economy",
        "beckn:quantity": quantity,
        "beckn:acceptedOffer": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": selectedOffer?.["beckn:id"] || `offer-${selectedItemId || "flight"}-base`,
          "beckn:descriptor": selectedOffer?.["beckn:descriptor"] ? {
            ...selectedOffer?.["beckn:descriptor"],
            "@context": selectedOffer?.["beckn:descriptor"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": selectedOffer?.["beckn:descriptor"]?.["@type"] || "beckn:Descriptor"
          } : {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": selectedItem?.["beckn:itemAttributes"]?.["flight:cabinClass"] === "ECONOMY" ? "Main Cabin Economy Fare" : "Premium Fare",
            "beckn:shortDesc": selectedItem?.["beckn:itemAttributes"]?.["flight:cabinClass"] === "ECONOMY" ? "Standard economy fare with carry-on bag included" : "Premium fare with enhanced amenities"
          },
          "beckn:price": {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": currency,
            "schema:price": basePrice
          },
          "beckn:addOnItems": [
            {
              "@type": "schema:Offer",
              "@id": "addon-item-checked-baggage",
              "schema:name": "Checked Baggage",
              "schema:description": "1 checked bag up to 23kg",
              "schema:price": {
                "@type": "schema:PriceSpecification",
                "schema:priceCurrency": "USD",
                "schema:price": 35.00
              }
            },
            {
              "@type": "schema:Offer",
              "@id": "addon-item-seat-selection",
              "schema:name": "Seat Selection",
              "schema:description": "Choose your preferred seat (Window seat 12A)",
              "schema:price": {
                "@type": "schema:PriceSpecification",
                "schema:priceCurrency": "USD",
                "schema:price": 25.00
              }
            },
            {
              "@type": "schema:Offer",
              "@id": "addon-item-travel-insurance",
              "schema:name": "Travel Insurance",
              "schema:description": "Trip cancellation and medical coverage",
              "schema:price": {
                "@type": "schema:PriceSpecification",
                "schema:priceCurrency": "USD",
                "schema:price": 25.00
              }
            }
          ]
        },
        "beckn:price": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": currency,
          "schema:price": basePrice
        },
        "beckn:orderItemAttributes": selectedItem?.["beckn:itemAttributes"] ? {
          ...selectedItem?.["beckn:itemAttributes"],
          "@context": selectedItem?.["beckn:itemAttributes"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightService/v1/context.jsonld",
          "@type": selectedItem?.["beckn:itemAttributes"]?.["@type"] || "beckn:FlightService"
        } : {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightService/v1/context.jsonld",
          "@type": "beckn:FlightService",
          "flight:flightNumber": "DL145",
          "flight:airline": "Delta Air Lines",
          "flight:airlineCode": "DL",
          "flight:cabinClass": "ECONOMY"
        }
      }
    ],
    "beckn:orderValue": orderValue, // Always generated dynamically, never from request
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": selectRequest?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-flight-${Date.now()}`,
      "beckn:mode": "FLIGHT",
      "beckn:status": "AVAILABLE" // Always system-generated
    }
  };
};

