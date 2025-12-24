/**
 * Init mapper for Flight domain
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

  // Calculate orderValue with add-ons
  const basePrice = onSelectResponse?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:price"]?.["schema:price"] || 280.00;
  const currency = onSelectResponse?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:price"]?.["schema:priceCurrency"] || "USD";
  const quantity = onSelectResponse?.["beckn:orderItems"]?.[0]?.["beckn:quantity"] || 1;

  // Get add-on items from init request (user selected add-ons) or from on_select response
  // Init request may have addOnItems with only @id, so we need to expand them from on_select
  const initAddOnIds = initRequest?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];
  const selectAddOnItems = onSelectResponse?.["beckn:orderItems"]?.[0]?.["beckn:acceptedOffer"]?.["beckn:addOnItems"] || [];

  // Default add-on details (used when not found in on_select)
  const defaultAddOns: any = {
    "addon-item-checked-baggage": {
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
    "addon-item-seat-selection": {
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
    "addon-item-travel-insurance": {
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
  };

  // Map init request addOn IDs to full addOn items from on_select or use defaults
  const expandedAddOnItems = initAddOnIds.map((initAddOn: any) => {
    const addOnId = initAddOn?.["@id"];
    const fullAddOn = selectAddOnItems.find((item: any) => item?.["@id"] === addOnId);
    return fullAddOn || defaultAddOns[addOnId] || initAddOn; // Use full details if found, otherwise use default or init addOn
  });

  // If no addOns in init request, use all from on_select
  const addOnItems = expandedAddOnItems.length > 0 ? expandedAddOnItems : selectAddOnItems;

  // Get base components from on_select response
  const selectComponents = onSelectResponse?.["beckn:orderValue"]?.["beckn:components"] || [];
  
  // Extract base fare, fee, and tax from on_select components
  const baseFareComponent = selectComponents.find((comp: any) => comp?.["beckn:type"] === "UNIT" && comp?.["beckn:description"]?.includes("Base fare"));
  const feeComponent = selectComponents.find((comp: any) => comp?.["beckn:type"] === "FEE");
  const taxComponent = selectComponents.find((comp: any) => comp?.["beckn:type"] === "TAX");
  
  const unitCost = baseFareComponent?.["beckn:value"] || basePrice * quantity;
  const airportFacilityCharges = feeComponent?.["beckn:value"] || 15.00;
  const taxPercentage = 4.5;
  
  // Calculate add-on prices from selected add-ons
  const checkedBaggagePrice = addOnItems.find((item: any) => item?.["@id"] === "addon-item-checked-baggage")?.["schema:price"]?.["schema:price"] || 0;
  const seatSelectionPrice = addOnItems.find((item: any) => item?.["@id"] === "addon-item-seat-selection")?.["schema:price"]?.["schema:price"] || 0;
  const travelInsurancePrice = addOnItems.find((item: any) => item?.["@id"] === "addon-item-travel-insurance")?.["schema:price"]?.["schema:price"] || 0;
  
  const addOnsTotal = checkedBaggagePrice + seatSelectionPrice + travelInsurancePrice;
  
  // Recalculate tax based on new total (base + add-ons)
  const taxAmount = ((unitCost + addOnsTotal) * taxPercentage) / 100;
  const totalValue = unitCost + addOnsTotal + airportFacilityCharges + taxAmount;

  // Start with base fare component from on_select
  const components = [
    baseFareComponent || {
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(unitCost.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Base fare (${quantity} × $${basePrice.toFixed(2)})`
    }
  ];

  // Add add-on components (only if selected in init request)
  if (checkedBaggagePrice > 0) {
    components.push({
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(checkedBaggagePrice.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": "Checked baggage"
    });
  }

  if (seatSelectionPrice > 0) {
    components.push({
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(seatSelectionPrice.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": "Seat selection"
    });
  }

  if (travelInsurancePrice > 0) {
    components.push({
      "@type": "beckn:PriceComponent",
      "beckn:type": "UNIT",
      "beckn:value": parseFloat(travelInsurancePrice.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": "Travel insurance"
    });
  }

  // Add fee and recalculated tax from on_select structure
  components.push(
    feeComponent || {
      "@type": "beckn:PriceComponent",
      "beckn:type": "FEE",
      "beckn:value": parseFloat(airportFacilityCharges.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": "Airport facility charges"
    },
    taxComponent || 
    {
      "@type": "beckn:PriceComponent",
      "beckn:type": "TAX",
      "beckn:value": parseFloat(taxAmount.toFixed(2)),
      "beckn:currency": currency,
      "beckn:description": `Federal excise tax (${taxPercentage}%)`
    }
  );

  return {
    "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
    "@type": "beckn:Order",
    "beckn:id": onSelectResponse?.["beckn:id"] || initRequest?.["beckn:id"] || `order-flight-${Date.now()}`,
    "beckn:orderNumber": `BK-${Date.now().toString().slice(-6)}`, // Always system-generated
    "beckn:orderStatus": "INITIALIZED", // Always system-generated
    "beckn:seller": onSelectResponse?.["beckn:seller"] || initRequest?.["beckn:seller"] || {
      "@context": onSelectResponse?.["beckn:seller"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Provider",
      "beckn:id": "provider-delta-airlines"
    }, // Preserve context URL from previous if exists
    "beckn:buyer": initRequest?.["beckn:buyer"] || onSelectResponse?.["beckn:buyer"] || {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Buyer",
      "beckn:id": `buyer-${Date.now()}`,
      "beckn:role": "BUYER",
    }, // From request first, then previous
    "beckn:orderItems": (initRequest?.["beckn:orderItems"] || onSelectResponse?.["beckn:orderItems"] || []).map((item: any) => {
      const selectOrderItem = onSelectResponse?.["beckn:orderItems"]?.[0];
      const selectAcceptedOffer = selectOrderItem?.["beckn:acceptedOffer"];

      return {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "beckn:OrderItem",
        "beckn:lineId": item?.["beckn:lineId"] || selectOrderItem?.["beckn:lineId"] || "line-001",
        "beckn:orderedItem": item?.["beckn:orderedItem"] || selectOrderItem?.["beckn:orderedItem"],
        "beckn:quantity": item?.["beckn:quantity"] || selectOrderItem?.["beckn:quantity"] || 1,
        "beckn:acceptedOffer": {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "beckn:Offer",
          "beckn:id": selectAcceptedOffer?.["beckn:id"] || item?.["beckn:acceptedOffer"]?.["beckn:id"],
          "beckn:descriptor": selectAcceptedOffer?.["beckn:descriptor"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "beckn:Descriptor",
            "schema:name": "Main Cabin Economy Fare",
            "beckn:shortDesc": "Standard economy fare with carry-on bag included"
          },
          "beckn:price": selectAcceptedOffer?.["beckn:price"] || {
            "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
            "@type": "schema:PriceSpecification",
            "schema:priceCurrency": currency,
            "schema:price": basePrice
          },
          "beckn:addOnItems": addOnItems
        },
        "beckn:price": selectOrderItem?.["beckn:price"] || {
          "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
          "@type": "schema:PriceSpecification",
          "schema:priceCurrency": currency,
          "schema:price": basePrice
        },
        "beckn:orderItemAttributes": selectOrderItem?.["beckn:orderItemAttributes"] || {}
      };
    }),
    "beckn:orderValue": {
      "@context": onSelectResponse?.["beckn:orderValue"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "schema:PriceSpecification",
      "schema:priceCurrency": currency,
      "schema:price": parseFloat(totalValue.toFixed(2)),
      "beckn:components": components
    }, // Recalculate with add-ons (preserves context URL from previous on_select)
    "beckn:fulfillment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Fulfillment",
      "beckn:id": initRequest?.["beckn:fulfillment"]?.["beckn:id"] || onSelectResponse?.["beckn:fulfillment"]?.["beckn:id"] || `fulfillment-flight-${Date.now()}`,
      "beckn:mode": "FLIGHT",
      "beckn:status": "PENDING" // Always system-generated
    },
    "beckn:payment": {
      "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
      "@type": "beckn:Payment",
      "beckn:id": initRequest?.["beckn:payment"]?.["beckn:id"] || `payment-${Date.now()}`,
      "beckn:status": "NOT-PAID", // Always system-generated
      "beckn:amount": {
        "@context": "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld",
        "@type": "schema:PriceSpecification",
        "schema:priceCurrency": currency,
        "schema:price": parseFloat(totalValue.toFixed(2))
      },
      "beckn:beneficiary": "BPP",
      "beckn:acceptedPaymentMethod": initRequest?.["beckn:payment"]?.["beckn:acceptedPaymentMethod"] || [
        "Card",
        "Wallet",
        "UPI"
      ]
    },
    "beckn:orderAttributes": {
      ...(initRequest?.["beckn:orderAttributes"] || {}),
      "@context": initRequest?.["beckn:orderAttributes"]?.["@context"] || "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/FlightBooking/v1/context.jsonld",
      "@type": initRequest?.["beckn:orderAttributes"]?.["@type"] || "FlightBooking",
      "passengers": initRequest?.["beckn:orderAttributes"]?.["passengers"] || [],
      "cancellationTerms": [
        {
          "condition": "More than 24 hours before departure",
          "cancellationFee": 200.00,
          "refundEligible": true,
          "refundPercentage": 35
        },
        {
          "condition": "Less than 24 hours before departure",
          "cancellationFee": 280.00,
          "refundEligible": false
        }
      ]
    }
  };
};

