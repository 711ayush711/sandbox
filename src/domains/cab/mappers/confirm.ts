/**
 * Confirm mapper for Cab domain
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
  const bookingId = `RIDE-BKK-${Date.now().toString().slice(-10)}`;
  const bookingReference = `BCS-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onInitResponse?.["beckn:id"] || `order-cab-${Date.now()}`,
    "beckn:orderStatus": "CONFIRMED", // Always system-generated
    "beckn:seller": (() => {
      const seller = onInitResponse?.["beckn:seller"] || confirmRequest?.["beckn:seller"];
      if (seller && typeof seller === 'object' && seller["@type"]) {
        // Ensure descriptor has telephone and email
        return {
          ...seller,
          "beckn:descriptor": {
            ...seller["beckn:descriptor"],
            "schema:telephone": seller["beckn:descriptor"]?.["schema:telephone"] || "+66 2 555 1234",
            "schema:email": seller["beckn:descriptor"]?.["schema:email"] || "support@bangkokcabs.com"
          }
        };
      }
      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:Provider",
        "beckn:id": seller || "provider-bangkok-cab-service",
        "beckn:descriptor": {
          "@type": "beckn:Descriptor",
          "schema:name": "Bangkok Cab Service",
          "beckn:shortDesc": "Reliable cab service in Bangkok",
          "schema:telephone": "+66 2 555 1234",
          "schema:email": "support@bangkokcabs.com"
        }
      };
    })(),
    "beckn:buyer": confirmRequest?.["beckn:buyer"] || onInitResponse?.["beckn:buyer"], // From request first
    "beckn:orderItems": (onInitResponse?.["beckn:orderItems"] || confirmRequest?.["beckn:orderItems"] || []).map((item: any, index: number) => {
      const requestItem = confirmRequest?.["beckn:orderItems"]?.[index];
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
            "schema:priceCurrency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
            "schema:price": onInitResponse?.["beckn:orderValue"]?.["beckn:components"]?.[0]?.["beckn:value"] || 18.00
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
            "schema:priceCurrency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
            "schema:price": onInitResponse?.["beckn:orderValue"]?.["beckn:components"]?.[0]?.["beckn:value"] || 18.00
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
    "beckn:orderValue": onInitResponse?.["beckn:orderValue"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": "USD",
      "schema:price": 18.50,
      "beckn:components": []
    }, // Always from previous on_init (preserves context URL from previous), never from request
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:type": "POST_FULFILLMENT", // Always system-generated
      "beckn:status": "NOT_PAID", // Always system-generated
      "beckn:amount": {
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
        "schema:price": onInitResponse?.["beckn:orderValue"]?.["schema:price"] || 18.50
      },
      "beckn:params": {
        "currency": onInitResponse?.["beckn:orderValue"]?.["schema:priceCurrency"] || "USD",
        "amount": (onInitResponse?.["beckn:orderValue"]?.["schema:price"] || 18.50).toString()
      }
    },
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": onInitResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-ride-${Date.now()}`,
      "beckn:mode": "RESERVATION",
      "beckn:status": "CONFIRMED", // Always system-generated
      "beckn:deliveryAttributes": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideService/v1/context.jsonld",
        "@type": "beckn:RideDelivery",
        "ride:type": "ride",
        "ride:state": "DRIVER_ASSIGNED", // Always system-generated
        "ride:waitTime": onInitResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:waitTime"] || "PT5M",
        "ride:authorization": {
          "@type": "beckn:Authorization",
          "beckn:type": "OTP",
          "beckn:token": Math.floor(1000 + Math.random() * 9000).toString() // Always system-generated (4-digit OTP)
        },
        "ride:agent": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Agent",
          "beckn:id": `driver-${Date.now()}`,
          "schema:name": "Somchai K.",
          "schema:telephone": "+66 987 654 321",
          "beckn:rating": {
            "@type": "beckn:Rating",
            "beckn:ratingValue": 4.8,
            "beckn:ratingCount": 1247
          }
        }, // Always system-generated
        "ride:vehicle": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Vehicle",
          "beckn:id": `vehicle-${Date.now()}`,
          "beckn:descriptor": {
            "@type": "beckn:Descriptor",
            "schema:name": "Toyota Camry",
            "beckn:code": "BKK-1234"
          },
          "beckn:category": "Sedan",
          "beckn:color": "Black",
          "beckn:registrationNumber": "BKK-1234"
        }, // Always system-generated
        "ride:start": (() => {
          const initStart = onInitResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"];
          const requestStart = confirmRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:start"];
          const buyer = confirmRequest?.["beckn:buyer"] || onInitResponse?.["beckn:buyer"];
          
          return {
            "@type": "beckn:FulfillmentPoint",
            "beckn:location": {
              "@type": "beckn:Location",
              "beckn:id": requestStart?.["beckn:location"]?.["beckn:id"] || initStart?.["beckn:location"]?.["beckn:id"] || "pickup-airport",
              "beckn:descriptor": requestStart?.["beckn:location"]?.["beckn:descriptor"] || initStart?.["beckn:location"]?.["beckn:descriptor"] || {
                "@type": "beckn:Descriptor",
                "schema:name": "Suvarnabhumi Airport - Arrivals Hall"
              },
              "beckn:address": requestStart?.["beckn:location"]?.["beckn:address"] || initStart?.["beckn:location"]?.["beckn:address"] || {
                "@type": "schema:PostalAddress",
                "schema:streetAddress": "999 Moo 1, Nong Prue",
                "schema:addressLocality": "Bang Phli",
                "schema:addressRegion": "Samut Prakan",
                "schema:postalCode": "10540",
                "schema:addressCountry": "TH"
              },
              "beckn:geo": requestStart?.["beckn:location"]?.["beckn:geo"] || initStart?.["beckn:location"]?.["beckn:geo"] || {
                "type": "Point",
                "coordinates": [100.7501, 13.6900]
              }
            },
            "beckn:time": requestStart?.["beckn:time"] || initStart?.["beckn:time"] || {
              "@type": "beckn:TimePeriod",
              "schema:startDate": "2025-12-10T10:00:00+07:00"
            },
            "beckn:contact": requestStart?.["beckn:contact"] || initStart?.["beckn:contact"] || (buyer ? {
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
          const initEnd = onInitResponse?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"];
          const requestEnd = confirmRequest?.["beckn:fulfillment"]?.["beckn:deliveryAttributes"]?.["ride:end"];
          
          return {
            "@type": "beckn:FulfillmentPoint",
            "beckn:location": {
              "@type": "beckn:Location",
              "beckn:id": requestEnd?.["beckn:location"]?.["beckn:id"] || initEnd?.["beckn:location"]?.["beckn:id"] || "dropoff-hotel",
              "beckn:descriptor": requestEnd?.["beckn:location"]?.["beckn:descriptor"] || initEnd?.["beckn:location"]?.["beckn:descriptor"] || {
                "@type": "beckn:Descriptor",
                "schema:name": "Grand Siam Hotel"
              },
              "beckn:address": requestEnd?.["beckn:location"]?.["beckn:address"] || initEnd?.["beckn:location"]?.["beckn:address"] || {
                "@type": "schema:PostalAddress",
                "schema:streetAddress": "123 Sukhumvit Road",
                "schema:addressLocality": "Khlong Toei",
                "schema:addressRegion": "Bangkok",
                "schema:postalCode": "10110",
                "schema:addressCountry": "TH"
              },
              "beckn:geo": requestEnd?.["beckn:location"]?.["beckn:geo"] || initEnd?.["beckn:location"]?.["beckn:geo"] || {
                "type": "Point",
                "coordinates": [100.5698, 13.7563]
              }
            }
          };
        })()
      }
    },
    "beckn:orderAttributes": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/RideBooking/v1/context.jsonld",
      "@type": "beckn:RideBooking",
      "bookingId": bookingId, // Always system-generated
      "bookingReference": bookingReference, // Always system-generated
      "rideStatus": "DRIVER_ASSIGNED", // Always system-generated
      "estimatedArrivalTime": new Date(Date.now() + 5 * 60 * 1000).toISOString() // Always system-generated (5 minutes from now)
    }
  };
};

