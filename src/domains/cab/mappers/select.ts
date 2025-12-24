/**
 * Select mapper for Cab domain
 * Generates on_select response based on incoming select request and previous on_discover context
 * 
 * @param incomingMessage - Select request from BAP (contains user's selected cab item)
 * @param incomingContext - Request context
 * @param storedContext - Previous on_discover response (catalog with all cabs/offers)
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
  
  // Find the selected cab item from on_discover catalog
  const catalogItems = catalog?.["beckn:items"] || [];
  const selectedItem = catalogItems.find(
    (item: any) => item?.["beckn:id"] === selectedItemId
  ) || catalogItems[0];
  
  // Find matching offer from catalog
  const catalogOffers = catalog?.["beckn:offers"] || [];
  const selectedOffer = catalogOffers.find(
    (offer: any) => offer?.["beckn:items"]?.includes(selectedItemId)
  ) || catalogOffers[0];
  
  // Calculate orderValue dynamically
  const basePrice = selectedOffer?.["beckn:price"]?.["value"] || 
                    selectedItem?.["beckn:price"]?.["value"] || 18.00;
  const currency = selectedOffer?.["beckn:price"]?.["currency"] || 
                   selectedItem?.["beckn:price"]?.["currency"] || "USD";
  
  // Calculate components (base fare + service tax)
  const serviceTaxPercentage = 2.78; // Service tax percentage
  const taxAmount = (basePrice * serviceTaxPercentage) / 100;
  const totalValue = basePrice + taxAmount;
  
  const components = [
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(basePrice.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": "Base fare"
    },
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "TAX",
      "beckn:value": parseFloat(taxAmount.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Service tax (${serviceTaxPercentage}%)`
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

  // Get fulfillment details from select request
  const requestStart = selectRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"];
  const requestEnd = selectRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"];

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": selectRequest?.["beckn:id"] || `order-cab-${Date.now()}`,
    "beckn:orderStatus": "QUOTE_REQUESTED", // Always system-generated
    "beckn:seller": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": selectedItem?.["beckn:provider"]?.["beckn:id"] || selectRequest?.["beckn:seller"] || "provider-bangkok-cab-service",
      "beckn:descriptor": selectedItem?.["beckn:provider"]?.["beckn:descriptor"] || {
        "@type": "beckn:Descriptor",
        "schema:name": "Bangkok Cab Service",
        "beckn:shortDesc": "Reliable cab service in Bangkok"
      }
    },
    "beckn:orderItems": [
      {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": selectRequest?.["beckn:orderItems"]?.[0]?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": selectedItemId || selectedItem?.["beckn:id"] || "item-cab-sedan",
        "beckn:acceptedOffer": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": selectedOffer?.["beckn:id"] || `offer-${selectedItemId || "cab"}-base`,
          "beckn:descriptor": selectedOffer?.["beckn:descriptor"] ? {
            ...selectedOffer?.["beckn:descriptor"],
            "@context": selectedOffer?.["beckn:descriptor"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": selectedOffer?.["beckn:descriptor"]?.["@type"] || "beckn:Descriptor"
          } : {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": selectedItem?.["beckn:descriptor"]?.["schema:name"] || "Sedan Cab - Airport to Hotel",
            "beckn:shortDesc": "Standard sedan fare"
          },
          "beckn:price": {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": currency,
            "schema:price": basePrice
          }
        },
        "beckn:orderItemAttributes": (() => {
          const itemAttrs = selectedItem?.["beckn:itemAttributes"] || {};
          // Remove cancellationPolicy if present (not in example)
          const { "ride:cancellationPolicy": _, ...cleanAttrs } = itemAttrs;
          
          return {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
            "@type": "beckn:RideService",
            "ride:vehicleType": cleanAttrs["ride:vehicleType"] || "Sedan",
            "ride:vehicleCategory": cleanAttrs["ride:vehicleCategory"] || "Sedan",
            "ride:maxPassengers": cleanAttrs["ride:maxPassengers"] || 4,
            "ride:maxLuggage": cleanAttrs["ride:maxLuggage"] || 3,
            "ride:estimatedDistance": cleanAttrs["ride:estimatedDistance"] || 25,
            "ride:distanceUnit": cleanAttrs["ride:distanceUnit"] || "KM",
            "ride:estimatedDuration": cleanAttrs["ride:estimatedDuration"] || "PT40M",
            "ride:eta": cleanAttrs["ride:eta"] || "PT5M",
            "ride:amenities": cleanAttrs["ride:amenities"] || {
              "airConditioning": true,
              "wifi": true,
              "charger": true,
              "bottledWater": true
            }
          };
        })()
      }
    ],
    "beckn:orderValue": orderValue,
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": selectRequest?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-ride-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:status": "QUOTED",
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
        "@type": "beckn:RideDelivery",
        "ride:type": "ride",
        "ride:waitTime": selectedItem?.["beckn:itemAttributes"]?.["ride:eta"] || "PT5M", // Always system-generated
        "ride:start": requestStart ? {
          "@type": "beckn:FulfillmentPoint",
          "beckn:location": {
            "@type": "beckn:Location",
            "beckn:id": requestStart?.["beckn:location"]?.["beckn:id"] || "pickup-airport",
            "beckn:descriptor": requestStart?.["beckn:location"]?.["beckn:descriptor"] || {
              "@type": "beckn:Descriptor",
              "schema:name": "Suvarnabhumi Airport - Arrivals Hall"
            },
            "beckn:address": requestStart?.["beckn:location"]?.["beckn:address"] || {
              "@type": "schema:PostalAddress",
              "schema:streetAddress": "999 Moo 1, Nong Prue",
              "schema:addressLocality": "Bang Phli",
              "schema:addressRegion": "Samut Prakan",
              "schema:postalCode": "10540",
              "schema:addressCountry": "TH"
            },
            "beckn:geo": requestStart?.["beckn:location"]?.["beckn:geo"] || {
              "type": "Point",
              "coordinates": [100.7501, 13.6900]
            }
          },
          "beckn:time": requestStart?.["beckn:time"] || {
            "@type": "beckn:TimePeriod",
            "schema:startDate": "2025-12-10T10:00:00+07:00"
          }
        } : {
          "@type": "beckn:FulfillmentPoint",
          "beckn:location": {
            "@type": "beckn:Location",
            "beckn:id": "pickup-airport",
            "beckn:descriptor": {
              "@type": "beckn:Descriptor",
              "schema:name": "Suvarnabhumi Airport - Arrivals Hall"
            },
            "beckn:address": {
              "@type": "schema:PostalAddress",
              "schema:streetAddress": "999 Moo 1, Nong Prue",
              "schema:addressLocality": "Bang Phli",
              "schema:addressRegion": "Samut Prakan",
              "schema:postalCode": "10540",
              "schema:addressCountry": "TH"
            },
            "beckn:geo": {
              "type": "Point",
              "coordinates": [100.7501, 13.6900]
            }
          },
          "beckn:time": {
            "@type": "beckn:TimePeriod",
            "schema:startDate": "2025-12-10T10:00:00+07:00"
          }
        },
        "ride:end": requestEnd ? {
          "@type": "beckn:FulfillmentPoint",
          "beckn:location": {
            "@type": "beckn:Location",
            "beckn:id": requestEnd?.["beckn:location"]?.["beckn:id"] || "dropoff-hotel",
            "beckn:descriptor": requestEnd?.["beckn:location"]?.["beckn:descriptor"] || {
              "@type": "beckn:Descriptor",
              "schema:name": "Grand Siam Hotel"
            },
            "beckn:address": requestEnd?.["beckn:location"]?.["beckn:address"] || {
              "@type": "schema:PostalAddress",
              "schema:streetAddress": "123 Sukhumvit Road",
              "schema:addressLocality": "Khlong Toei",
              "schema:addressRegion": "Bangkok",
              "schema:postalCode": "10110",
              "schema:addressCountry": "TH"
            },
            "beckn:geo": requestEnd?.["beckn:location"]?.["beckn:geo"] || {
              "type": "Point",
              "coordinates": [100.5698, 13.7563]
            }
          }
        } : {
          "@type": "beckn:FulfillmentPoint",
          "beckn:location": {
            "@type": "beckn:Location",
            "beckn:id": "dropoff-hotel",
            "beckn:descriptor": {
              "@type": "beckn:Descriptor",
              "schema:name": "Grand Siam Hotel"
            },
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
        }
      }
    }
  };
};

