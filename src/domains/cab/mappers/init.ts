/**
 * Init mapper for Cab domain
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

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onSelectResponse?.["beckn:id"] || initRequest?.["beckn:id"] || `order-cab-${Date.now()}`,
    "beckn:orderStatus": "INITIALIZED", // Always system-generated
    "beckn:seller": onSelectResponse?.["beckn:seller"] || initRequest?.["beckn:seller"] || {
      "@context": onSelectResponse?.["beckn:seller"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-bangkok-cab-service",
      "beckn:descriptor": {
        "@type": "beckn:Descriptor",
        "schema:name": "Bangkok Cab Service",
        "beckn:shortDesc": "Reliable cab service in Bangkok"
      }
    }, // Preserve context URL from previous if exists
    "beckn:buyer": initRequest?.["beckn:buyer"] || onSelectResponse?.["beckn:buyer"], // From request first, then previous
    "beckn:orderItems": (onSelectResponse?.["beckn:orderItems"] || initRequest?.["beckn:orderItems"] || []).map((item: any, index: number) => {
      const requestItem = initRequest?.["beckn:orderItems"]?.[index];
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": item?.["beckn:lineId"] || requestItem?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": item?.["beckn:orderedItem"] || requestItem?.["beckn:orderedItem"] || "item-cab-sedan",
        "beckn:acceptedOffer": item?.["beckn:acceptedOffer"] ? {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": item?.["beckn:acceptedOffer"]?.["beckn:id"] || requestItem?.["beckn:acceptedOffer"]?.["beckn:id"] || "offer-sedan-base",
          "beckn:descriptor": item?.["beckn:acceptedOffer"]?.["beckn:descriptor"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": "Sedan Cab - Airport to Hotel",
            "beckn:shortDesc": "Standard sedan fare"
          },
          "beckn:price": item?.["beckn:acceptedOffer"]?.["beckn:price"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": onSelectResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
            "schema:price": onSelectResponse?.["beckn:orderValue"]?.["beckn:components"]?.[0]?.["beckn:value"] || 18.00
          }
        } : {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": requestItem?.["beckn:acceptedOffer"]?.["beckn:id"] || "offer-sedan-base",
          "beckn:descriptor": {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": "Sedan Cab - Airport to Hotel",
            "beckn:shortDesc": "Standard sedan fare"
          },
          "beckn:price": {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": onSelectResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
            "schema:price": onSelectResponse?.["beckn:orderValue"]?.["beckn:components"]?.[0]?.["beckn:value"] || 18.00
          }
        },
        "beckn:orderItemAttributes": item?.["beckn:orderItemAttributes"] || {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
          "@type": "beckn:RideService",
          "ride:vehicleType": "Sedan",
          "ride:vehicleCategory": "Sedan",
          "ride:maxPassengers": 4,
          "ride:maxLuggage": 3,
          "ride:estimatedDistance": 25,
          "ride:distanceUnit": "KM",
          "ride:estimatedDuration": "PT40M",
          "ride:eta": "PT5M",
          "ride:amenities": {
            "airConditioning": true,
            "wifi": true,
            "charger": true,
            "bottledWater": true
          }
        }
      };
    }),
    "beckn:orderValue": onSelectResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 18.50,
      "beckn:components": []
    }, // Always from previous on_select (preserves context URL from previous), never from request
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "POST_FULFILLMENT", // Always system-generated
      "beckn:status": "NOT_PAID", // Always system-generated
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": onSelectResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
        "schema:price": onSelectResponse?.["beckn:orderValue"]?.["schema:price"] || 18.50
      },
      "beckn:params": {
        "currency": onSelectResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
        "amount": (onSelectResponse?.["beckn:orderValue"]?.["schema:price"] || 18.50).toString()
      }
    },
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": initRequest?.["beckn:fulfillment"]?.["beckn:id"] || onSelectResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-ride-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:status": "PENDING", // Always system-generated
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
        "@type": "beckn:RideDelivery",
        "ride:type": "ride",
        "ride:waitTime": onSelectResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:waitTime"] || "PT5M",
        "ride:start": (() => {
          const selectStart = onSelectResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"];
          const requestStart = initRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"];
          const buyer = initRequest?.["beckn:buyer"];
          
          return {
            "@type": "beckn:FulfillmentPoint",
            "beckn:location": {
              "@type": "beckn:Location",
              "beckn:id": requestStart?.["beckn:location"]?.["beckn:id"] || selectStart?.["beckn:location"]?.["beckn:id"] || "pickup-airport",
              "beckn:descriptor": requestStart?.["beckn:location"]?.["beckn:descriptor"] || selectStart?.["beckn:location"]?.["beckn:descriptor"] || {
                "@type": "beckn:Descriptor",
                "schema:name": "Suvarnabhumi Airport - Arrivals Hall"
              },
              "beckn:address": requestStart?.["beckn:location"]?.["beckn:address"] || selectStart?.["beckn:location"]?.["beckn:address"] || {
                "@type": "schema:PostalAddress",
                "schema:streetAddress": "999 Moo 1, Nong Prue",
                "schema:addressLocality": "Bang Phli",
                "schema:addressRegion": "Samut Prakan",
                "schema:postalCode": "10540",
                "schema:addressCountry": "TH"
              },
              "beckn:geo": requestStart?.["beckn:location"]?.["beckn:geo"] || selectStart?.["beckn:location"]?.["beckn:geo"] || {
                "type": "Point",
                "coordinates": [100.7501, 13.6900]
              }
            },
            "beckn:time": requestStart?.["beckn:time"] || selectStart?.["beckn:time"] || {
              "@type": "beckn:TimePeriod",
              "schema:startDate": "2025-12-10T10:00:00+07:00"
            },
            "beckn:contact": requestStart?.["beckn:contact"] || (buyer && (buyer?.["schema:name"] || buyer?.["schema:telephone"] || buyer?.["schema:email"]) ? {
              "@type": "beckn:Contact",
              "schema:name": buyer?.["schema:name"],
              "schema:telephone": buyer?.["schema:telephone"],
              "schema:email": buyer?.["schema:email"]
            } : {
              "@type": "beckn:Contact",
              "schema:name": "Sarah Johnson",
              "schema:telephone": "+1 555 123 4567",
              "schema:email": "sarah.johnson@example.com"
            })
          };
        })(),
        "ride:end": (() => {
          const selectEnd = onSelectResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"];
          const requestEnd = initRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"];
          
          return {
            "@type": "beckn:FulfillmentPoint",
            "beckn:location": {
              "@type": "beckn:Location",
              "beckn:id": requestEnd?.["beckn:location"]?.["beckn:id"] || selectEnd?.["beckn:location"]?.["beckn:id"] || "dropoff-hotel",
              "beckn:descriptor": requestEnd?.["beckn:location"]?.["beckn:descriptor"] || selectEnd?.["beckn:location"]?.["beckn:descriptor"] || {
                "@type": "beckn:Descriptor",
                "schema:name": "Grand Siam Hotel"
              },
              "beckn:address": requestEnd?.["beckn:location"]?.["beckn:address"] || selectEnd?.["beckn:location"]?.["beckn:address"] || {
                "@type": "schema:PostalAddress",
                "schema:streetAddress": "123 Sukhumvit Road",
                "schema:addressLocality": "Khlong Toei",
                "schema:addressRegion": "Bangkok",
                "schema:postalCode": "10110",
                "schema:addressCountry": "TH"
              },
              "beckn:geo": requestEnd?.["beckn:location"]?.["beckn:geo"] || selectEnd?.["beckn:location"]?.["beckn:geo"] || {
                "type": "Point",
                "coordinates": [100.5698, 13.7563]
              }
            }
          };
        })()
      }
    }
  };
};

